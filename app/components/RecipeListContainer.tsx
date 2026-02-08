"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ChefHat, ArrowRight, Loader2, AlertCircle, Pencil, Check, X } from "lucide-react";
import AddRecipeModalClient from "../recipes/AddRecipeModalClient";
import DeleteRecipeButton from "@/app/components/DeleteRecipeButton";
import { updateRecipe } from "@/app/recipes/actions";
import { KOREAN_FOOD_IMAGES } from "@/app/lib/koreanFoodImages";
import RecipeCard from "@/app/recipes/RecipeCard";

export default function RecipeListContainer() {
    const [recipes, setRecipes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Editing State (Moved to RecipeCard, but keeping parent for refresh if needed)
    // const [editingId, setEditingId] = useState<number | null>(null);
    // const [editName, setEditName] = useState("");
    // const [isSaving, setIsSaving] = useState(false);

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
                    <RecipeCard
                        key={recipe.id}
                        recipe={recipe}
                        onDeleteSuccess={fetchRecipes}
                        onEditSuccess={fetchRecipes}
                    />
                ))}

                {/* Add New Button Card */}
                <AddRecipeModalClient onAddSuccess={fetchRecipes} />
            </div >

            {
                recipes.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
                        <ChefHat className="h-12 w-12 text-gray-300 mb-2" />
                        <p className="text-sm font-bold text-gray-400">등록된 메뉴가 없습니다.</p>
                        <p className="text-xs text-gray-400">아래 버튼을 눌러 첫 메뉴를 등록해보세요!</p>
                    </div>
                )
            }
        </div >
    );
}
