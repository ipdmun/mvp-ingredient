"use client";

import { useState } from "react";
import { ArrowLeft, Plus, Trash2, Check, X as CloseIcon, Wand2, Loader2 } from "lucide-react";
import Link from "next/link";
import AddRecipeIngredientModal from "@/app/components/AddRecipeIngredientModal";
import RecipeMarginAnalysis from "@/app/components/RecipeMarginAnalysis";
import { deleteRecipe, deleteRecipeIngredient, updateRecipeIngredientAmount, applyPresetToRecipe, updateRecipe } from "@/app/recipes/actions";
import { useRouter } from "next/navigation";

interface RecipeDetailClientProps {
    recipe: any;
    ingredients: any[];
    priceMap: Record<number, number>;
    onDataChange?: () => void;
}

export default function RecipeDetailClient({ recipe, ingredients, priceMap, onDataChange }: RecipeDetailClientProps) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editAmount, setEditAmount] = useState<number | "">("");
    const [isEditingPrice, setIsEditingPrice] = useState(false);
    const [priceInput, setPriceInput] = useState<number | "">("");
    const [isProcessing, setIsProcessing] = useState(false);

    const router = useRouter();

    // @ts-ignore
    const recipeIngredients = recipe.ingredients || [];

    const ingredientsWithCost = recipeIngredients.map((ri: any) => {
        const avgPrice = priceMap[ri.ingredientId] || 0;
        const cost = Math.round(avgPrice * ri.amount);
        return {
            ...ri,
            avgPrice,
            cost
        };
    });

    const totalCost = ingredientsWithCost.reduce((acc: number, item: any) => acc + item.cost, 0);

    const refreshData = () => {
        if (onDataChange) {
            onDataChange();
        } else {
            router.refresh(); // Fallback for pure server component usage
        }
    };

    async function handleDeleteRecipe() {
        if (!confirm("정말로 이 레시피를 삭제하시겠습니까?")) return;

        setIsProcessing(true);
        try {
            const result = await deleteRecipe(recipe.id);
            if (result.success) {
                router.push("/recipes");
            } else {
                alert(result.error || "삭제에 실패했습니다.");
            }
        } catch (e: any) {
            alert("삭제 중 네트워크 오류: " + e.message);
        } finally {
            setIsProcessing(false);
        }
    }

    async function handleApplyPreset() {
        setIsProcessing(true);
        try {
            const result = await applyPresetToRecipe(recipe.id);
            if (result.success) {
                alert("기본 재료가 추가되었습니다.");
                refreshData();
            } else {
                alert(result.message || result.error || "프리셋을 불러올 수 없습니다.");
            }
        } catch (e: any) {
            alert("오류가 발생했습니다: " + e.message);
        } finally {
            setIsProcessing(false);
        }
    }

    async function handleDeleteIngredient(riId: number) {
        if (!confirm("이 재료를 레시피에서 삭제하시겠습니까?")) return;

        setIsProcessing(true);
        try {
            const result = await deleteRecipeIngredient(riId);
            if (result.success) {
                refreshData();
            } else {
                alert(result.error || "삭제 실패");
            }
        } catch (e: any) {
            alert("오류: " + e.message);
        } finally {
            setIsProcessing(false);
        }
    }

    async function handleUpdateAmount(riId: number) {
        if (!editAmount || isProcessing) return;
        setIsProcessing(true);
        try {
            const result = await updateRecipeIngredientAmount(riId, Number(editAmount));
            if (result.success) {
                setEditingId(null);
                refreshData();
            } else {
                alert(result.error || "수정 실패");
            }
        } catch (e: any) {
            alert("오류: " + e.message);
        } finally {
            setIsProcessing(false);
        }
    }

    async function handleUpdatePrice() {
        // Allow updating even if price is 0, but check for empty string
        if (priceInput === "" || isProcessing) return;
        setIsProcessing(true);
        try {
            const result = await updateRecipe(recipe.id, { sellingPrice: Number(priceInput) });
            if (result.success) {
                setIsEditingPrice(false);
                refreshData();
            } else {
                alert(result.error || "가격 수정 실패");
            }
        } catch (e: any) {
            alert("오류: " + e.message);
        } finally {
            setIsProcessing(false);
        }
    }

    return (
        <main className="min-h-screen bg-gray-50/50 pb-24">
            {/* Header */}
            <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200/60 bg-white/80 px-4 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <Link href="/recipes" className="rounded-full p-2 hover:bg-gray-100 transition-colors">
                        <ArrowLeft className="h-5 w-5 text-gray-500" />
                    </Link>
                    <h1 className="text-xl font-black text-gray-900">{recipe.name}</h1>
                </div>
                <button
                    onClick={handleDeleteRecipe}
                    disabled={isProcessing}
                    className="p-2 text-red-400 hover:text-red-500 transition-colors hover:bg-red-50 rounded-full disabled:opacity-50"
                >
                    <Trash2 className="h-5 w-5" />
                </button>
            </div>

            <div className="p-4 space-y-6">
                {/* Info Card */}
                <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Standard Yield</p>
                            <p className="text-2xl font-black text-gray-900">{recipe.servings}인분</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Sales Price</p>
                            {isEditingPrice ? (
                                <div className="flex items-center gap-1 justify-end">
                                    <input
                                        type="number"
                                        autoFocus
                                        value={priceInput}
                                        onChange={(e) => setPriceInput(Number(e.target.value))}
                                        className="w-32 rounded-lg border-2 border-blue-200 px-2 py-1 text-xl font-black text-blue-600 focus:outline-none text-right"
                                        placeholder="0"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleUpdatePrice();
                                            if (e.key === 'Escape') setIsEditingPrice(false);
                                        }}
                                    />
                                    <button onClick={handleUpdatePrice} className="rounded-lg bg-blue-600 p-2 text-white shadow-sm hover:bg-blue-700">
                                        <Check className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => setIsEditingPrice(false)} className="rounded-lg bg-gray-200 p-2 text-gray-600 hover:bg-gray-300">
                                        <CloseIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => {
                                        setIsEditingPrice(true);
                                        setPriceInput(recipe.sellingPrice || 0);
                                    }}
                                    className="text-2xl font-black text-blue-600 hover:text-blue-700 hover:underline decoration-dashed decoration-2 underline-offset-4 transition-all"
                                >
                                    {recipe.sellingPrice?.toLocaleString() ?? 0}원
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Ingredient List */}
                <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-gray-800">레시피 구성 (재료)</h3>
                        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{recipeIngredients.length} items</span>
                    </div>

                    <div className="divide-y divide-gray-100 min-h-[100px] flex flex-col justify-center">
                        {recipeIngredients.length === 0 ? (
                            <div className="p-8 text-center space-y-4">
                                <p className="text-sm text-gray-400 font-medium">재료가 아직 없습니다.</p>
                                <button
                                    onClick={handleApplyPreset}
                                    disabled={isProcessing}
                                    className="inline-flex items-center gap-2 rounded-xl bg-orange-50 px-4 py-2.5 text-sm font-bold text-orange-600 hover:bg-orange-100 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                                    기본 레시피 재료 불러오기
                                </button>
                            </div>
                        ) : (
                            ingredientsWithCost.map((item: any) => (
                                <div key={item.id} className="p-4 flex justify-between items-center hover:bg-gray-50/50 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <button
                                            disabled={isProcessing}
                                            onClick={() => handleDeleteIngredient(item.id)}
                                            className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center text-red-50 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 disabled:opacity-30"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                        <div>
                                            <p className="font-bold text-gray-900 flex items-center gap-1.5">
                                                {item.ingredient.name}
                                            </p>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                                                AVG: {item.avgPrice.toLocaleString()}원/{item.ingredient.unit}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right flex flex-col items-end">
                                        {editingId === item.id ? (
                                            <div className="flex items-center gap-1">
                                                <input
                                                    autoFocus
                                                    type="number"
                                                    value={editAmount}
                                                    onChange={(e) => setEditAmount(Number(e.target.value))}
                                                    className="w-16 rounded-lg border-2 border-blue-200 px-2 py-1 text-sm font-bold text-blue-600 focus:outline-none"
                                                />
                                                <button onClick={() => handleUpdateAmount(item.id)} className="rounded-lg bg-blue-600 p-1.5 text-white shadow-sm">
                                                    <Check className="h-3 w-3" />
                                                </button>
                                                <button onClick={() => setEditingId(null)} className="rounded-lg bg-gray-200 p-1.5 text-gray-600">
                                                    <CloseIcon className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                disabled={isProcessing}
                                                onClick={() => {
                                                    setEditingId(item.id);
                                                    setEditAmount(item.amount);
                                                }}
                                                className="font-black text-gray-900 hover:text-blue-600 hover:underline transition-all decoration-dotted flex items-center gap-1 disabled:pointer-events-none"
                                            >
                                                {item.amount}{item.ingredient.unit}
                                            </button>
                                        )}
                                        <p className="text-xs font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md mt-0.5">
                                            {item.cost.toLocaleString()}원
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <button
                        disabled={isProcessing}
                        onClick={() => setIsAddModalOpen(true)}
                        className="w-full py-4 text-sm font-black text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 border-t border-gray-100 bg-gray-50/10 disabled:opacity-50"
                    >
                        <Plus className="h-4 w-4 stroke-[3]" /> 직접 재료 추가하기
                    </button>
                </div>

                {/* Analysis */}
                <RecipeMarginAnalysis
                    totalCost={totalCost}
                    sellingPrice={recipe.sellingPrice ?? 0}
                />
            </div>

            <AddRecipeIngredientModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                recipeId={recipe.id}
                ingredients={ingredients}
                onSuccess={() => {
                    refreshData();
                    setIsAddModalOpen(false);
                }}
            />
        </main>
    );
}
