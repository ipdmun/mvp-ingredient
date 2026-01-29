
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
        // 사용자가 올린 사진 데이터에 맞춰 Mock 업데이트
        const mockItems = [
            {
                name: "양파",
                originalPrice: 41000,
                amount: 15,
                unit: "kg",
                price: Math.round(41000 / 15), // 단위당 가격 (2733원)
                marketAnalysis: {
                    cheapestSource: "식자재마트",
                    price: 2500,
                    status: "BAD",
                    diff: 233
                }
            },
            {
                name: "무",
                originalPrice: 23000,
                amount: 21,
                unit: "kg",
                price: Math.round(23000 / 21), // 단위당 가격 (1095원)
                marketAnalysis: {
                    cheapestSource: "쿠팡",
                    price: 1500,
                    status: "BEST",
                    diff: -405
                }
            },
            {
                name: "간마늘",
                originalPrice: 12000,
                amount: 5,
                unit: "kg",
                price: Math.round(12000 / 5), // 단위당 가격 (2400원)
                marketAnalysis: {
                    cheapestSource: "노브랜드",
                    price: 2100,
                    status: "BAD",
                    diff: 300
                }
            }
        ];

        return NextResponse.json({
            items: mockItems,
            rawText: "양파 15kg 41,000\n무 21kg 23,000\n진마늘 5kg 12,000",
        });


    } catch (error) {
        console.error("OCR Error:", error);
        return NextResponse.json(
            { error: "OCR 처리 중 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
