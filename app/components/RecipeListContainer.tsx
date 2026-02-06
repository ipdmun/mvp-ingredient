"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ChefHat, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import AddRecipeModalClient from "../recipes/AddRecipeModalClient";
import DeleteRecipeButton from "@/app/components/DeleteRecipeButton";

export default function RecipeListContainer() {
    const [recipes, setRecipes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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

    // Also listen for a global event or valid re-fetch trigger if needed
    // For now, simpler is better.

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
                {recipes.map((recipe: any) => (
                    <div key={recipe.id} className="relative overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100 transition-all hover:shadow-md active:scale-98 group">
                        <Link href={`/recipes/${recipe.id}`} className="block">
                            {/* Image Area */}
                            <div className="aspect-[2/1] w-full bg-gray-100 relative overflow-hidden">
                                <img
                                    src={recipe.imageUrl || `https://image.pollinations.ai/prompt/${encodeURIComponent(recipe.name)}%20korean%20food%20authentic%20meal?width=800&height=400&nologo=true&seed=${recipe.id}`}
                                    alt={recipe.name}
                                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    onError={(e) => {
                                        // Fallback if AI image fails
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                    }}
                                />
                                {/* CheckHat Fallback (Hidden by default, shown on error) */}
                                <div className="hidden h-full w-full flex items-center justify-center text-gray-300 bg-gray-100 absolute inset-0">
                                    <ChefHat className="h-12 w-12 opacity-20" />
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <div className="absolute bottom-4 left-4 text-white">
                                    <h2 className="text-xl font-black shadow-black drop-shadow-md">{recipe.name}</h2>
                                    <p className="text-xs font-medium opacity-90">{recipe.description || "설명 없음"}</p>
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

                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
                            {/* Passing onSuccess to trigger refresh */}
                            <DeleteRecipeButton recipeId={recipe.id} onDeleteSuccess={fetchRecipes} />
                        </div>
                    </div>
                ))}

                {/* Add New Button Card */}
                {/* Pass onSuccess to fetchRecipes */}
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
