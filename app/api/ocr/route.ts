
import { NextResponse } from "next/server";
import { getMarketAnalysis } from "@/app/lib/naver";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    console.log("🔥 [API] OCR 요청이 들어왔습니다! (Real Google Vision Code) 🔥");
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "파일이 없습니다." },
                { status: 400 }
            );
        }

        const apiKey = process.env.GOOGLE_VISION_API_KEY;
        if (!apiKey) {
            console.warn("GOOGLE_VISION_API_KEY is missing. Falling back to Mock for demo purposes, but warning user.");
            return NextResponse.json(
                { error: "Google Vision API 키가 설정되지 않았습니다. .env 파일을 확인해주세요." },
                { status: 500 }
            );
        }

        // Convert file to base64
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64Image = buffer.toString('base64');

        // Call Google Vision API
        const apiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
        const requestBody = {
            requests: [
                {
                    image: {
                        content: base64Image
                    },
                    features: [
                        {
                            type: "TEXT_DETECTION"
                        }
                    ],
                    imageContext: {
                        languageHints: ["ko", "en"]
                    }
                }
            ]
        };

        const visionRes = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!visionRes.ok) {
            const errorText = await visionRes.text();
            throw new Error(`Google Vision API Error: ${visionRes.status} ${errorText}`);
        }

        const visionData = await visionRes.json();
        const fullText = visionData.responses[0]?.fullTextAnnotation?.text || "";

        console.log("[OCR] Raw Text:", fullText);

        // Basic Parsing Logic
        // OCR Logic 2.0: Receipt Structure Awareness
        const NOISE_KEYWORDS = ["합계", "면세", "과세", "결제", "카드", "주소", "TEL", "사업자", "대표", "전화", "영수증", "문의", "반품"];

        const lines = fullText.split('\n').filter((line: string) => {
            const trimmed = line.trim();
            if (trimmed.length < 2) return false; // Too short
            if (NOISE_KEYWORDS.some(keyword => trimmed.includes(keyword))) return false; // Header/Footer noise
            return true;
        });

        // --- Market Analysis Logic ---

        // Helper to perform analysis for each item using the shared service
        // We fetch Naver data individually for each item now, or we could batch-prefetch if we knew the items ahead of time.
        // For OCR results, we iterate and resolve.

        // Note: The previous logic fetched *all* static keys first. 
        // With the new service, we can just fetch on demand or pre-fetch if we really want to optimize specific keys.
        // Given the token-based parsing happens *before* we know the final names, we might need to adjust the flow.

        // Actually, the parsing logic below extracts the name first. 
        // So we should parse first, THEN analyze prices.

        // Refactored Flow:
        // 1. Parse Text -> Extract Name, Price, Unit
        // 2. Iterate Parsed Items -> Call getMarketAnalysis(name, price...)

        // Moving parsing logic UP, before analysis definition.

        const parsedItems = lines.map((line: string) => {
            let text = line.trim();

            // Fix spaced numbers (common in handwriting OCR): "12 000" -> "12000"
            text = text.replace(/(\d{1,3})\s+(000|00)\b/g, '$1$2');

            // --- OCR Logic 3.0: Token-Based Parsing (Mixed Order Support) ---

            // 1. Identify Price (Heuristic: Largest integer in the line)
            // Extract all numbers (removing commas)
            const numbers = text.match(/[\d,]+/g)?.map(n => parseInt(n.replace(/,/g, ''), 10)) || [];
            let price = 0;
            if (numbers.length > 0) {
                // Assumption: Price is often >= 100, but we just take the max for now
                price = Math.max(...numbers);
            }

            // Remove the price from the text to avoid confusing it with amount
            if (price > 0) {
                // Regex to find the price number, possibly formatted with commas, optionally followed by '원'
                const priceRegex = new RegExp(`(^|\\s)${price.toLocaleString()}(원)?(\\s|$)`);
                const simplePriceRegex = new RegExp(`(^|\\s)${price}(원)?(\\s|$)`);

                if (priceRegex.test(text)) {
                    text = text.replace(priceRegex, ' ');
                } else if (simplePriceRegex.test(text)) {
                    text = text.replace(simplePriceRegex, ' ');
                } else {
                    // Fallback: replace first occurrence of the number string
                    text = text.replace(price.toString(), '');
                }
            }

            // 2. Extract Unit & Amount (e.g., "15kg", "3개")
            // Look for Number + Unit pattern
            let amount = 1;
            let unit = "개";

            // Regex for Amount+Unit (e.g., 15kg, 15.5g)
            const amountUnitMatch = text.match(/([\d\.]+)\s*(kg|g|ml|l|개|박스|망|단|봉|캔|병)/i);

            if (amountUnitMatch) {
                amount = parseFloat(amountUnitMatch[1]);
                unit = amountUnitMatch[2];
                // Remove this token from text
                text = text.replace(amountUnitMatch[0], ' ');
            } else {
                // If no attached unit, look for standalone unit keyword
                const unitMatch = text.match(/\b(kg|g|ml|l|개|박스|망|단|봉|캔|병)\b/i);
                if (unitMatch) {
                    unit = unitMatch[0];
                    text = text.replace(unitMatch[0], ' ');
                }
            }

            // 3. Cleanup Name
            // Remove leading special chars, indices, etc.
            let name = text.replace(/[0-9]+\./, '') // remove "1."
                .replace(/[^\w가-힣\s]/g, ' ') // replace special chars with space
                .replace(/\s+/g, ' ') // collapse spaces
                .trim();

            // If name is purely numeric now (artifacts), it's invalid
            if (/^\d+$/.test(name)) return null;
            if (!name) return null;

            return {
                name: name,
                originalPrice: price,
                amount: amount,
                unit: unit,
                price: price, // Total price from receipt
            };
        }).filter((item: any) => item !== null && item.originalPrice > 0);

        // --- Market Analysis Logic (Async) ---
        const analyzedItems = await Promise.all(
            parsedItems.map(async (item: any) => {
                const analysis = await getMarketAnalysis(item.name, item.price, item.unit, item.amount);
                return {
                    ...item,
                    marketAnalysis: analysis
                };
            })
        );

        return NextResponse.json({
            items: analyzedItems,
            rawText: fullText,
        });

    } catch (error) {
        console.error("OCR Error:", error);
        return NextResponse.json(
            { error: "OCR 처리 중 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
