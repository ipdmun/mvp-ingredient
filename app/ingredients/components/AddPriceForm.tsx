"use client";

import { useState, useRef } from "react";
import { Plus, Camera, Loader2, X, Check } from "lucide-react";
import { createIngredientPrice } from "../actions";

type Props = {
    ingredientId: number;
    unit: string;
};

export default function AddPriceForm({ ingredientId, unit }: Props) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [candidates, setCandidates] = useState<number[]>([]);
    const [showModal, setShowModal] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const priceInputRef = useRef<HTMLInputElement>(null);

    // 1. 파일 선택 시 OCR API 호출
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsProcessing(true);
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/ocr", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("OCR Failed");

            const data = await res.json();
            // 0원 이하, 너무 작은 값 제외하고 정렬
            const validCandidates = (data.candidates as number[])
                .filter((p) => p > 100)
                .sort((a, b) => b - a); // 큰 값부터 (보통 총액이 맨 위)

            setCandidates(validCandidates);
            setShowModal(true);
        } catch (error) {
            alert("영수증 인식에 실패했습니다. 직접 입력해주세요.");
            console.error(error);
        } finally {
            setIsProcessing(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = ""; // 초기화
            }
        }
    };

    // 2. 가격 선택 시 폼에 입력
    const selectPrice = (price: number) => {
        if (priceInputRef.current) {
            priceInputRef.current.value = price.toString();
            // 시각적 강조 효과
            priceInputRef.current.focus();
            priceInputRef.current.style.backgroundColor = "#ecfeff";
            setTimeout(() => {
                if (priceInputRef.current) priceInputRef.current.style.backgroundColor = "";
            }, 1000);
        }
        setShowModal(false);
    };

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center justify-between text-sm font-semibold text-gray-900">
                <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-blue-600" />
                    새 가격 정보 추가
                </div>

                {/* OCR 버튼 */}
                <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                >
                    {isProcessing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                        <Camera className="h-3.5 w-3.5" />
                    )}
                    {isProcessing ? "인식 중..." : "영수증 인식(Beta)"}
                </button>
            </h3>

            {/* 숨겨진 파일 인풋 */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                capture="environment" // 모바일에서 카메라 바로 실행
                onChange={handleFileChange}
            />

            <form
                action={async (formData) => {
                    await createIngredientPrice(ingredientId, formData);
                    // 폼 초기화는 createIngredientPrice 내부의 revalidatePath로 페이지가 갱신되면서 처리됨
                    // 하지만 클라이언트 input value는 남아있을 수 있어 수동 초기화 필요할 수 있음
                    if (priceInputRef.current) priceInputRef.current.value = "";
                }}
                className="space-y-4"
            >
                <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                        <label className="mb-1 block text-xs font-medium text-gray-700">총 가격</label>
                        <input
                            ref={priceInputRef}
                            name="price"
                            type="number"
                            placeholder="0"
                            required
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                        />
                    </div>
                    <div className="col-span-1">
                        <label className="mb-1 block text-xs font-medium text-gray-700">구매 수량</label>
                        <input
                            name="amount"
                            type="number"
                            step="0.01"
                            placeholder="1"
                            defaultValue="1"
                            required
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                        />
                    </div>
                    <div className="col-span-1">
                        <label className="mb-1 block text-xs font-medium text-gray-700">단위</label>
                        <input
                            name="unit"
                            defaultValue={unit.toLowerCase()}
                            required
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm border-gray-100 bg-gray-50 text-gray-500"
                            readOnly
                        />
                    </div>
                </div>
                <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">출처 (마트/시장명)</label>
                    <input
                        name="source"
                        placeholder="예: 가락시장, 쿠팡"
                        required
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>
                <button type="submit" className="w-full rounded-md bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                    가격 등록하기
                </button>
            </form>

            {/* 가격 선택 모달 */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl animate-in zoom-in-95 duration-200">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">가격 선택</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <p className="mb-4 text-sm text-gray-600">영수증에서 발견된 가격입니다.<br />맞는 금액을 선택해주세요.</p>

                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {candidates.length > 0 ? candidates.map((price, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => selectPrice(price)}
                                    className="flex w-full items-center justify-between rounded-lg border border-gray-200 p-3 hover:bg-blue-50 hover:border-blue-200 transition-all text-left group"
                                >
                                    <span className="font-bold text-gray-900 text-lg group-hover:text-blue-700">
                                        {price.toLocaleString()}원
                                    </span>
                                    <span className="text-gray-300 group-hover:text-blue-500">
                                        <Check className="h-4 w-4" />
                                    </span>
                                </button>
                            )) : (
                                <div className="text-center py-4 text-gray-500">
                                    인식된 가격이 없습니다.
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setShowModal(false)}
                            className="mt-4 w-full rounded-lg bg-gray-100 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-200"
                        >
                            직접 입력하기
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
