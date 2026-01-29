"use client";

import { useState, useEffect } from "react";
import { Check, X, AlertTriangle, Loader2, Pencil, Trash2, Save } from "lucide-react";
import { createBulkIngredientPrices } from "@/app/ingredients/actions";
import { getIngredientIcon } from "@/app/lib/utils";

type MarketAnalysis = {
    cheapestSource: string;
    price: number;
    status: "BEST" | "GOOD" | "BAD";
    diff: number;
};

type OCRItem = {
    name: string;
    price: number; // Unit price (final calculated)
    unit: string;
    amount?: number; // Total weight/count
    originalPrice?: number; // Total price written
    marketAnalysis: MarketAnalysis;
};

type Props = {
    isOpen: boolean;
    onClose: () => void;
    items: OCRItem[];
    ingredients: { id: number; name: string }[];
};

export default function BulkPriceReviewModal({ isOpen, onClose, items, ingredients }: Props) {
    const [processedItems, setProcessedItems] = useState<OCRItem[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Partial<OCRItem>>({});

    useEffect(() => {
        if (isOpen) {
            setProcessedItems(items);
            setEditingIndex(null);
        }
    }, [isOpen, items]);

    if (!isOpen) return null;

    const handleDelete = (index: number) => {
        if (confirm("이 항목을 삭제하시겠습니까?")) {
            const newItems = [...processedItems];
            newItems.splice(index, 1);
            setProcessedItems(newItems);
        }
    };

    const startEdit = (index: number) => {
        setEditingIndex(index);
        setEditForm(processedItems[index]);
    };

    const cancelEdit = () => {
        setEditingIndex(null);
        setEditForm({});
    };

    const saveEdit = () => {
        if (editingIndex === null) return;

        const newItems = [...processedItems];
        const updatedOriginalPrice = Number(editForm.originalPrice) || 0;
        const updatedAmount = Number(editForm.amount) || 1;

        // Recalculate unit price: Total / Amount
        const finalUnitPrice = updatedOriginalPrice > 0
            ? Math.round(updatedOriginalPrice / updatedAmount)
            : (Number(editForm.price) || 0);

        newItems[editingIndex] = {
            ...newItems[editingIndex],
            ...editForm,
            originalPrice: updatedOriginalPrice,
            amount: updatedAmount,
            price: finalUnitPrice
        } as OCRItem;

        setProcessedItems(newItems);
        setEditingIndex(null);
    };

    const handleSave = async () => {
        if (processedItems.length === 0) {
            alert("저장할 항목이 없습니다.");
            return;
        }

        setIsSaving(true);
        try {
            const payload = processedItems.map(item => ({
                name: item.name,
                price: item.price,
                unit: item.unit,
                source: "영수증/장부"
            }));

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
                        📸 인식 결과 확인 ({processedItems.length}건)
                    </h2>
                    <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-100">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {processedItems.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            모든 항목이 삭제되었습니다.
                        </div>
                    ) : (
                        processedItems.map((item, idx) => (
                            <div key={idx} className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                                {editingIndex === idx ? (
                                    // Edit Mode
                                    <div className="flex flex-col gap-4 bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {/* Name Input */}
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">상품명</label>
                                                <input
                                                    className="rounded-md border border-gray-200 p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                                    value={editForm.name || ""}
                                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                                    placeholder="예: 양파, 계란"
                                                />
                                            </div>

                                            {/* Amount & Unit */}
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">수량/중량</label>
                                                    <input
                                                        className="rounded-md border border-gray-200 p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                                        type="number"
                                                        value={editForm.amount || ""}
                                                        onChange={e => setEditForm({ ...editForm, amount: Number(e.target.value) })}
                                                        placeholder="21"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">단위</label>
                                                    <input
                                                        className="rounded-md border border-gray-200 p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                                        value={editForm.unit || ""}
                                                        onChange={e => setEditForm({ ...editForm, unit: e.target.value })}
                                                        placeholder="kg, 개, 망"
                                                    />
                                                </div>
                                            </div>

                                            {/* Original Price */}
                                            <div className="flex flex-col gap-1 sm:col-span-2">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">적힌 총 가격 (원)</label>
                                                <input
                                                    className="rounded-md border border-gray-200 p-2 text-sm font-bold text-blue-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                                    type="number"
                                                    value={editForm.originalPrice || ""}
                                                    onChange={e => setEditForm({ ...editForm, originalPrice: Number(e.target.value) })}
                                                    placeholder="23000"
                                                />
                                                <p className="text-[10px] text-gray-400 mt-0.5 ml-1">* 중량에 맞춰 단위당 가격이 자동 계산됩니다.</p>
                                            </div>
                                        </div>

                                        <div className="flex justify-end items-center gap-3 pt-2 border-t border-gray-50">
                                            <button onClick={cancelEdit} className="text-xs text-gray-500 hover:text-gray-700 font-medium px-2 py-1">취소</button>
                                            <button onClick={saveEdit} className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm transition-all">
                                                <Save className="h-3.5 w-3.5" /> 저장하기
                                            </button>
                                        </div>
                                    </div>

                                ) : (
                                    // View Mode
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 shrink-0 rounded-full bg-blue-100 flex items-center justify-center font-bold text-2xl shadow-sm border border-blue-200">
                                                {getIngredientIcon(item.name)}
                                            </div>
                                            <div>
                                                <div className="flex items-baseline gap-2">
                                                    <p className="font-bold text-gray-900 text-lg">{item.name}</p>
                                                    {item.amount && (
                                                        <span className="text-sm text-gray-500 font-normal">({item.amount}{item.unit})</span>
                                                    )}
                                                </div>
                                                <div className="mt-0.5 space-y-0.5">
                                                    {item.originalPrice ? (
                                                        <p className="text-xs text-gray-400 font-medium">
                                                            총 {item.originalPrice.toLocaleString()}원 → <span className="text-blue-600 font-bold">{item.price.toLocaleString()}원</span> <span className="text-[10px] text-gray-400 font-normal">({item.unit}당)</span>
                                                        </p>
                                                    ) : (
                                                        <p className="text-sm text-gray-500 font-medium">{item.price.toLocaleString()}원 / {item.unit}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {/* Market Badge */}
                                            {item.marketAnalysis ? (
                                                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm min-w-[130px]">
                                                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${item.marketAnalysis.status === 'BEST' ? 'bg-green-100 text-green-600' :
                                                        item.marketAnalysis.status === 'BAD' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {item.marketAnalysis.status === 'BEST' && <Check className="h-4 w-4" />}
                                                        {item.marketAnalysis.status === 'BAD' && <AlertTriangle className="h-4 w-4" />}
                                                        {item.marketAnalysis.status === 'GOOD' && <Check className="h-4 w-4" />}
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-[10px] leading-tight text-gray-500">{item.marketAnalysis.cheapestSource} 대비</p>
                                                        <p className={`font-bold text-sm leading-tight ${item.marketAnalysis.status === 'BEST' ? 'text-green-600' :
                                                            item.marketAnalysis.status === 'BAD' ? 'text-red-600' : 'text-gray-600'
                                                            }`}>
                                                            {item.marketAnalysis.diff > 0 ? `+${item.marketAnalysis.diff.toLocaleString()}원` : `${item.marketAnalysis.diff.toLocaleString()}원`}
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-[10px] text-gray-400 italic">시장 분석 데이터 없음</div>
                                            )}

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => startEdit(idx)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleDelete(idx)} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 p-6 flex justify-end gap-3 bg-white rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="rounded-lg px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        취소
                    </button>
                    {editingIndex === null && (
                        <button
                            onClick={handleSave}
                            disabled={isSaving || processedItems.length === 0}
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-md animate-in slide-in-from-bottom-2"
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
                    )}
                </div>
            </div>
        </div>
    );
}
