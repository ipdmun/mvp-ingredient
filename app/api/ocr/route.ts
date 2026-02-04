
import { NextResponse } from "next/server";

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
            // Fallback to Mock if no key (for smoother dev experience if user forgets)
            // But we should probably error out or warn. Let's error out to force them to add it as requested.
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
                    ]
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
        const lines = fullText.split('\n').filter((line: string) => line.trim() !== "");
        const parsedItems = lines.map((line: string) => {
            // Very naive parser: tries to find numbers for price/amount
            // Format assumptions: "Name Amount Unit Price" or mixed

            // Extract Price (largest number usually)
            const numbers = line.match(/[\d,]+/g)?.map(n => parseInt(n.replace(/,/g, ''))) || [];
            let price = 0;
            let amount = 1;

            if (numbers.length > 0) {
                price = Math.max(...numbers);
            }

            // Extract Unit (kg, g, l, ml, 개, 박스, 망)
            const unitMatch = line.match(/(kg|g|ml|l|개|박스|망)/i);
            const unit = unitMatch ? unitMatch[0] : "개";

            // Extract Name (remove numbers and special chars roughly)
            let name = line.replace(/[\d,]/g, '').replace(/(kg|g|ml|l|개|박스|망|원)/gi, '').trim();
            if (name.length === 0) name = "알 수 없음";

            return {
                name: name,
                originalPrice: price,
                amount: amount, // Default to 1 for now, hard to parse "3kg" vs "3" without more logic
                unit: unit,
                price: price, // Default unit price to total price for safety
                marketAnalysis: null // Reset analysis
            };
        });

        return NextResponse.json({
            items: parsedItems,
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
