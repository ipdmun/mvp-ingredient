import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { RECIPE_PRESETS } from "@/app/lib/constants";

export const dynamic = 'force-dynamic';

// Initialize Google Gemini client lazily
const getGeminiModel = () => {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        throw new Error("Missing GOOGLE_API_KEY");
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
};

export async function POST(request: Request) {
    console.log("🔥 [API] AI Vision 요청: Google Gemini (1.5 Pro) 모드 가동 🔥");
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "파일이 없습니다." },
                { status: 400 }
            );
        }

        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            console.error("🔥 [API] GOOGLE_API_KEY is missing on server.");
            return NextResponse.json(
                { error: "구글(Gemini) API 키가 서버에 설정되지 않았습니다. (Vercel 환경변수 호환 확인 필요)" },
                { status: 500 }
            );
        }

        // Convert file to base64
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64Image = buffer.toString('base64');

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
   - 1열(이름)에 "41", "23" 같은 숫자가 섞여 있다면, 그것은 옆 칸(3열)의 가격이 침범한 것입니다. 과감히 삭제하거나 바로잡으십시오.
   - 예: "고추 41 0" -> (X) / "고추" (O), Price: 41000

2. **단위 분리**:
   - 수량과 단위가 붙어있을 수 있습니다 (15kg). 이를 amount: 15, unit: "kg"로 분리하십시오.
   - 숫자만 있다면 unit은 빈 문자열("")로 두십시오.
   - 단가가 아닌 **'총 가격(Total Price)'**을 입력해야 합니다.

3. **노이즈 제거**:
   - "합계", "미수금", "전잔" 같은 행은 제외하십시오.
   - 날짜나 전화번호, 상호명 등은 제외하십시오.

[Output Format]
반드시 **Valid JSON** 형식으로 출력하십시오. 마크다운(\`\`\`json)은 써도 되고 안 써도 됩니다.

{
  "items": [
    { "name": "양파", "amount": 1, "unit": "망", "price": 12000 },
    { "name": "대파", "amount": 10, "unit": "단", "price": 25000 }
  ],
  "analystReport": [
    "1번째 줄: '양파 1망 12000' 인식 성공. 3열 구조가 명확함.",
    "2번째 줄: '대파 10단 25000' 인식 성공.",
    "주의: 3번째 줄에 '4 5'라는 숫자가 이름 칸에 보였으나, 가격 열의 침범으로 판단하여 수정함."
  ]
}
`;

        const model = getGeminiModel();

        const result = await model.generateContent([
            systemPrompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: file.type
                }
            }
        ]);

        const response = await result.response;
        let text = response.text();

        console.log("🤖 Gemini Raw Response:", text);

        // Remove Markdown code blocks if present
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();

        // Safe JSON Parse
        let jsonResponse;
        try {
            jsonResponse = JSON.parse(text);
        } catch (e) {
            console.error("JSON Parse Error:", e);
            // Fallback for malformed JSON (basic array check)
            const match = text.match(/\[.*\]/s);
            if (match) {
                try {
                    // Try to construct a valid object if full parse fails
                    // NOTE: Gemini might return valid JSON wrapped in text.
                    // If match is found but it's just the items array, we need to wrap it.
                    // However, we asked for { items: [], analystReport: [] }
                    // Let's try to find the outermost brace
                    const braceMatch = text.match(/\{[\s\S]*\}/);
                    if (braceMatch) {
                        jsonResponse = JSON.parse(braceMatch[0]);
                    } else {
                        throw new Error("Invalid structure");
                    }
                } catch (e2) {
                    throw new Error("Invalid JSON response from Gemini");
                }
            } else {
                throw new Error("Invalid JSON response from Gemini");
            }
        }

        // Ensure structure
        if (!jsonResponse.items) jsonResponse.items = [];
        if (!jsonResponse.analystReport) jsonResponse.analystReport = [];


        // --- Post-processing: Market Analysis & Recipe Linking ---
        // Even with AI, we might want to attach our internal recipe data or market warnings.
        // The VLM does the extraction, we settle the internal logic here.

        // We can't dynamically import from @/app/lib/naver easily if not a top level usage sometimes,
        // but let's keep it as is if it worked before.
        // Actually, require/import inside handler is fine in Next.js.

        // Mock getMarketAnalysis if import fails or just empty logic for now to save time
        // Re-using the logic from previous OpenAI implementation

        const processedItems = await Promise.all(jsonResponse.items.map(async (item: any) => {
            // [Safety Check 1] Remove digits/special chars from name
            let cleanName = item.name.replace(/[0-9]/g, "").replace(/[!@#$%^&*(),?":{}|<>]/g, "").trim();

            // [Safety Check 2] Handle empty names
            if (!cleanName || cleanName.length < 1) {
                cleanName = "품목미상(확인필요)";
            }

            // [Safety Check 3] Unit normalization
            if (item.unit === 'bg') item.unit = '봉';
            if (item.unit === 'tkg') item.unit = 'kg';

            // [Safety Check 4] Aggressive Price Scaling
            if (item.price > 0 && item.price < 1000 && (item.unit === "kg" || item.unit === "망" || item.unit === "박스")) {
                if (item.price < 100) {
                    item.price = item.price * 1000;
                } else {
                    item.price = item.price * 100;
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
                        normItemName.includes(normIngName)
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

            return {
                ...item,
                name: cleanName,
                relatedRecipes,
                marketAnalysis: null // Skipping real market analysis for now to speed up
            };
        }));

        return NextResponse.json({
            items: processedItems,
            analystReport: jsonResponse.analystReport,
            rawText: "Google Gemini (1.5 Flash)",
            analystMode: true
        });

    } catch (error: any) {
        console.error("🚨 Gemini OCR Error:", error);
        let errorMessage = error.message || "이미지 인식 실패";
        if (errorMessage.includes("API_KEY")) {
            errorMessage = "구글 API 키가 설정되지 않았습니다. Vercel 환경변수를 확인해주세요.";
        }

        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
