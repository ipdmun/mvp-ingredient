"use server";

import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

/** 
 * DIAGNOSTIC: Get user ID with high-level reporting.
 */
async function getSafeUserId() {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            console.error("[AuthDiag] NO SESSION OBJECT. Check if NEXTAUTH_SECRET and NEXTAUTH_URL are set correctly on Vercel.");
            return null;
        }

        if (!session.user) {
            console.error("[AuthDiag] SESSION FOUND BUT NO USER. Possible cookie or auth config mismatch.");
            return null;
        }

        // @ts-ignore
        let userId = session.user.id;

        if (!userId && session.user.email) {
            console.log(`[AuthDiag] userId missing in session, looking up by email: ${session.user.email}`);
            const user = await prisma.user.findUnique({
                where: { email: session.user.email },
                select: { id: true }
            });
            userId = user?.id;
        }

        if (!userId) {
            console.error("[AuthDiag] FAILED TO RESOLVE USER ID. User might not exist in DB or email query failed.");
            return null;
        }

        console.log(`[AuthDiag] Successfully resolved user: ${userId} (${session.user.email})`);
        return userId;
    } catch (err) {
        console.error("[AuthDiag] CRITICAL EXCEPTION during auth check:", err);
        return null;
    }
}

// --- Presets ---

const RECIPE_PRESETS: Record<string, { imageUrl: string, ingredients: { name: string, amount: number, unit: string }[] }> = {
    "된장찌개": {
        imageUrl: "https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&q=80&w=800",
        ingredients: [
            { name: "된장", amount: 30, unit: "g" },
            { name: "두부", amount: 100, unit: "g" },
            { name: "무", amount: 50, unit: "g" },
            { name: "대파", amount: 20, unit: "g" },
        ]
    },
    "김치찌개": {
        imageUrl: "https://images.unsplash.com/photo-1617093228322-97cb355a6fa4?auto=format&fit=crop&q=80&w=800",
        ingredients: [
            { name: "김치", amount: 150, unit: "g" },
            { name: "돼지고기", amount: 100, unit: "g" },
            { name: "두부", amount: 100, unit: "g" },
            { name: "대파", amount: 20, unit: "g" },
        ]
    },
    "육전 국밥": {
        imageUrl: "https://images.unsplash.com/photo-1547928576-a4a33237bec3?auto=format&fit=crop&q=80&w=800",
        ingredients: [
            { name: "소고기(양지)", amount: 60, unit: "g" },
            { name: "무", amount: 50, unit: "g" },
            { name: "콩나물", amount: 30, unit: "g" },
            { name: "대파", amount: 15, unit: "g" },
            { name: "소고기(육전용)", amount: 30, unit: "g" },
            { name: "달걀", amount: 15, unit: "g" },
        ]
    },
    "국밥": {
        imageUrl: "https://images.unsplash.com/photo-1547928576-a4a33237bec3?auto=format&fit=crop&q=80&w=800",
        ingredients: [
            { name: "소고기(양지)", amount: 60, unit: "g" },
            { name: "무", amount: 50, unit: "g" },
            { name: "콩나물", amount: 30, unit: "g" },
            { name: "대파", amount: 15, unit: "g" },
        ]
    }
};

// --- Actions ---

export async function createRecipe(data: {
    name: string;
    description?: string;
    imageUrl?: string;
    servings?: number;
    sellingPrice?: number;
}) {
    console.log("[CreateRecipe] Initiated", data.name);
    const userId = await getSafeUserId();
    if (!userId) return { success: false, error: "로그인 세션이 만료되었습니다. 다시 로그인해주세요." };

    try {
        const recipeName = data.name.trim();
        const sortedKeys = Object.keys(RECIPE_PRESETS).sort((a, b) => b.length - a.length);
        const matchedKey = sortedKeys.find(k => recipeName.includes(k) || k.includes(recipeName));
        const preset = matchedKey ? RECIPE_PRESETS[matchedKey] : null;

        // @ts-ignore
        const recipe = await prisma.recipe.create({
            data: {
                userId,
                name: recipeName,
                description: data.description || "",
                imageUrl: data.imageUrl || preset?.imageUrl || null,
                servings: data.servings ?? 1,
                sellingPrice: data.sellingPrice || 0,
            }
        });

        console.log(`[CreateRecipe] Recipe created ID: ${recipe.id}`);

        if (preset) {
            for (const item of preset.ingredients) {
                try {
                    let ingredient = await prisma.ingredient.findFirst({ where: { name: item.name, userId } });
                    if (!ingredient) {
                        ingredient = await prisma.ingredient.create({ data: { name: item.name, unit: item.unit, userId } });
                    }
                    // @ts-ignore
                    await prisma.recipeIngredient.create({
                        data: {
                            recipeId: recipe.id,
                            ingredientId: ingredient.id,
                            amount: item.amount * (recipe.servings || 1)
                        }
                    });
                } catch (pe) { console.error(`[CreateRecipe] Preset insert error: ${item.name}`, pe); }
            }
        }

        revalidatePath("/recipes");
        // SANITIZATION: Convert to plain JSON to avoid Date object serialization issues
        const plainRecipe = JSON.parse(JSON.stringify(recipe));
        return { success: true, recipe: plainRecipe };
    } catch (err: any) {
        console.error("[CreateRecipe] FAILED:", err);
        return { success: false, error: "서버 저장 중 오류가 발생했습니다. (" + err.message + ")" };
    }
}

export async function deleteRecipe(recipeId: number) {
    console.log("[DeleteRecipe] Initiated ID:", recipeId);
    const userId = await getSafeUserId();
    if (!userId) return { success: false, error: "로그인 세션 만료" };

    try {
        // @ts-ignore
        const recipe = await prisma.recipe.findFirst({
            where: { id: recipeId, userId }
        });

        if (!recipe) {
            console.error("[DeleteRecipe] Forbidden or not found. Target:", recipeId, "User:", userId);
            return { success: false, error: "이미 삭제되었거나 삭제 권한이 없습니다." };
        }

        // Explicitly delete related recipeIngredients first to ensure clean deletion
        // @ts-ignore
        await prisma.recipeIngredient.deleteMany({
            where: { recipeId: recipeId }
        });
        console.log("[DeleteRecipe] Cleared ingredients for:", recipeId);

        // @ts-ignore
        await prisma.recipe.delete({ where: { id: recipeId } });
        console.log("[DeleteRecipe] Success:", recipeId);
        revalidatePath("/recipes");
        return { success: true };
    } catch (err: any) {
        console.error("[DeleteRecipe] FAILED:", err);
        return { success: false, error: "삭제 중 서버 오류: " + err.message };
    }
}

export async function addRecipeIngredient(recipeId: number, ingredientId: number, amount: number) {
    const userId = await getSafeUserId();
    if (!userId) return { success: false, error: "세션 만료" };

    try {
        // @ts-ignore
        const recipe = await prisma.recipe.findFirst({ where: { id: recipeId, userId } });
        if (!recipe) return { success: false, error: "레시피를 찾을 수 없거나 접근 권한이 없습니다." };

        // @ts-ignore
        const ri = await prisma.recipeIngredient.create({
            data: { recipeId, ingredientId, amount }
        });

        revalidatePath(`/recipes/${recipeId}`);
        // SANITIZATION
        const plainRi = JSON.parse(JSON.stringify(ri));
        return { success: true, ri: plainRi };
    } catch (err: any) {
        console.error("[AddRI] FAILED:", err);
        return { success: false, error: "재료 추가 서버 오류: " + err.message };
    }
}

export async function applyPresetToRecipe(recipeId: number) {
    const userId = await getSafeUserId();
    if (!userId) return { success: false, error: "세션 만료" };

    try {
        // @ts-ignore
        const recipe = await prisma.recipe.findFirst({ where: { id: recipeId, userId } });
        if (!recipe) return { success: false, error: "레시피 접근 불가" };

        const sortedKeys = Object.keys(RECIPE_PRESETS).sort((a, b) => b.length - a.length);
        const matchedKey = sortedKeys.find(k => recipe.name.includes(k) || k.includes(recipe.name));
        const preset = matchedKey ? RECIPE_PRESETS[matchedKey] : null;

        if (!preset) return { success: false, message: "일치하는 추천 레시피가 없습니다." };

        // [Auto-Fill Image] If recipe has no image, use the preset's image
        if (!recipe.imageUrl && preset.imageUrl) {
            console.log(`[ApplyPreset] Updating image for recipe ${recipeId}`);
            // @ts-ignore
            await prisma.recipe.update({
                where: { id: recipeId },
                data: { imageUrl: preset.imageUrl }
            });
        }

        for (const item of preset.ingredients) {
            try {
                let ingredient = await prisma.ingredient.findFirst({ where: { name: item.name, userId } });
                if (!ingredient) {
                    ingredient = await prisma.ingredient.create({ data: { name: item.name, unit: item.unit, userId } });
                }

                // Check if this ingredient is ALREADY in the recipe
                const existingRi = await prisma.recipeIngredient.findFirst({
                    where: {
                        recipeId: recipe.id,
                        ingredientId: ingredient.id
                    }
                });

                if (existingRi) {
                    console.log(`[ApplyPreset] Skipping ${item.name} - already exists in recipe`);
                    continue;
                }

                // [UNIT CONVERSION]
                let finalAmount = item.amount;
                // If user ingredient unit differs from preset unit
                if (ingredient.unit !== item.unit) {
                    console.log(`[ApplyPreset] Unit mismatch for ${item.name}: Preset(${item.unit}) vs User(${ingredient.unit})`);

                    const u1 = item.unit.toLowerCase(); // Preset unit
                    const u2 = ingredient.unit.toLowerCase(); // User unit

                    if (u1 === 'g' && u2 === 'kg') {
                        finalAmount = item.amount / 1000;
                    } else if (u1 === 'kg' && u2 === 'g') {
                        finalAmount = item.amount * 1000;
                    }
                    // Special case: "단" (Bundle) 
                    // Heuristic: 1 Bundle ≈ 800g (Typical for Green Onion/Daepa)
                    else if (u1 === 'g' && (u2 === '단' || u2 === 'bundle')) {
                        finalAmount = item.amount / 800;
                    }
                    else if (u1 === 'kg' && (u2 === '단' || u2 === 'bundle')) {
                        finalAmount = item.amount / 0.8;
                    }

                    console.log(`   -> Converted amount: ${item.amount} ${u1} -> ${finalAmount} ${u2}`);
                }

                // @ts-ignore
                await prisma.recipeIngredient.create({
                    data: {
                        recipeId: recipe.id,
                        ingredientId: ingredient.id,
                        amount: finalAmount * (recipe.servings || 1)
                    }
                });
            } catch (innerErr) {
                console.error(`[ApplyPreset] Failed to add item ${item.name}`, innerErr);
                // Continue with other items even if one fails
            }
        }

        revalidatePath(`/recipes/${recipeId}`);
        revalidatePath("/recipes"); // Ensure list view gets the new image
        return { success: true };
    } catch (err: any) {
        console.error("[ApplyPreset] FAILED:", err);
        return { success: false, error: "프리셋 오류: " + err.message };
    }
}

// Low-risk helpers
export async function updateRecipeIngredientAmount(riId: number, amount: number) {
    const userId = await getSafeUserId();
    if (!userId) return { success: false, error: "세션 만료" };
    // @ts-ignore
    const ri = await prisma.recipeIngredient.findUnique({ where: { id: riId }, include: { recipe: true } });
    // @ts-ignore
    if (ri?.recipe.userId !== userId) return { success: false, error: "권한 없음" };
    // @ts-ignore
    await prisma.recipeIngredient.update({ where: { id: riId }, data: { amount } });
    // @ts-ignore
    revalidatePath(`/recipes/${ri.recipeId}`);
    return { success: true };
}

export async function deleteRecipeIngredient(riId: number) {
    const userId = await getSafeUserId();
    if (!userId) return { success: false, error: "세션 만료" };
    // @ts-ignore
    const ri = await prisma.recipeIngredient.findUnique({ where: { id: riId }, include: { recipe: true } });
    // @ts-ignore
    if (ri?.recipe.userId !== userId) return { success: false, error: "권한 없음" };
    // @ts-ignore
    await prisma.recipeIngredient.delete({ where: { id: riId } });
    // @ts-ignore
    return { success: true };
}

export async function updateRecipe(recipeId: number, data: { name?: string, description?: string, servings?: number, sellingPrice?: number, imageUrl?: string }) {
    const userId = await getSafeUserId();
    if (!userId) return { success: false, error: "세션 만료" };

    try {
        // @ts-ignore
        const recipe = await prisma.recipe.findFirst({ where: { id: recipeId, userId } });
        if (!recipe) return { success: false, error: "권한 없음" };

        // @ts-ignore
        await prisma.recipe.update({
            where: { id: recipeId },
            data
        });

        revalidatePath(`/recipes/${recipeId}`);
        revalidatePath("/recipes");
        return { success: true };
    } catch (err: any) {
        console.error("[UpdateRecipe] FAILED:", err);
        return { success: false, error: "수정 오류: " + err.message };
    }
}
