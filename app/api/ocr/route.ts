
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

        // 3. 가상 데이터 반환
        // 실제로는 정규식으로 추출된 숫자들을 반환해야 함.
        const mockCandidates = [
            12500, // 가장 유력한 가격
            19800, // 다른 상품 가격
            5000,  // 배송비?
            100    // 잡음
        ];

        return NextResponse.json({
            candidates: mockCandidates,
            rawText: "가상 영수증 인식 텍스트...",
        });

    } catch (error) {
        console.error("OCR Error:", error);
        return NextResponse.json(
            { error: "OCR 처리 중 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
