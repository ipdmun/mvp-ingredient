"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import RecipeDetailClient from "./RecipeDetailClient";

export default function RecipeDetailContainer() {
    const params = useParams();
    const router = useRouter();
    const [data, setData] = useState<{ recipe: any, ingredients: any[], priceMap: any } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchRecipe = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/recipes/${params.id}`);
            const json = await res.json();

            if (!res.ok) {
                if (res.status === 404) router.push("/recipes");
                throw new Error(json.error || "Failed");
            }

            const safeIngredients = Array.isArray(json.ingredients) ? json.ingredients : [];
            setData({ ...json, ingredients: safeIngredients });
            setError("");
        } catch (e: any) {
            console.error(e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (params.id) fetchRecipe();
    }, [params.id]);

    const handleRefresh = () => {
        fetchRecipe();
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-orange-500" /></div>;
    if (error) return (
        <div className="h-screen flex flex-col items-center justify-center text-red-500 gap-4">
            <AlertCircle className="h-10 w-10" />
            <p>{error}</p>
            <button onClick={fetchRecipe} className="px-4 py-2 bg-white border border-red-200 rounded">Retry</button>
        </div>
    );
    if (!data) return null;

    return (
        <RecipeDetailClient
            recipe={data.recipe}
            ingredients={data.ingredients}
            priceMap={data.priceMap}
            onDataChange={handleRefresh}
        />
    );
}
