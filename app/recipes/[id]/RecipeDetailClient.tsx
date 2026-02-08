"use client";

import { useState } from "react";
import { ArrowLeft, Plus, Trash2, Check, X as CloseIcon, Wand2, Loader2, ChefHat } from "lucide-react";
import Link from "next/link";
import AddRecipeIngredientModal from "@/app/components/AddRecipeIngredientModal";
import RecipeMarginAnalysis from "@/app/components/RecipeMarginAnalysis";
import { deleteRecipe, deleteRecipeIngredient, updateRecipeIngredientAmount, applyPresetToRecipe, updateRecipe, deleteRecipeIngredients } from "@/app/recipes/actions";
import { useRouter } from "next/navigation";
import { sanitizeAmountInput, formatRecipeDisplay } from "@/app/lib/recipeUtils";

interface RecipeDetailClientProps {
    recipe: any;
    ingredients: any[];
    priceMap: Record<number, number>;
    onDataChange?: () => void;
}

export default function RecipeDetailClient({ recipe, ingredients, priceMap, onDataChange }: RecipeDetailClientProps) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editAmount, setEditAmount] = useState<string>("");
    const [isEditingPrice, setIsEditingPrice] = useState(false);
    const [priceInput, setPriceInput] = useState<number | "">("");

    // [New Features]
    const [isEditingName, setIsEditingName] = useState(false);
    const [nameInput, setNameInput] = useState("");
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
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
                // 삭제 후 목록으로 이동 시 확실하게 갱신
                router.refresh();
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
        if (editAmount === "" || isProcessing) return;
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

    async function handleUpdateName() {
        if (!nameInput.trim() || isProcessing) return;
        setIsProcessing(true);
        try {
            const result = await updateRecipe(recipe.id, { name: nameInput.trim() });
            if (result.success) {
                setIsEditingName(false);
                refreshData();
            } else {
                alert(result.error || "이름 수정 실패");
            }
        } catch (e: any) {
            alert("오류: " + e.message);
        } finally {
            setIsProcessing(false);
        }
    }

    async function handleBulkDelete() {
        if (selectedIds.length === 0) return;
        if (!confirm(`선택한 ${selectedIds.length}개의 재료를 삭제하시겠습니까?`)) return;

        setIsProcessing(true);
        try {
            const result = await deleteRecipeIngredients(selectedIds);
            if (result.success) {
                setSelectedIds([]);
                refreshData();
            } else {
                alert(result.error || "일괄 삭제 실패");
            }
        } catch (e: any) {
            alert("오류: " + e.message);
        } finally {
            setIsProcessing(false);
        }
    }

    const toggleSelection = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(pix => pix !== id) : [...prev, id]
        );
    };

    // [AI Prompt Logic]
    // Priority: 1. DB-stored Illustration Prompt -> 2. Video/Image URL (Unsplash) -> 3. Fallback Generate
    const prompt = recipe.illustrationPrompt;
    const imageUrl = recipe.imageUrl;

    let displayUrl = "";

    if (prompt) {
        // User requested: "Execute illustration_prompt"
        // We use Pollinations as a real-time generator
        displayUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1200&height=600&nologo=true&model=flux&seed=${recipe.id}`;
    } else if (imageUrl) {
        // Fallback to Unsplash or other stored URL
        displayUrl = imageUrl;
    } else {
        // Fallback generic generation
        const genericPrompt = `${recipe.name} delicious korean food authentic photography 4k`;
        displayUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(genericPrompt)}?width=1200&height=600&nologo=true&model=flux&seed=${recipe.id}`;
    }

    return (
        <main className="min-h-screen bg-gray-50/50 pb-24">
            {/* Header */}
            <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200/60 bg-white/80 px-4 backdrop-blur-md">
                <div className="flex items-center gap-3 flex-1 mr-4">
                    <Link href="/recipes" className="rounded-full p-2 hover:bg-gray-100 transition-colors shrink-0">
                        <ArrowLeft className="h-5 w-5 text-gray-500" />
                    </Link>

                    {/* Editable Name */}
                    {isEditingName ? (
                        <div className="flex items-center gap-1 w-full max-w-xs">
                            <input
                                autoFocus
                                value={nameInput}
                                onChange={(e) => setNameInput(e.target.value)}
                                className="w-full rounded-lg border-2 border-blue-200 px-3 py-1.5 text-xl font-black text-gray-900 focus:outline-none"
                                placeholder="레시피 이름"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleUpdateName();
                                    if (e.key === 'Escape') setIsEditingName(false);
                                }}
                            />
                            <button onClick={handleUpdateName} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shrink-0"><Check className="h-4 w-4" /></button>
                            <button onClick={() => setIsEditingName(false)} className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 shrink-0"><CloseIcon className="h-4 w-4" /></button>
                        </div>
                    ) : (
                        <button
                            onClick={() => {
                                setNameInput(recipe.name);
                                setIsEditingName(true);
                            }}
                            className="text-xl font-black text-gray-900 truncate hover:text-blue-600 hover:underline decoration-dashed decoration-2 underline-offset-4 text-left"
                        >
                            {recipe.name}
                        </button>
                    )}
                </div>
                <button
                    onClick={handleDeleteRecipe}
                    disabled={isProcessing}
                    className="p-2 text-red-400 hover:text-red-500 transition-colors hover:bg-red-50 rounded-full disabled:opacity-50"
                >
                    <Trash2 className="h-5 w-5" />
                </button>
            </div>

            {/* AI Generated Image Header (Menu Card Style) */}
            <div className="relative h-64 w-full bg-gray-900 overflow-hidden shadow-inner group">
                {/* Background Image */}
                <img
                    src={displayUrl}
                    alt={recipe.name}
                    className="absolute inset-0 h-full w-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                />

                {/* Fallback Icon */}
                <div className="hidden h-full w-full items-center justify-center bg-gray-800 absolute inset-0 text-gray-600">
                    <ChefHat className="h-16 w-16 opacity-50" />
                </div>

                {/* Gray Gradient Overlay (Background Recognition) */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />

                {/* Text Content (Front) */}
                <div className="absolute bottom-6 left-6 right-6 text-white z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-orange-400 bg-orange-950/80 px-2 py-0.5 rounded-full border border-orange-500/30">
                            v0.1.4
                        </span>
                        {prompt && <span className="text-[10px] text-gray-300 bg-black/40 px-2 py-0.5 rounded-full border border-white/10 uppercase tracking-wider">AI Generated</span>}
                    </div>

                    <h2 className="text-4xl font-black shadow-black drop-shadow-lg leading-tight tracking-tight">
                        {recipe.name}
                    </h2>
                    <p className="text-sm text-gray-300 font-medium mt-1 opacity-90 line-clamp-1">
                        {recipe.description || "설명 없음"}
                    </p>
                </div>
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
                                        onFocus={(e) => e.currentTarget.select()}
                                        onChange={(e) => setPriceInput(e.target.value === "" ? "" : Number(e.target.value))}
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
                        <div className="flex items-center gap-2">
                            {selectedIds.length > 0 && (
                                <button
                                    onClick={handleBulkDelete}
                                    className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 animate-in fade-in slide-in-from-right-2"
                                >
                                    <Trash2 className="h-3 w-3" />
                                    {selectedIds.length}개 삭제
                                </button>
                            )}
                            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{recipeIngredients.length} items</span>
                        </div>
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
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteIngredient(item.id);
                                            }}
                                            className="h-8 w-16 rounded-lg bg-red-100 flex items-center justify-center gap-1 text-red-600 hover:bg-red-200 disabled:opacity-30 transition-all shadow-sm"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                            <span className="text-xs font-bold">삭제</span>
                                        </button>
                                        <div className="flex items-center gap-3">
                                            {/* Selection Checkbox */}
                                            <div
                                                onClick={(e) => { e.stopPropagation(); toggleSelection(item.id); }}
                                                className={`w-5 h-5 rounded-md border-2 cursor-pointer flex items-center justify-center transition-all ${selectedIds.includes(item.id)
                                                    ? "bg-blue-600 border-blue-600"
                                                    : "border-gray-300 hover:border-blue-400 bg-white"
                                                    }`}
                                            >
                                                {selectedIds.includes(item.id) && <Check className="h-3.5 w-3.5 text-white stroke-[3]" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 flex items-center gap-1.5">
                                                    {item.ingredient.name}
                                                </p>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                                                    AVG: {item.avgPrice.toLocaleString()}원/{item.ingredient.unit.toLowerCase()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right flex flex-col items-end">
                                        {editingId === item.id ? (
                                            <div className="flex items-center gap-1">
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={editAmount}
                                                    onFocus={(e) => e.currentTarget.select()}
                                                    onChange={(e) => {
                                                        const cleanVal = sanitizeAmountInput(e.target.value);
                                                        setEditAmount(cleanVal);
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleUpdateAmount(item.id);
                                                        if (e.key === 'Escape') setEditingId(null);
                                                    }}
                                                    placeholder="0"
                                                    className="w-20 rounded-lg border-2 border-blue-200 px-2 py-1 text-sm font-bold text-blue-600 focus:outline-none text-right placeholder:text-gray-300"
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
                                                    // [Fix] If amount is 0, show empty string to leverage placeholder
                                                    setEditAmount(item.amount === 0 ? "" : String(item.amount));
                                                }}
                                                className="font-black text-gray-900 hover:text-blue-600 hover:underline transition-all decoration-dotted flex items-center gap-1 disabled:pointer-events-none justify-end w-full"
                                            >
                                                {/* SMART DISPLAY LOGIC */}
                                                <span className={item.amount === 0 ? "text-gray-300" : ""}>
                                                    {(() => {
                                                        const formatted = formatRecipeDisplay(item.ingredient.name, item.amount, item.ingredient.unit);
                                                        return `${formatted.amount} ${formatted.unit}`;
                                                    })()}
                                                </span>
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
            </div >

            {
                isAddModalOpen && (
                    <AddRecipeIngredientModal
                        isOpen={isAddModalOpen}
                        onClose={() => setIsAddModalOpen(false)}
                        recipeId={recipe.id}
                        ingredients={ingredients || []}
                        onSuccess={() => {
                            refreshData();
                            setIsAddModalOpen(false);
                        }}
                    />
                )
            }
        </main >
    );
}
