import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { RECIPE_PRESETS } from "@/app/lib/constants";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    console.log("🔥 [API] AI Vision 요청: Google Gemini (Auto-Fallback) 모드 가동 🔥");
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
        console.log(`🔑 API Key Loaded: ${apiKey.substring(0, 4)}...****** (${apiKey.length} chars)`);

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

        const cleanedApiKey = apiKey.trim();
        console.log(`🔑 API Key Configured: ${cleanedApiKey.substring(0, 4)}...****** (Len: ${cleanedApiKey.length})`);

        const genAI = new GoogleGenerativeAI(cleanedApiKey);

        // Priority List of Models to Try (Updated based on Key Permissions)
        const modelsToTry = [
            "gemini-2.0-flash",     // Confirmed Available
            "gemini-2.0-flash-lite", // Confirmed Available
            "gemini-flash-latest",   // General Alias
            "gemini-1.5-flash",      // Standard
            "gemini-1.5-pro",
            "gemini-pro"
        ];

        let text = null;
        let usedModel = "";
        const errorLogs: string[] = [];

        for (const modelName of modelsToTry) {
            try {
                console.log(`📡 Trying Model: ${modelName}...`);
                // Use v1beta for widest model support (especially 1.5 series)
                const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1beta' });

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
                text = response.text();
                usedModel = modelName;
                console.log(`✅ Success with Model: ${modelName}`);
                break; // Stop if success
            } catch (error: any) {
                console.warn(`⚠️ Failed with Model: ${modelName}`, error.message);
                errorLogs.push(error.message);
                // Continue to next model
            }
        }

        if (!text) {
            // Diagnostic: Try to list models via raw HTTP to check key permissions/visibility
            let debugInfo = "";
            try {
                const listResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${cleanedApiKey}`);
                if (listResp.ok) {
                    const listData = await listResp.json();
                    const availableModels = (listData.models || []).map((m: any) => m.name).join(", ");
                    debugInfo = `\n[Key Valid] Available Models: ${availableModels}`;
                } else {
                    const errText = await listResp.text();
                    debugInfo = `\n[Key Error] ListModels failed (${listResp.status}): ${errText}`;
                }
            } catch (e) {
                debugInfo = `\n[Network Error] Could not list models: ${e}`;
            }

            const detailedErrorLog = modelsToTry.map((m, i) => `[${m}]: ${errorLogs[i] || 'Unknown Error'}`).join('\n');
            throw new Error(`모든 모델 연결 실패 (Key 진단 결과:${debugInfo}):\n${detailedErrorLog}`);
        }

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
            const match = text.match(/\[[\s\S]*\]/);
            if (match) {
                try {
                    // Try to construct a valid object if full parse fails
                    const braceMatch = text.match(/\{[\s\S]*\}/);
                    if (braceMatch) {
                        jsonResponse = JSON.parse(braceMatch[0]);
                    } else {
                        // As a fallback, try to parse just the array if that's all we got
                        const items = JSON.parse(match[0]);
                        jsonResponse = { items, analystReport: ["JSON 파싱 실패로 자동 복구됨"] };
                    }
                } catch (e2) {
                    throw new Error("Invalid JSON response from Gemini");
                }
            } else {
                try {
                    const fixedText = text.replace(/,(\s*[}\]])/g, '$1');
                    jsonResponse = JSON.parse(fixedText);
                } catch (e3) {
                    throw new Error("Invalid JSON response from Gemini");
                }
            }
        }

        // ... (Previous code remains, but I need to inject logic after obtaining jsonResponse)

        // Ensure structure
        if (!jsonResponse.items) jsonResponse.items = [];
        // Reset analystReport for our own generation
        jsonResponse.analystReport = [];

        const businessReport: string[] = [];
        let totalSavings = 0;
        let totalLoss = 0;

        // --- Post-processing: Market Analysis & Recipe Linking ---
        // Dynamically import server action for market price check
        const { checkMarketPrice } = await import("@/app/ingredients/actions");

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

            // Calculate Unit Price for comparison (if amount is present)
            let unitPrice = item.price;
            if (item.amount && item.amount > 0) {
                unitPrice = Math.round(item.price / item.amount);
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

            // 2. Perform Market Analysis (Comparison)
            let marketAnalysis = null;
            try {
                marketAnalysis = await checkMarketPrice(cleanName, unitPrice, item.unit, item.amount || 1);
            } catch (e) {
                console.error("Market Price Check Error for", cleanName, e);
            }

            // Accumulate Savings/Loss
            if (marketAnalysis) {
                // diff > 0 means current price is EXPENSIVE (Loss)
                // diff < 0 means current price is CHEAPER (Savings)
                if (marketAnalysis.diff < 0) {
                    totalSavings += Math.abs(marketAnalysis.diff * (item.amount || 1));
                } else if (marketAnalysis.diff > 0) {
                    totalLoss += (marketAnalysis.diff * (item.amount || 1));
                }
            }

            // Create specific insight for significant differences
            if (marketAnalysis && Math.abs(marketAnalysis.diff) > 1000) {
                const diff = marketAnalysis.diff;
                if (diff > 0) {
                    businessReport.push(`📉 ${cleanName}: 평소보다 ${diff.toLocaleString()}원 비싸게 구매하셨어요. 다음엔 ${marketAnalysis.cheapestSource} 확인해보세요!`);
                } else {
                    businessReport.push(`🎉 ${cleanName}: ${Math.abs(diff).toLocaleString()}원이나 저렴하게 득템하셨네요! (시장가 대비)`);
                }
            }


            return {
                ...item,
                name: cleanName,
                relatedRecipes,
                marketAnalysis // Attach the real analysis
            };
        }));

        // Finalize Business Report
        const netSavings = totalSavings - totalLoss;
        const monthlyProjection = netSavings * 4; // Assuming weekly shopping

        const finalReport = [];

        // Title
        if (netSavings > 0) {
            finalReport.push(`💰 사장님! 이번 장보기로 ${netSavings.toLocaleString()}원을 아끼셨네요!`);
            finalReport.push(`한 달이면 약 ${monthlyProjection.toLocaleString()}원을 절약하실 수 있어요.`);
        } else if (netSavings < 0) {
            finalReport.push(`💡 사장님! 이번엔 평소보다 ${Math.abs(netSavings).toLocaleString()}원 더 지출하셨어요.`);
            finalReport.push(`앱에서 최저가를 확인하고 구매하시면 한 달에 약 ${Math.abs(monthlyProjection).toLocaleString()}원을 아낄 수 있어요!`);
        } else {
            finalReport.push(`✅ 합리적인 소비를 하셨군요! 시장 평균 가격과 비슷합니다.`);
        }

        // Add specific insights
        finalReport.push(...businessReport);

        // Add footer
        finalReport.push(`(기준: 네이버 및 도매시장 평균 단가 비교)`);

        return NextResponse.json({
            items: processedItems,
            analystReport: finalReport,
            rawText: `Google Gemini (${usedModel})`, // Return used model name
            analystMode: true
        });

    } catch (error: any) {
        // ... (error handling)        console.error("🚨 Gemini OCR Error:", error);
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
