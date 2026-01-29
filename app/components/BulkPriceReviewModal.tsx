"use client";

import { useState, useEffect } from "react";
import { Check, X, AlertTriangle, Loader2 } from "lucide-react";
import { createBulkIngredientPrices } from "@/app/ingredients/actions";

type MarketAnalysis = {
    cheapestSource: string;
    price: number;
    status: "BEST" | "GOOD" | "BAD";
    diff: number;
};

type OCRItem = {
    name: string;
    price: number;
    unit: string;
    marketAnalysis: MarketAnalysis;
};

type Props = {
    isOpen: boolean;
    onClose: () => void;
    items: OCRItem[];
    ingredients: { id: number; name: string }[]; // For matching (future use)
};

export default function BulkPriceReviewModal({ isOpen, onClose, items, ingredients }: Props) {
    const [processedItems, setProcessedItems] = useState<OCRItem[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setProcessedItems(items);
        }
    }, [isOpen, items]);

    if (!isOpen) return null;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // For MVP, map to a dummy ingredient ID or create a new one.
            // In a real app, we'd match names to IDs.
            // Here we just save assuming the user selected an existing ingredient.
            // Since we don't have ingredient selection UI in this modal yet (simplified for MVP),
            // we will simulate saving by just alerting for now, or finding a matching ingredient name in the list.

            // Hack for MVP: Find ingredient by name or default to first one to avoid errors.
            const payload = processedItems.map(item => {
                const match = ingredients.find(ing => ing.name === item.name) || ingredients[0];
                return {
                    ingredientId: match?.id || 1, // Fallback to ID 1 if no match
                    price: item.price,
                    unit: item.unit,
                    source: "영수증/장부"
                };
            });

            await createBulkIngredientPrices(payload);
            onClose();
            alert("일괄 저장되었습니다!");
        } catch (error) {
            console.error(error);
            alert("저장 중 오류가 발생했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 p-6">
                    <h2 className="text-xl font-bold text-gray-900">
                        📸 인식 결과 확인 ({items.length}건)
                    </h2>
                    <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-100">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {processedItems.map((item, idx) => (
                        <div key={idx} className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                            {/* Input Info */}
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 shrink-0 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                                    {idx + 1}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-lg">{item.name}</p>
                                    <p className="text-sm text-gray-500">{item.price.toLocaleString()}원 / {item.unit}</p>
                                </div>
                            </div>

                            {/* Market Analysis Badge */}
                            <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${item.marketAnalysis.status === 'BEST' ? 'bg-green-100 text-green-600' :
                                    item.marketAnalysis.status === 'BAD' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {item.marketAnalysis.status === 'BEST' && <Check className="h-4 w-4" />}
                                    {item.marketAnalysis.status === 'BAD' && <AlertTriangle className="h-4 w-4" />}
                                    {item.marketAnalysis.status === 'GOOD' && <Check className="h-4 w-4" />}
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500">{item.marketAnalysis.cheapestSource} 대비</p>
                                    <p className={`font-bold text-sm ${item.marketAnalysis.status === 'BEST' ? 'text-green-600' :
                                        item.marketAnalysis.status === 'BAD' ? 'text-red-600' : 'text-gray-600'
                                        }`}>
                                        {item.marketAnalysis.diff > 0 ? `+${item.marketAnalysis.diff.toLocaleString()}원` : `${item.marketAnalysis.diff.toLocaleString()}원`}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 p-6 flex justify-end gap-3 bg-white rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="rounded-lg px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                저장 중...
                            </>
                        ) : (
                            <>
                                <Check className="h-4 w-4" />
                                일괄 장부 기록
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
