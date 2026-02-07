import { NextResponse } from "next/server";
import OpenAI from "openai";
import { RECIPE_PRESETS } from "@/app/lib/constants";

export const dynamic = 'force-dynamic';

// Initialize OpenAI client lazily
const getOpenAIClient = () => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error("Missing OPENAI_API_KEY");
    }
    return new OpenAI({ apiKey });
};

export async function POST(request: Request) {
    console.log("🔥 [API] AI Vision 요청: 식자재 전문가(VLM) 모드 가동 🔥");
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "파일이 없습니다." },
                { status: 400 }
            );
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.error("🔥 [API] OPENAI_API_KEY is missing on server.");
            return NextResponse.json(
                { error: "구글/OpenAI API 키가 서버에 설정되지 않았습니다. (Vercel 환경변수 확인 필요)" },
                { status: 500 }
            );
        }

        // Convert file to base64
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64Image = buffer.toString('base64');
        const dataUrl = `data:${file.type};base64,${base64Image}`;

        // Construct the VLM Prompt
        const systemPrompt = `
당신은 한국 최고의 '식자재 장부 분석 전문가'입니다.
주어진 이미지는 **3개의 열(Column)로 구성된 손으로 쓴(Handwritten) 장부**입니다.
이미지를 **보이지 않는 3개의 수직선(Vertical Lines)**으로 나누어 분석하십시오.

[분석 모드: 3-Column Grid]
**이미지의 왼쪽부터 오른쪽으로 읽으면서 각 열에 해당하는 데이터만 추출하십시오.**

| 1열 (왼쪽) | 2열 (중간) | 3열 (오른쪽) |
| :--- | :--- | :--- |
| **식자재명** (Name) | **수량/단위** (Amount/Unit) | **가격** (Price) |
| 한글 위주 | 숫자+단위 | 숫자 (계산서 금액) |
| 예: 양파, 배추 | 15kg, 3모, 1봉 | 41,000, 3,500 |

[핵심 규칙 - 오인식 방지]
1. **열 침범 금지**:
   - 3열(오른쪽 끝)에 있는 숫자인 "41 0"이나 "23 00"을 절대 1열(이름)에 포함시키지 마십시오.
   - 이름 열에는 **오직 한글 식자재명**만 들어와야 합니다. (숫자 포함 금지)

2. **숫자 합치기 (Price Merging)**:
   - 3열(가격)의 숫자가 띄어쓰기 되어 있어도 하나로 합치십시오.
   - "4 1 0 0 0" -> 41,000원
   - "2 3 0 0" -> 2,300원

3. **이름 누락 방지**:
   - 만약 줄의 맨 앞에 **숫자**만 보인다면(예: "23 00"), 그건 **가격(3열)**입니다.
   - 그 줄의 **왼쪽(1열)**을 다시 자세히 들여다보세요. 흐릿하게 쓰여진 '무', '파' 같은 짧은 이름이 반드시 있습니다.

[JSON 출력 형식 - 엄격 준수]
반드시 아래 JSON 포맷만 반환하십시오.

\`\`\`json
{
  "items": [
    {
      "name": "식재료명 (String, 한글만)",
      "amount": 숫자 (Number),
      "unit": "단위 (String)",
      "price": 총금액_숫자 (Number, 쉼표 제외),
      "status": "정상"
    }
  ],
  "analystReport": [
    {
      "품목": "식재료명",
      "수량": "수량+단위",
      "단가": "금액 (3자리 쉼표 포함 + '원')",
      "상태": "정상"
    }
  ]
}
\`\`\`
`;

        const openai = getOpenAIClient();
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: [
                        { type: "text", text: "이 영수증/장부를 분석해서 식자재 내역을 JSON으로 추출해줘." },
                        {
                            type: "image_url",
                            image_url: {
                                url: dataUrl
                            }
                        }
                    ]
                }
            ],
            response_format: { type: "json_object" },
            max_tokens: 4096,
            temperature: 0.1, // Low temperature for factual extraction
        });

        const resultText = response.choices[0].message.content;
        console.log("🤖 AI Vision Result:", resultText);

        if (!resultText) {
            throw new Error("AI Vision returned empty response");
        }

        const parsedResult = JSON.parse(resultText);
        let items = parsedResult.items || [];
        let analystReport = parsedResult.analystReport || [];

        // --- Post-processing: Market Analysis & Recipe Linking ---
        // Even with AI, we might want to attach our internal recipe data or market warnings.
        // The VLM does the extraction, we settle the internal logic here.

        const { getMarketAnalysis } = await import("@/app/lib/naver");

        const processedItems = await Promise.all(items.map(async (item: any) => {
            // [Safety Check 1] Remove digits/special chars from name
            let cleanName = item.name.replace(/[0-9]/g, "").replace(/[!@#$%^&*(),?":{}|<>]/g, "").trim();
            console.log(`[OCR Safety] ${item.name} -> ${cleanName}`);

            // [Safety Check 2] Handle empty names (If name was only numbers/symbols)
            if (!cleanName || cleanName.length < 1) {
                cleanName = "품목미상(확인필요)"; // Fallback to 'Unknown' instead of reverting to original
            }

            // [Safety Check] Post-fix 'bg' to '봉'
            if (item.unit === 'bg') item.unit = '봉';
            if (item.unit === 'tkg') item.unit = 'kg';

            // [Safety Check 4] Aggressive Price Scaling
            // Logic: If price < 1000 and unit is 'kg' (bulk), it's highly likely x100 or x1000.
            // Example: "41 0" -> 410 (parsed) -> 41000 (corrected)
            if (item.price > 0 && item.price < 1000 && (item.unit === "kg" || item.unit === "망" || item.unit === "박스")) {
                if (item.price < 100) {
                    item.price = item.price * 1000; // e.g. 41 -> 41000
                } else {
                    item.price = item.price * 100; // e.g. 410 -> 41000
                }
            } else if (item.price > 0 && item.price < 5000 && (cleanName.includes("배추") || cleanName.includes("양파")) && item.amount >= 5) {
                // Specific heuristic for large quantity items
                if (item.price * 10 > 10000) { // Safety check to prevent insane prices
                    item.price = item.price * 10;
                }
            }

            // 1. Link Recipes
            const relatedRecipes: any[] = [];
            Object.entries(RECIPE_PRESETS).forEach(([recipeName, recipeData]) => {
                const hasIngredient = recipeData.ingredients.some(ing => {
                    const normIngName = ing.name.replace(/ /g, "");
                    const normItemName = cleanName.replace(/ /g, "");
                    return (
                        normIngName.includes(normItemName) ||
                        normItemName.includes(normIngName) ||
                        (normItemName.includes("간마늘") && normIngName.includes("다진마늘")) ||
                        (normItemName.includes("다진마늘") && normIngName.includes("간마늘"))
                    );
                });
                if (hasIngredient) {
                    relatedRecipes.push({
                        name: recipeName,
                        illustrationPrompt: recipeData.illustrationPrompt || "",
                        imageUrl: recipeData.imageUrl
                    });
                }
            });

            // 2. Market Analysis (Optional: Re-verify price if needed, or just flag)
            // Using the price from AI directly.
            let marketAnalysis = null;
            if (item.price > 0) {
                // Try to get market data for comparison
                try {
                    const analysis = await getMarketAnalysis(cleanName, item.price, item.unit, item.amount);
                    if (analysis) {
                        // Add warning logic if needed
                        const diffPercent = Math.abs(analysis.diff);
                        let warning = false;
                        let warningMessage = "";
                        if (diffPercent >= 30) {
                            warning = true;
                            warningMessage = analysis.diff > 0
                                ? `시장가보다 ${diffPercent}% 비쌉니다`
                                : `시장가보다 ${diffPercent}% 저렴합니다`;
                        }
                        marketAnalysis = { ...analysis, warning, warningMessage };
                    }
                } catch (e) {
                    console.warn("Market analysis failed for", cleanName);
                }
            }

            return {
                ...item,
                name: cleanName,
                relatedRecipes,
                marketAnalysis
            };
        }));

        // Re-generate analyst report with warnings if needed
        analystReport = processedItems.map((item: any) => ({
            "품목": item.name,
            "수량": `${item.amount}${item.unit}`,
            "단가": `${item.price.toLocaleString()}원`,
            "상태": item.marketAnalysis?.warning ? "가격주의" : "정상",
            "비고": item.relatedRecipes.length > 0 ? `레시피 ${item.relatedRecipes.length}건 연동` : ""
        }));

        return NextResponse.json({
            items: processedItems, // Internal App Use
            analystReport: analystReport, // User Requested Format
            rawText: "AI Vision Analysis",
            analystMode: true
        });

    } catch (error: any) {
        console.error("AI Vision API Error:", error);
        return NextResponse.json(
            { error: `AI 분석 중 오류가 발생했습니다: ${error.message}` },
            { status: 500 }
        );
    }
}
