"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, X, AlertTriangle, Loader2, Pencil, Trash2, Save, Plus, Share2 } from "lucide-react";
import { createBulkIngredientPrices } from "@/app/ingredients/actions";
import { getIngredientIcon } from "@/app/lib/utils";

type MarketAnalysis = {
    cheapestSource: string;
    price: number;
    status: "BEST" | "GOOD" | "BAD";
    desc?: string;
    link?: string;
    totalDiff?: number;
    marketUnit?: string;
    marketUnitPrice?: number;
    marketTotalForUserAmount?: number;
    candidates?: {
        source: string;
        price: number;
        link: string;
        perUnitPrice?: number;
    }[];
};

type OCRItem = {
    name: string;
    price: number; // Unit price (final calculated)
    unit: string;
    amount?: number; // Total weight/count
    originalPrice?: number; // Total price written
    marketAnalysis: MarketAnalysis;
    status?: string | null;  // New field
    relatedRecipes?: any[];  // New field
};

type Props = {
    isOpen: boolean;
    onClose: () => void;
    items: OCRItem[];
    ingredients: { id: number; name: string }[];
    analystReport?: any[]; // New prop
};

export default function BulkPriceReviewModal({ isOpen, onClose, items, ingredients, analystReport }: Props) {
    const [processedItems, setProcessedItems] = useState<OCRItem[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Partial<OCRItem>>({});
    const [showReport, setShowReport] = useState(true);

    useEffect(() => {
        if (isOpen) {
            // OCR returns 'price' as Total Price. We must map it to originalPrice 
            // and calculate unit price for the UI/Data.
            const mappedItems = items.map(item => ({
                ...item,
                originalPrice: item.price, // OCR 'price' is Total
                price: item.amount && item.amount > 0 ? Math.round(item.price / item.amount) : item.price,
                selectedCandidateIndex: 0 // Initialize selection
            }));
            setProcessedItems(mappedItems);
            setEditingIndex(null);
        }
    }, [isOpen, items]);

    // ... (keep existing functions: handleDelete, startEdit, cancelEdit, saveEdit, handleAddItem, handleSave) ...

    if (!isOpen) return null;

    // Helper to render existing contents (I will just replace the render part mostly)

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

    const handlePrevCandidate = (idx: number) => {
        const item = processedItems[idx];
        if (!item.marketAnalysis.candidates || item.marketAnalysis.candidates.length <= 1) return;

        // Current index stored in `item.status` temporarily (hacky but effective without new state) or add new field
        // Actually, let's use a cleaner approach. We can add `selectedCandidateIndex` to OCRItem?
        // Let's coerce `status` (which is string) to hold index? No, `status` is used for "BEST/GOOD".
        // Let's add `selectedCandidateIndex` to the mapped item in useEffect.

        const currentIndex = (item as any).selectedCandidateIndex || 0;
        const newIndex = currentIndex > 0 ? currentIndex - 1 : item.marketAnalysis.candidates.length - 1;
        updateCandidate(idx, newIndex);
    };

    const handleNextCandidate = (idx: number) => {
        const item = processedItems[idx];
        if (!item.marketAnalysis.candidates || item.marketAnalysis.candidates.length <= 1) return;

        const currentIndex = (item as any).selectedCandidateIndex || 0;
        const newIndex = currentIndex < item.marketAnalysis.candidates.length - 1 ? currentIndex + 1 : 0;
        updateCandidate(idx, newIndex);
    };

    const updateCandidate = (itemIdx: number, candidateIdx: number) => {
        const newItems = [...processedItems];
        const item = newItems[itemIdx];
        const candidate = item.marketAnalysis.candidates![candidateIdx];

        // Recalculate analysis based on new candidate
        // Unit Price Per User Unit
        let userUnitScale = 1;
        if (item.unit === 'kg' || item.unit === 'L') userUnitScale = 1000;

        const marketUnitPrice = (candidate.perUnitPrice || 0) * userUnitScale;
        const marketTotalForUserAmount = Math.round((candidate.perUnitPrice || 0) * (item.originalPrice && item.price ? (item.amount || 1) * userUnitScale : (item.amount || 1) * userUnitScale));
        // Wait, logic check: 
        // item.amount (e.g. 15kg). perUnitPrice is per gram (since we divided by 1000 in naver.ts).
        // if perUnitPrice is e.g. 3.125 (won/g). 15kg = 15000g.
        // marketTotal = 3.125 * 15000 = 46875. Correct.
        // User Amount is `item.amount` (e.g. 15).
        // If unit is kg, we need to multiply `item.amount` by 1000 to get grams?
        // Yes, `item.amount` is the number in `item.unit`.

        let standardizedAmount = item.amount || 1;
        if (item.unit === 'kg' || item.unit === 'L') standardizedAmount *= 1000;
        // Piece logic? Assuming 'g' for now if not piece.

        const newMarketTotal = Math.round((candidate.perUnitPrice || candidate.price) * standardizedAmount);
        // Fallback: if perUnitPrice is missing (shouldn't be), use price.

        const newTotalDiff = (item.originalPrice || item.price) - newMarketTotal;

        newItems[itemIdx] = {
            ...item,
            // @ts-ignore
            selectedCandidateIndex: candidateIdx,
            marketAnalysis: {
                ...item.marketAnalysis,
                cheapestSource: candidate.source,
                price: candidate.price,
                link: candidate.link,
                marketUnitPrice: marketUnitPrice,
                marketTotalForUserAmount: newMarketTotal,
                totalDiff: newTotalDiff
            }
        };
        setProcessedItems(newItems);
    };

    const [currentReport, setCurrentReport] = useState<string[]>([]);

    useEffect(() => {
        if (processedItems.length > 0) {
            import("@/app/lib/naver").then(({ generateBusinessReport }) => {
                const newReport = generateBusinessReport(processedItems);
                setCurrentReport(newReport);
            });
        }
    }, [processedItems]);

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
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            📸 식자재 분석 결과
                            {analystReport && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">AUTO ANALYST</span>}
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">{processedItems.length}개의 품목이 인식되었습니다.</p>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-100 transition-colors">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">

                    {/* Analyst Report Section */}
                    {currentReport.length > 0 && showReport && (
                        <div className="mb-4 rounded-xl border border-purple-100 bg-purple-50/50 p-4">
                            <h4 className="text-sm font-black text-purple-900 mb-2 flex items-center gap-2">
                                🤖 AI 분석 리포트
                                <div className="ml-auto flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            const text = `[식자재 비서 AI 분석 리포트]\n\n${currentReport.join("\n")}`;
                                            if (navigator.share) {
                                                navigator.share({
                                                    title: '식자재 분석 리포트',
                                                    text: text,
                                                }).catch(console.error);
                                            } else {
                                                navigator.clipboard.writeText(text);
                                                alert("리포트 내용이 복사되었습니다.");
                                            }
                                        }}
                                        className="text-xs flex items-center gap-1 bg-white border border-purple-200 text-purple-600 px-2 py-1 rounded-lg hover:bg-purple-50 transition-colors"
                                    >
                                        <Share2 className="h-3 w-3" /> 공유하기
                                    </button>
                                    <button onClick={() => setShowReport(false)} className="text-xs text-purple-400 underline font-normal">숨기기</button>
                                </div>
                            </h4>
                            <div className="space-y-1">
                                <div className="space-y-2">
                                    {currentReport.map((rep, idx) => (
                                        <div key={idx} className="flex flex-col sm:flex-row text-sm items-start sm:items-center gap-1 sm:gap-2 border-b border-purple-100/50 last:border-0 pb-2 last:pb-0">
                                            <span className="text-gray-700 leading-relaxed font-medium">{rep}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

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
                                        <div className="h-12 w-12 shrink-0 rounded-2xl bg-blue-50 flex items-center justify-center font-bold text-2xl shadow-inner border border-blue-100 overflow-hidden">
                                            {getIngredientIcon(item.name).startsWith("/") ? (
                                                <img src={getIngredientIcon(item.name)} alt={item.name} className="h-full w-full object-contain p-1 mix-blend-multiply" />
                                            ) : (
                                                getIngredientIcon(item.name)
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-baseline gap-2">
                                                <p className="font-bold text-gray-900 text-lg">{item.name}</p>
                                                {item.amount && (
                                                    <span className="text-sm text-gray-500 font-normal">({item.amount}{item.unit})</span>
                                                )}
                                                {/* Recipe Badge */}
                                                {item.relatedRecipes && item.relatedRecipes.length > 0 && (
                                                    <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-orange-50 px-2 py-1 text-[10px] font-medium text-orange-700 ring-1 ring-inset ring-orange-600/20">
                                                        👨‍🍳 레시피 연동
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-0.5 relative">
                                                {item.originalPrice ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-gray-400">총 {item.originalPrice.toLocaleString()}원</span>
                                                        <span className="h-3 w-[1px] bg-gray-200" />
                                                        <span className="text-blue-600 font-black text-sm">{item.price.toLocaleString()}원 <span className="text-[10px] font-normal">({item.unit}당)</span></span>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-900 font-bold">{item.price.toLocaleString()}원 / {item.unit}</p>
                                                )}

                                                {/* Warning Status */}
                                                {(item.status && item.status !== '정상') && (
                                                    <span className="absolute -top-6 left-0 text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 animate-pulse">
                                                        ⚠️ {item.status}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 mt-3 sm:mt-0">
                                        {item.marketAnalysis ? (
                                            <div className="w-full sm:w-auto mt-2 sm:mt-0 p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-1 min-w-[200px]">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="flex h-4 w-4 items-center justify-center rounded bg-[#03C75A] text-[9px] font-black text-white">N</span>
                                                        <span className="text-sm font-bold text-gray-800">
                                                            {item.marketAnalysis.cheapestSource.replace("네이버최저가(", "").replace(")", "")}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 text-sm">
                                                    <span className="font-bold text-gray-900 text-lg">
                                                        {item.marketAnalysis.marketTotalForUserAmount
                                                            ? item.marketAnalysis.marketTotalForUserAmount.toLocaleString()
                                                            : item.marketAnalysis.price.toLocaleString()}원
                                                    </span>
                                                    <span className="text-gray-300">|</span>
                                                    <span className="text-gray-500 font-medium whitespace-nowrap">
                                                        {item.marketAnalysis.marketUnitPrice
                                                            ? `${Math.round(item.marketAnalysis.marketUnitPrice).toLocaleString()}원`
                                                            : `${item.marketAnalysis.price.toLocaleString()}원`}
                                                        <span className="text-xs text-gray-400 font-normal ml-0.5">({item.unit}당)</span>
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between mt-1">
                                                    {(item.marketAnalysis as any).link ? (
                                                        <a
                                                            href={(item.marketAnalysis as any).link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-[11px] text-gray-400 underline hover:text-blue-500"
                                                        >
                                                            상품 보러가기
                                                        </a>
                                                    ) : (
                                                        <span className="text-[11px] text-gray-300">링크 없음</span>
                                                    )}

                                                    <div className="flex items-center gap-2">
                                                        {/* Candidate Navigation */}
                                                        {item.marketAnalysis.candidates && item.marketAnalysis.candidates.length > 1 && (
                                                            <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-lg p-0.5 shadow-sm">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handlePrevCandidate(idx);
                                                                    }}
                                                                    className="p-1 hover:bg-gray-50 rounded text-gray-400 hover:text-blue-600 transition-all"
                                                                    title="이전 최저가"
                                                                >
                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                                                                </button>
                                                                <span className="text-[10px] font-bold text-gray-500 min-w-[32px] text-center tabular-nums">
                                                                    {((item as any).selectedCandidateIndex || 0) + 1} / {item.marketAnalysis.candidates.length}
                                                                </span>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleNextCandidate(idx);
                                                                    }}
                                                                    className="p-1 hover:bg-gray-50 rounded text-gray-400 hover:text-blue-600 transition-all"
                                                                    title="다음 최저가"
                                                                >
                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                                                                </button>
                                                            </div>
                                                        )}

                                                        {/* Diff Display: Loss/Profit */}
                                                        {item.marketAnalysis.totalDiff !== undefined && (
                                                            <div className="flex items-center gap-1 font-bold text-base whitespace-nowrap">
                                                                {item.marketAnalysis.totalDiff > 0 ? (
                                                                    <span className="text-red-500 flex items-center gap-1">손해 {item.marketAnalysis.totalDiff.toLocaleString()}원</span>
                                                                ) : (
                                                                    <span className="text-blue-600 flex items-center gap-1">이익 {Math.abs(item.marketAnalysis.totalDiff).toLocaleString()}원</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
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
