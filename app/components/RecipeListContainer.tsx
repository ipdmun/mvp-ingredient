"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ChefHat, ArrowRight, Loader2, AlertCircle, Pencil, Check, X } from "lucide-react";
import AddRecipeModalClient from "../recipes/AddRecipeModalClient";
import DeleteRecipeButton from "@/app/components/DeleteRecipeButton";
import { updateRecipe } from "@/app/recipes/actions";
import { KOREAN_FOOD_IMAGES } from "@/app/lib/koreanFoodImages";

export default function RecipeListContainer() {
    const [recipes, setRecipes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Editing State
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const fetchRecipes = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/recipes/list");
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to fetch");
            }

            setRecipes(data.recipes || []);
            setError("");
        } catch (err: any) {
            console.error("Fetch Error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecipes();
    }, []);

    const startEditing = (e: React.MouseEvent, recipe: any) => {
        e.preventDefault();
        e.stopPropagation();
        setEditingId(recipe.id);
        setEditName(recipe.name);
    };

    const cancelEditing = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setEditingId(null);
        setEditName("");
    };

    const saveName = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!editName.trim() || !editingId) return;

        setIsSaving(true);
        try {
            await updateRecipe(editingId, { name: editName });
            await fetchRecipes(); // Refresh list
            setEditingId(null);
        } catch (error) {
            alert("수정 실패");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-64 w-full flex-col items-center justify-center text-red-500">
                <AlertCircle className="h-10 w-10 mb-2" />
                <p className="font-bold">데이터를 불러오지 못했습니다.</p>
                <p className="text-sm">{error}</p>
                <button
                    onClick={fetchRecipes}
                    className="mt-4 px-4 py-2 bg-white border border-red-200 rounded-lg shadow-sm hover:bg-red-50"
                >
                    다시 시도
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">메뉴 관리</h1>
                    <p className="text-gray-500">등록된 레시피와 원가율을 한눈에 확인하세요.</p>
                </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {recipes.map((recipe: any) => {
                    const isDoenjang = recipe.name.includes("된장찌개");
                    const isKimchi = recipe.name.includes("김치찌개");

                    // Fallback Images (High quality Unsplash)
                    let fallbackUrl = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800"; // Default food
                    if (isDoenjang) fallbackUrl = "https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&q=80&w=800";
                    if (isKimchi) fallbackUrl = "https://images.unsplash.com/photo-1617093228322-97cb355a6fa4?auto=format&fit=crop&q=80&w=800";

                    let aiPrompt = `${recipe.name} illustration food art drawing hand-drawn warm cozy delicious korean food top view minimal`;
                    if (isDoenjang) {
                        aiPrompt = "Doenjang Jjigae illustration, warm cozy korean food art, hand drawn style, soybean paste stew with zucchini and tofu, top view, minimal background, high quality";
                    } else if (isKimchi) {
                        aiPrompt = "Kimchi Jjigae illustration, warm cozy korean food art, hand drawn style, delicious red stew with tofu and pork, top view, soft lighting, pastel colors, high quality";
                    }

                    // Force AI image for known types to avoid DB legacy URL issues
                    const useAiImage = isDoenjang || isKimchi;
                    const displayUrl = useAiImage
                        ? `https://image.pollinations.ai/prompt/${encodeURIComponent(aiPrompt)}?width=800&height=400&nologo=true&model=flux&seed=${recipe.id}`
                        : (recipe.imageUrl || `https://image.pollinations.ai/prompt/${encodeURIComponent(aiPrompt)}?width=800&height=400&nologo=true&model=flux&seed=${recipe.id}`);

                    return (
                        <div key={recipe.id} className="relative overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100 transition-all hover:shadow-md active:scale-98 group">
                            <Link href={`/recipes/${recipe.id}`} className="block">
                                {/* Image Area */}
                                <div className="aspect-[2/1] w-full bg-gray-100 relative overflow-hidden">
                                    <img
                                        src={displayUrl}
                                        alt={recipe.name}
                                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        onError={(e) => {
                                            // Fallback to Unsplash if AI fails
                                            const target = e.currentTarget;
                                            if (target.src !== fallbackUrl) {
                                                target.src = fallbackUrl;
                                            } else {
                                                // If even fallback fails, hide it
                                                target.style.display = 'none';
                                                target.nextElementSibling?.classList.remove('hidden');
                                            }
                                        }}
                                    />
                                    {/* CheckHat Fallback (Hidden by default, shown on error) */}
                                    <div className="hidden h-full w-full flex items-center justify-center text-gray-300 bg-gray-100 absolute inset-0">
                                        <ChefHat className="h-12 w-12 opacity-20" />
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                                    <div className="absolute bottom-4 left-4 right-4 text-white">
                                        {editingId === recipe.id ? (
                                            <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="flex-1 bg-white/90 text-black text-sm px-2 py-1 rounded focus:outline-none"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={saveName}
                                                    className="p-1 bg-green-500 rounded text-white hover:bg-green-600"
                                                >
                                                    <Check className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={cancelEditing}
                                                    className="p-1 bg-gray-500 rounded text-white hover:bg-gray-600"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-end justify-between w-full">
                                                <div>
                                                    <h2 className="text-xl font-black shadow-black drop-shadow-md flex items-end gap-1 group/title">
                                                        {recipe.name}
                                                        <button
                                                            onClick={(e) => startEditing(e, recipe)}
                                                            className="opacity-0 group-hover/title:opacity-100 transition-opacity p-1 hover:bg-white/20 rounded ml-1"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5 text-white/80" />
                                                        </button>
                                                    </h2>
                                                    <p className="text-xs font-medium opacity-90 truncate max-w-[200px]">{recipe.description || "설명 없음"}</p>
                                                </div>
                                                <span className="text-[10px] font-bold opacity-70 bg-black/30 px-1.5 py-0.5 rounded-full mb-0.5">v0.1.4</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Content Area */}
                                <div className="p-4">
                                    <div className="flex justify-between items-end mb-3">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pricing Summary</p>
                                            <p className="text-lg font-black text-gray-900">{recipe.sellingPrice?.toLocaleString() ?? 0}원</p>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-full">
                                            DETAIL <ArrowRight className="h-3 w-3" />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs font-bold text-gray-500 border-t border-gray-100 pt-3">
                                        <span className="flex items-center gap-1">
                                            <Plus className="h-3 w-3" /> {recipe.ingredients.length} Ingredients
                                        </span>
                                        <span className="flex items-center gap-1">
                                            {recipe.servings} Servings
                                        </span>
                                    </div>
                                </div>
                            </Link>

                            {/* Only show delete button when NOT editing to avoid clutter */}
                            {editingId !== recipe.id && (
                                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
                                    <DeleteRecipeButton recipeId={recipe.id} onDeleteSuccess={fetchRecipes} />
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Add New Button Card */}
                <AddRecipeModalClient onAddSuccess={fetchRecipes} />
            </div>

            {recipes.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
                    <ChefHat className="h-12 w-12 text-gray-300 mb-2" />
                    <p className="text-sm font-bold text-gray-400">등록된 메뉴가 없습니다.</p>
                    <p className="text-xs text-gray-400">아래 버튼을 눌러 첫 메뉴를 등록해보세요!</p>
                </div>
            )}
        </div>
    );
}
