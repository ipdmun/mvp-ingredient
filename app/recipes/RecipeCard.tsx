"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ChefHat, ArrowRight, Pencil, Check, X, Camera, Loader2, ImagePlus } from "lucide-react";
import DeleteRecipeButton from "@/app/components/DeleteRecipeButton";
import { updateRecipe, updateRecipeImage } from "@/app/recipes/actions";

interface RecipeCardProps {
    recipe: any;
    onDeleteSuccess: () => void;
    onEditSuccess: () => void;
}

export default function RecipeCard({ recipe, onDeleteSuccess, onEditSuccess }: RecipeCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [isImageLoading, setIsImageLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Determine Display URL
    // Priority: 1. DB-stored ImageUrl (User uploaded or Preset) -> 2. AI Prompt -> 3. Fallback
    // Wait, the original logic was: Prompt -> ImageUrl -> Fallback.
    // But if user Uploads an image, we want that to take precedence.
    // In `updateRecipeImage`, we clear `illustrationPrompt` if user uploads.
    // So the logic holds: check Prompt (if exists) -> ImageUrl -> Fallback.
    // But if `illustrationPrompt` exists, it generates.

    // Let's refine: If `imageUrl` is set AND `illustrationPrompt` is null, use `imageUrl`.
    // If `illustrationPrompt` exists, use AI.
    // But wait, if user uploads, we cleared `illustrationPrompt`. So it works.

    const prompt = recipe.illustrationPrompt;
    const imageUrl = recipe.imageUrl;
    const fallbackUrl = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800";

    let displayUrl = fallbackUrl;
    let isAi = false;

    if (prompt) {
        displayUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=400&nologo=true&model=flux&seed=${recipe.id}`;
        isAi = true;
    } else if (imageUrl) {
        displayUrl = imageUrl;
    } else {
        // Fallback generic AI
        const genericPrompt = `${recipe.name} delicious korean food illustration art high quality`;
        displayUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(genericPrompt)}?width=800&height=400&nologo=true&model=flux&seed=${recipe.id}`;
        isAi = true;
    }

    const startEditing = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsEditing(true);
        setEditName(recipe.name);
    };

    const cancelEditing = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsEditing(false);
        setEditName("");
    };

    const saveName = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!editName.trim()) return;

        try {
            await updateRecipe(recipe.id, { name: editName });
            setIsEditing(false);
            onEditSuccess();
        } catch (error) {
            alert("수정 실패");
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check size (e.g. 5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            alert("이미지 크기는 5MB 이하여야 합니다.");
            return;
        }

        setIsUploading(true);
        try {
            // Convert to Base64
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = reader.result as string;
                const res = await updateRecipeImage(recipe.id, base64);
                if (res.success) {
                    onEditSuccess(); // Refresh list to show new image
                    setIsImageLoading(true); // Reset loading state for new image
                } else {
                    alert(res.error || "이미지 업로드 실패");
                }
                setIsUploading(false);
            };
            reader.onerror = () => {
                alert("파일 읽기 오류");
                setIsUploading(false);
            };
        } catch (error) {
            console.error(error);
            setIsUploading(false);
        }
    };

    return (
        <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100 transition-all hover:shadow-md active:scale-98 group">
            <Link href={`/recipes/${recipe.id}`} className="block">
                {/* Image Area */}
                <div className="aspect-[2/1] w-full bg-gray-100 relative overflow-hidden group/image">
                    {/* Loading Overlay */}
                    {(isImageLoading || isUploading) && (
                        <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center z-10 text-gray-400">
                            <Loader2 className="h-8 w-8 animate-spin mb-2" />
                            <span className="text-xs font-bold">
                                {isUploading ? "업로드 중..." : "이미지 생성중..."}
                            </span>
                        </div>
                    )}

                    <img
                        src={displayUrl}
                        alt={recipe.name}
                        className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}
                        onLoad={() => setIsImageLoading(false)}
                        onError={(e) => {
                            const target = e.currentTarget;
                            if (target.src !== fallbackUrl) {
                                target.src = fallbackUrl;
                            } else {
                                setIsImageLoading(false); // Stop loading if failed
                            }
                        }}
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

                    {/* Image Edit Button (Visible on hover or edit mode) */}
                    <div
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            fileInputRef.current?.click();
                        }}
                        className="absolute top-3 left-3 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 cursor-pointer transition-opacity opacity-0 group-hover/image:opacity-100 z-20 backdrop-blur-sm"
                        title="이미지 변경"
                    >
                        <Camera className="h-4 w-4" />
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            accept="image/*"
                            className="hidden"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 text-white z-20">
                        {isEditing ? (
                            <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex-1 bg-white/90 text-black text-sm px-2 py-1 rounded focus:outline-none"
                                    autoFocus
                                />
                                <button onClick={saveName} className="p-1 bg-green-500 rounded text-white hover:bg-green-600">
                                    <Check className="h-4 w-4" />
                                </button>
                                <button onClick={cancelEditing} className="p-1 bg-gray-500 rounded text-white hover:bg-gray-600">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-end justify-between w-full">
                                <div>
                                    <h2 className="text-xl font-black shadow-black drop-shadow-md flex items-end gap-1 group/title">
                                        {recipe.name}
                                        <button
                                            onClick={(e) => startEditing(e)}
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

                    <div className="mb-3 grid grid-cols-2 gap-2 text-center">
                        <div className="rounded-lg bg-gray-50 p-2">
                            <p className="text-[10px] font-bold text-gray-400">원가 (1인)</p>
                            <p className="text-sm font-black text-gray-900">
                                {recipe.analytics?.unitCost.toLocaleString() ?? 0}원
                            </p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-2">
                            <p className="text-[10px] font-bold text-gray-400">이익</p>
                            <p className={`text-sm font-black ${recipe.analytics?.unitProfit > 0 ? "text-blue-600" : "text-red-500"}`}>
                                {recipe.analytics?.unitProfit.toLocaleString() ?? 0}원
                            </p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-2">
                            <p className="text-[10px] font-bold text-gray-400">원가율</p>
                            <p className="text-sm font-black text-gray-900">
                                {recipe.analytics?.costRate ?? 0}%
                            </p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-2">
                            <p className="text-[10px] font-bold text-gray-400">마진율</p>
                            <p className={`text-sm font-black ${recipe.analytics?.marginRate > 0 ? "text-blue-600" : "text-red-500"}`}>
                                {recipe.analytics?.marginRate ?? 0}%
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-bold text-gray-500 border-t border-gray-100 pt-3">
                        <span className="flex items-center gap-1">
                            <ChefHat className="h-3 w-3" /> {recipe.ingredients.length} Ingredients
                        </span>
                        <span className="flex items-center gap-1">
                            {recipe.servings} Servings
                        </span>
                    </div>
                </div>
            </Link>

            {/* Delete Button - Optimized for Mobile */}
            {!isEditing && (
                <div className="absolute top-3 right-3 transition-opacity pointer-events-auto opacity-100 md:opacity-0 md:group-hover:opacity-100 z-30">
                    <DeleteRecipeButton recipeId={recipe.id} onDeleteSuccess={onDeleteSuccess} />
                </div>
            )}
        </div>
    );
}
