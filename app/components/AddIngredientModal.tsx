"use client";

import { useState } from "react";
import { Plus, X, Loader2, Save } from "lucide-react";
import { createIngredient } from "@/app/ingredients/actions";

export default function AddIngredientModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (formData: FormData) => {
        setIsSubmitting(true);
        try {
            await createIngredient(formData);
            setIsOpen(false);
            // Optional: Show toast
        } catch (error) {
            console.error(error);
            alert("추가에 실패했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-4 text-sm font-bold text-gray-900 shadow-sm hover:bg-gray-50 active:scale-[0.98] transition-all"
            >
                <Plus className="h-5 w-5 text-gray-500" />
                직접 재료 등록하기
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    {/* Background Backdrop Click to Close */}
                    <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

                    <div className="relative w-full max-w-md scale-in-center animate-in zoom-in-95 duration-200">
                        <div className="rounded-3xl bg-white p-6 shadow-2xl border border-gray-100">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-black text-gray-900">✏️ 새 재료 추가</h3>
                                <button onClick={() => setIsOpen(false)} className="rounded-full p-2 hover:bg-gray-100 transition-colors">
                                    <X className="h-5 w-5 text-gray-500" />
                                </button>
                            </div>

                            <form action={handleSubmit} className="flex flex-col gap-5">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-wider ml-1">재료 이름</label>
                                        <input
                                            name="name"
                                            placeholder="예: 양파"
                                            required
                                            autoFocus
                                            className="w-full rounded-2xl border-2 border-gray-100 p-3.5 text-base font-bold focus:border-blue-500 focus:ring-0 outline-none transition-all placeholder:text-gray-300"
                                        />
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="flex-1 space-y-2">
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-wider ml-1">구매 수량</label>
                                            <input
                                                name="amount"
                                                type="number"
                                                step="0.01"
                                                placeholder="1"
                                                className="w-full rounded-2xl border-2 border-gray-100 p-3.5 text-base font-bold focus:border-blue-500 focus:ring-0 outline-none transition-all placeholder:text-gray-300"
                                            />
                                        </div>
                                        <div className="w-full sm:w-28 space-y-2">
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-wider ml-1">단위</label>
                                            <input
                                                name="unit"
                                                placeholder="kg"
                                                required
                                                className="w-full rounded-2xl border-2 border-gray-100 p-3.5 text-base font-bold focus:border-blue-500 focus:ring-0 outline-none transition-all placeholder:text-gray-300"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-2 border-t border-gray-50">
                                    <p className="text-xs font-bold text-blue-600 flex items-center gap-1">
                                        <span className="bg-blue-100 p-1 rounded">TIP</span>
                                        구매 정보를 입력하면 최저가와 비교해드려요!
                                    </p>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-wider ml-1">구매 가격 (원)</label>
                                        <input
                                            name="price"
                                            type="number"
                                            placeholder="4500"
                                            className="w-full rounded-2xl border-2 border-gray-100 p-3.5 text-base font-bold focus:border-blue-500 focus:ring-0 outline-none transition-all placeholder:text-gray-300"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsOpen(false)}
                                        className="flex-1 rounded-xl py-3.5 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all"
                                    >
                                        취소
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-[2] rounded-xl bg-blue-600 py-3.5 text-sm font-black text-white hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                저장 중...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4" />
                                                추가하기
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
