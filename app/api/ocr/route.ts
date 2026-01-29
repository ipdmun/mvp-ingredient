
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "파일이 없습니다." },
                { status: 400 }
            );
        }

        // 여기에 Google Vision API 연동 코드가 들어갑니다.
        // 지금은 Mock Data(가짜 결과)를 반환하여 UX를 테스트합니다.

        // 1. 실제 구현 시: 
        // const buffer = Buffer.from(await file.arrayBuffer());
        // const [result] = await client.textDetection(buffer);
        // const text = result.fullTextAnnotation?.text || "";

        console.log(`[OCR Mock] Received file: ${file.name}, size: ${file.size}`);

        // 2. 가상 딜레이 (1.5초) - 실제 OCR처럼 느끼게
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // 3. 가상 데이터 반환 (Bulk & Market Analysis)
        const mockItems = [
            {
                name: "양파 (1.5kg)",
                price: 4980,
                unit: "망",
                marketAnalysis: {
                    cheapestSource: "쿠팡",
                    price: 4500,
                    status: "BAD", // 더 비쌈
                    diff: 480
                }
            },
            {
                name: "판계란 (30구)",
                price: 7900,
                unit: "판",
                marketAnalysis: {
                    cheapestSource: "이마트몰",
                    price: 8900,
                    status: "BEST", // 더 저렴 (이득)
                    diff: -1000
                }
            },
            {
                name: "무 (1개)",
                price: 1500,
                unit: "개",
                marketAnalysis: {
                    cheapestSource: "시장",
                    price: 1500,
                    status: "GOOD", // 적정가
                    diff: 0
                }
            },
            {
                name: "통마늘 (1kg)",
                price: 12000,
                unit: "kg",
                marketAnalysis: {
                    cheapestSource: "노브랜드",
                    price: 9900,
                    status: "BAD",
                    diff: 2100
                }
            }
        ];

        return NextResponse.json({
            items: mockItems,
            rawText: "양파 4980원\n계란 7900원\n무 1500원...",
        });

    } catch (error) {
        console.error("OCR Error:", error);
        return NextResponse.json(
            { error: "OCR 처리 중 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
