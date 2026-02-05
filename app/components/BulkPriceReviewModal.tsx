"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, X, AlertTriangle, Loader2, Pencil, Trash2, Save, Plus } from "lucide-react";
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

    const saveEdit = async () => {
        if (editingIndex === null) return;

        const updatedOriginalPrice = Number(editForm.originalPrice) || 0;
        const updatedAmount = Number(editForm.amount) || 1;

        // Recalculate unit price: Total / Amount
        const finalUnitPrice = updatedOriginalPrice > 0
            ? Math.round(updatedOriginalPrice / updatedAmount)
            : (Number(editForm.price) || 0);

        // Fetch new market analysis if name or price changed
        const currentItem = processedItems[editingIndex];
        let newMarketAnalysis = currentItem.marketAnalysis;

        if (editForm.name !== currentItem.name || finalUnitPrice !== currentItem.price) {
            try {
                // Dynamically import logic or call server action
                const { checkMarketPrice } = await import("@/app/ingredients/actions");
                const analysis = await checkMarketPrice(
                    editForm.name || currentItem.name,
                    finalUnitPrice,
                    editForm.unit || currentItem.unit,
                    updatedAmount
                );
                if (analysis) {
                    newMarketAnalysis = analysis;
                }
            } catch (e) {
                console.error("Failed to update market analysis", e);
            }
        }

        const newItems = [...processedItems];
        newItems[editingIndex] = {
            ...newItems[editingIndex],
            ...editForm,
            originalPrice: updatedOriginalPrice,
            amount: updatedAmount,
            price: finalUnitPrice,
            marketAnalysis: newMarketAnalysis
        } as OCRItem;

        setProcessedItems(newItems);
        setEditingIndex(null);
    };

    const handleAddItem = () => {
        const newItem: OCRItem = {
            name: "",
            price: 0,
            unit: "kg",
            amount: 1,
            originalPrice: 0,
            marketAnalysis: null as any
        };
        const newItems = [...processedItems, newItem];
        setProcessedItems(newItems);
        setEditingIndex(newItems.length - 1);
        setEditForm(newItem);
    };

    const router = useRouter();

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
                source: "영수증/장부",
                amount: item.amount,
                originalPrice: item.originalPrice,
                marketData: item.marketAnalysis // Pass market data to server action
            }));

            await createBulkIngredientPrices(payload);

            // Wait a bit for DB propagation to ensure the list updates correctly
            await new Promise(resolve => setTimeout(resolve, 1000));

            onClose();
            alert("일괄 저장되었습니다!");

            // Hard Refresh to ensure data is visible
            window.location.reload();
            // router.refresh(); // Temporarily using reload to be 100% sure for the user
        } catch (error) {
            console.error(error);
            alert("저장 중 오류가 발생했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 p-6 bg-white shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">📸 인식 결과 확인</h2>
                        <p className="text-xs text-gray-500 mt-1">{processedItems.length}개의 품목이 인식되었습니다.</p>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-100 transition-colors">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
                    {processedItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <Trash2 className="h-12 w-12 mb-2 opacity-20" />
                            <p>모든 항목이 삭제되었습니다.</p>
                        </div>
                    ) : (
                        processedItems.map((item, idx) => (
                            <div key={idx} className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm group hover:border-blue-200 transition-all">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 shrink-0 rounded-2xl bg-blue-50 flex items-center justify-center font-bold text-2xl shadow-inner border border-blue-100">
                                            {getIngredientIcon(item.name)}
                                        </div>
                                        <div>
                                            <div className="flex items-baseline gap-2">
                                                <p className="font-bold text-gray-900 text-lg">{item.name}</p>
                                                {item.amount && (
                                                    <span className="text-sm text-gray-500 font-normal">({item.amount}{item.unit})</span>
                                                )}
                                            </div>
                                            <div className="mt-0.5">
                                                {item.originalPrice ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-gray-400">총 {item.originalPrice.toLocaleString()}원</span>
                                                        <span className="h-3 w-[1px] bg-gray-200" />
                                                        <span className="text-blue-600 font-black text-sm">{item.price.toLocaleString()}원 <span className="text-[10px] font-normal">({item.unit}당)</span></span>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-900 font-bold">{item.price.toLocaleString()}원 / {item.unit}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 mt-3 sm:mt-0">
                                        {/* Market Badge (Redesigned) */}
                                        {item.marketAnalysis ? (
                                            <div className="w-full sm:w-auto mt-2 sm:mt-0 p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-end gap-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="flex h-4 w-4 items-center justify-center rounded bg-[#03C75A] text-[9px] font-black text-white">N</span>
                                                    {(item.marketAnalysis as any).link ? (
                                                        <a
                                                            href={(item.marketAnalysis as any).link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-blue-500 underline truncate max-w-[100px] hover:text-blue-700"
                                                        >
                                                            {item.marketAnalysis.cheapestSource.replace("네이버최저가(", "").replace(")", "")}
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 truncate max-w-[100px]">
                                                            {item.marketAnalysis.cheapestSource.replace("네이버최저가(", "").replace(")", "")}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-black ${item.marketAnalysis.diff > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                        {item.marketAnalysis.diff > 0 ? '+' : ''}{item.marketAnalysis.diff.toLocaleString()}원
                                                    </span>
                                                    <span className="text-xs text-black font-bold">
                                                        ({item.marketAnalysis.price.toLocaleString()}원)
                                                    </span>

                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-gray-300">데이터 없음</span>
                                        )}

                                        <div className="flex items-center gap-1">
                                            <button onClick={() => startEdit(idx)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => handleDelete(idx)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 p-6 bg-white shrink-0 flex flex-col gap-3">
                    <button
                        onClick={handleAddItem}
                        className="w-full py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 font-bold hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus className="h-5 w-5" /> 직접 항목 추가하기
                    </button>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="rounded-xl px-6 py-3 text-sm font-bold text-gray-500 hover:bg-gray-100 transition-all"
                        >
                            다음에 하기
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || processedItems.length === 0 || editingIndex !== null}
                            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-3 text-sm font-black text-white hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-200"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    장부 정리 중...
                                </>
                            ) : (
                                <>
                                    <Check className="h-5 w-5" />
                                    {processedItems.length}건 한꺼번에 저장
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Editing Overlay (Centered) */}
            {editingIndex !== null && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={cancelEdit} />
                    <div className="relative w-full max-w-md scale-in-center animate-in zoom-in-95 duration-200">
                        <div className="rounded-3xl bg-white p-8 shadow-2xl border border-gray-100">
                            <h3 className="text-xl font-black text-gray-900 mb-6">✏️ 항목 수정</h3>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-wider ml-1">상품명</label>
                                    <input
                                        autoFocus
                                        className="w-full rounded-2xl border-2 border-gray-100 p-4 text-base font-bold focus:border-blue-500 focus:ring-0 outline-none transition-all placeholder:text-gray-300"
                                        value={editForm.name || ""}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                        placeholder="예: 양파, 대파, 마늘"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-wider ml-1">수량/중량</label>
                                        <input
                                            className="w-full rounded-2xl border-2 border-gray-100 p-4 text-base font-bold focus:border-blue-500 focus:ring-0 outline-none transition-all"
                                            type="number"
                                            value={editForm.amount || ""}
                                            onChange={e => setEditForm({ ...editForm, amount: Number(e.target.value) })}
                                            placeholder="20"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-wider ml-1">단위</label>
                                        <input
                                            className="w-full rounded-2xl border-2 border-gray-100 p-4 text-base font-bold focus:border-blue-500 focus:ring-0 outline-none transition-all"
                                            value={editForm.unit || ""}
                                            onChange={e => setEditForm({ ...editForm, unit: e.target.value })}
                                            placeholder="kg, 개, 망"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-wider ml-1">영수증 총 가격 (원)</label>
                                    <input
                                        className="w-full rounded-2xl border-2 border-blue-50 bg-blue-50/30 p-4 text-xl font-black text-blue-600 focus:border-blue-500 focus:ring-0 outline-none transition-all"
                                        type="number"
                                        value={editForm.originalPrice || ""}
                                        onChange={e => setEditForm({ ...editForm, originalPrice: Number(e.target.value) })}
                                        placeholder="35000"
                                    />
                                    <p className="text-[11px] text-gray-400 mt-2 px-1 leading-relaxed">
                                        💡 중량과 총 가격을 입력하면 <strong>단위당 가격이 자동으로 계산</strong>되어 장부에 기록됩니다.
                                    </p>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={cancelEdit}
                                        className="flex-1 rounded-2xl py-4 text-sm font-bold text-gray-400 hover:bg-gray-50 transition-all font-bold"
                                    >
                                        취소
                                    </button>
                                    <button
                                        onClick={saveEdit}
                                        className="flex-1 rounded-2xl bg-blue-600 py-4 text-sm font-black text-white hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Save className="h-4 w-4" /> 기록 업데이트
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
