"use client";

import { useState, useEffect } from "react";
import { Check, X, AlertTriangle, Loader2, Pencil, Trash2, Save } from "lucide-react";
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
    ingredients: { id: number; name: string }[];
};

// Simple helper to map ingredient names to emojis
function getIngredientIcon(name: string): string {
    const n = name.toLowerCase();
    if (n.includes("양파")) return "🧅";
    if (n.includes("계란") || n.includes("달걀")) return "🥚";
    if (n.includes("무")) return "🥔"; // Radish (Root) -> Potato for now (no Daikon emoji)
    if (n.includes("마늘")) return "🧄";
    if (n.includes("파")) return "🌱";
    if (n.includes("감자")) return "🥔";
    if (n.includes("고구마")) return "🍠";
    if (n.includes("배추")) return "🥬";
    if (n.includes("고추")) return "🌶️";
    if (n.includes("당근")) return "🥕";
    if (n.includes("오이")) return "🥒";
    if (n.includes("토마토")) return "🍅";
    if (n.includes("쌀")) return "🍚";
    if (n.includes("고기") || n.includes("돼지") || n.includes("소")) return "🥩";
    if (n.includes("닭")) return "🍗";
    if (n.includes("생선")) return "🐟";
    if (n.includes("우유")) return "🥛";
    if (n.includes("치즈")) return "🧀";
    return "📦"; // Default icon
}

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
        newItems[editingIndex] = {
            ...newItems[editingIndex],
            ...editForm,
            price: Number(editForm.price) || 0 // Ensure price is a number
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
            const payload = processedItems.map(item => {
                const match = ingredients.find(ing => ing.name === item.name) || ingredients[0];
                return {
                    ingredientId: match?.id || 1,
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
                                    <div className="flex flex-col gap-3">
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                className="rounded-md border p-2 text-sm"
                                                value={editForm.name || ""}
                                                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                                placeholder="상품명"
                                            />
                                            <input
                                                className="rounded-md border p-2 text-sm"
                                                value={editForm.unit || ""}
                                                onChange={e => setEditForm({ ...editForm, unit: e.target.value })}
                                                placeholder="단위"
                                            />
                                            <input
                                                className="rounded-md border p-2 text-sm"
                                                type="number"
                                                value={editForm.price || ""}
                                                onChange={e => setEditForm({ ...editForm, price: Number(e.target.value) })}
                                                placeholder="가격"
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <button onClick={cancelEdit} className="text-xs text-gray-500 underline">취소</button>
                                            <button onClick={saveEdit} className="flex items-center gap-1 rounded bg-blue-600 px-3 py-1 text-xs text-white">
                                                <Save className="h-3 w-3" /> 저장
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
                                                <p className="font-bold text-gray-900 text-lg">{item.name}</p>
                                                <p className="text-sm text-gray-500">{item.price.toLocaleString()}원 / {item.unit}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {/* Market Badge */}
                                            <div className="hidden sm:flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                                                <div className={`flex h-6 w-6 items-center justify-center rounded-full ${item.marketAnalysis.status === 'BEST' ? 'bg-green-100 text-green-600' :
                                                    item.marketAnalysis.status === 'BAD' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {item.marketAnalysis.status === 'BEST' && <Check className="h-3 w-3" />}
                                                    {item.marketAnalysis.status === 'BAD' && <AlertTriangle className="h-3 w-3" />}
                                                    {item.marketAnalysis.status === 'GOOD' && <Check className="h-3 w-3" />}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-gray-500">{item.marketAnalysis.cheapestSource} 대비</p>
                                                    <p className={`font-bold text-xs ${item.marketAnalysis.status === 'BEST' ? 'text-green-600' :
                                                        item.marketAnalysis.status === 'BAD' ? 'text-red-600' : 'text-gray-600'
                                                        }`}>
                                                        {item.marketAnalysis.diff > 0 ? `+${item.marketAnalysis.diff.toLocaleString()}` : item.marketAnalysis.diff.toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>

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
                    <button
                        onClick={handleSave}
                        disabled={isSaving || processedItems.length === 0}
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
