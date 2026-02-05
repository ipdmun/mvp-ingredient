"use client";

import { useState, useMemo } from "react";
import { X, Search, Loader2 } from "lucide-react";
import { addRecipeIngredient } from "@/app/recipes/actions";
import { useRouter } from "next/navigation";

interface AddRecipeIngredientModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipeId: number;
    ingredients: any[];
    onSuccess?: () => void;
}

export default function AddRecipeIngredientModal({ isOpen, onClose, recipeId, ingredients, onSuccess }: AddRecipeIngredientModalProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedIngredient, setSelectedIngredient] = useState<any>(null);
    const [amount, setAmount] = useState<number | "">("");

    if (!isOpen) return null;

    const filteredIngredients = useMemo(() => {
        if (!searchTerm) return ingredients;
        return (ingredients || []).filter((ing: any) =>
            ing.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [ingredients, searchTerm]);

    async function handleSubmit() {
        if (!selectedIngredient || !amount) return;
        setIsLoading(true);
        try {
            // @ts-ignore
            const result = await addRecipeIngredient(Number(recipeId), selectedIngredient.id, Number(amount));
            if (result.success) {
                if (onSuccess) {
                    onSuccess();
                } else {
                    router.refresh();
                    onClose();
                }
                setSelectedIngredient(null);
                setAmount("");
                setSearchTerm("");
            } else {
                alert(result.error || "재료 추가에 실패했습니다.");
            }
        } catch (error: any) {
            console.error(error);
            alert("처리 중 오류가 발생했습니다: " + error.message);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between border-b border-gray-100 p-4">
                    <h3 className="text-lg font-bold text-gray-900">레시피 재료 추가</h3>
                    <button onClick={onClose} className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-4 flex-1 overflow-y-auto">
                    {!selectedIngredient ? (
                        <>
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <input
                                    placeholder="재료 검색..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm font-medium focus:border-blue-500 focus:outline-none focus:ring-0"
                                />
                            </div>
                            <div className="space-y-2">
                                {/* @ts-ignore */}
                                {(filteredIngredients || []).map((ing) => (
                                    <button
                                        key={ing.id}
                                        onClick={() => setSelectedIngredient(ing)}
                                        className="flex w-full items-center justify-between rounded-xl border border-gray-100 p-3 hover:bg-gray-50 hover:border-blue-200 transition-all text-left"
                                    >
                                        <span className="font-bold text-gray-900">{ing.name}</span>
                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{ing.unit}</span>
                                    </button>
                                ))}
                                {filteredIngredients.length === 0 && (
                                    <p className="text-center text-sm text-gray-400 py-4">일치하는 재료가 없습니다.</p>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <span className="font-black text-blue-900 text-lg">{selectedIngredient.name}</span>
                                <button onClick={() => setSelectedIngredient(null)} className="text-xs font-semibold text-blue-600 underline">변경</button>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">사용량 입력</label>
                                <div className="flex items-center gap-2 mt-2">
                                    <input
                                        type="number"
                                        autoFocus
                                        value={amount}
                                        onChange={(e) => setAmount(Number(e.target.value))}
                                        placeholder="0"
                                        className="flex-1 rounded-xl border-2 border-blue-100 p-4 text-2xl font-bold focus:border-blue-500 focus:outline-none focus:ring-0 text-center"
                                    />
                                    <span className="text-lg font-bold text-gray-600">{selectedIngredient.unit}</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-2 ml-1 text-center">이 레시피 1회 생산 시 들어가는 양을 입력하세요</p>
                            </div>
                        </div>
                    )}
                </div>

                {selectedIngredient && (
                    <div className="p-4 border-t border-gray-100 bg-gray-50">
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading || !amount}
                            className="flex w-full items-center justify-center rounded-xl bg-blue-600 p-4 text-base font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 disabled:opacity-70"
                        >
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "추가하기"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
