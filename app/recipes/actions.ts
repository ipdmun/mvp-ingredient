"use server";

import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { Prisma } from "@prisma/client";
import { convertIngredientAmount } from "@/app/lib/recipeUtils";

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

        return userId;
    } catch (err) {
        console.error("[AuthDiag] CRITICAL EXCEPTION during auth check:", err);
        return null;
    }
}

// --- Presets ---

interface PresetIngredient {
    name: string;
    amount: number;
    unit: string;
}

const RECIPE_PRESETS: Record<string, { imageUrl: string, ingredients: PresetIngredient[] }> = {
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
        const recipeNameClean = recipeName.replace(/\s+/g, ""); // 공백 제거 비교용

        // Find preset with looser matching
        const sortedKeys = Object.keys(RECIPE_PRESETS).sort((a, b) => b.length - a.length);
        const matchedKey = sortedKeys.find(k => {
            const kClean = k.replace(/\s+/g, "");
            return recipeNameClean.includes(kClean) || kClean.includes(recipeNameClean);
        });
        const preset = matchedKey ? RECIPE_PRESETS[matchedKey] : null;

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
            console.log(`[CreateRecipe] Applied preset: ${matchedKey}`);
            for (const item of preset.ingredients) {
                try {
                    let ingredient = await prisma.ingredient.findFirst({ where: { name: item.name, userId } });
                    if (!ingredient) {
                        ingredient = await prisma.ingredient.create({
                            data: { name: item.name, unit: item.unit, userId }
                        });
                    }

                    // [UNIT CONVERSION]
                    const finalAmount = convertIngredientAmount(item.name, item.amount, item.unit, ingredient.unit);

                    await prisma.recipeIngredient.create({
                        data: {
                            recipeId: recipe.id,
                            ingredientId: ingredient.id,
                            amount: finalAmount * (recipe.servings || 1)
                        }
                    });
                } catch (pe) { console.error(`[CreateRecipe] Preset insert error: ${item.name}`, pe); }
            }
        }

        revalidatePath("/recipes");
        return { success: true, recipe: recipe };
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
        const recipe = await prisma.recipe.findFirst({
            where: { id: recipeId, userId }
        });

        if (!recipe) {
            console.error("[DeleteRecipe] Forbidden or not found. Target:", recipeId, "User:", userId);
            return { success: false, error: "이미 삭제되었거나 삭제 권한이 없습니다." };
        }

        // Transaction for atomic deletion
        await prisma.$transaction([
            prisma.recipeIngredient.deleteMany({
                where: { recipeId: recipeId }
            }),
            prisma.recipe.delete({
                where: { id: recipeId }
            })
        ]);

        console.log("[DeleteRecipe] Success:", recipeId);
        revalidatePath("/recipes");
        return { success: true };
    } catch (err: any) {
        console.error("[DeleteRecipe] FAILED:", err);
        return { success: false, error: "삭제 중 서버 오류: " + err.message };
    }
}

export async function addRecipeIngredient(recipeId: number, ingredientId: number, amount: number) {
    console.log(`[AddRI] Init: Recipe(${recipeId}), Ing(${ingredientId}), Amount(${amount})`);
    const userId = await getSafeUserId();
    if (!userId) return { success: false, error: "세션 만료" };

    if (!recipeId || !ingredientId || amount == null) {
        console.error(`[AddRI] Invalid args: R:${recipeId}, I:${ingredientId}, A:${amount}`);
        return { success: false, error: "잘못된 요청입니다. (필수 값 누락)" };
    }

    try {
        const recipe = await prisma.recipe.findFirst({ where: { id: recipeId, userId } });
        if (!recipe) return { success: false, error: "레시피를 찾을 수 없거나 접근 권한이 없습니다." };

        // [Check for existing]
        const existing = await prisma.recipeIngredient.findFirst({
            where: { recipeId, ingredientId }
        });

        if (existing) {
            // Update existing
            const updated = await prisma.recipeIngredient.update({
                where: { id: existing.id },
                data: { amount: existing.amount + amount }
            });
            revalidatePath(`/recipes/${recipeId}`);
            return { success: true, ri: updated, message: "Added to existing ingredient" };
        }

        const ri = await prisma.recipeIngredient.create({
            data: { recipeId, ingredientId, amount }
        });

        revalidatePath(`/recipes/${recipeId}`);
        return { success: true, ri: ri };
    } catch (err: any) {
        console.error("[AddRI] FAILED:", err);
    }
}

// @ts-ignore
import { savePriceLogic } from "@/app/ingredients/actions";

export async function createAndAddRecipeIngredient(
    recipeId: number,
    name: string,
    unit: string,
    amount: number,
    purchasePrice?: number,  // New: Purchase Price (Total)
    purchaseAmount?: number  // New: Purchase Amount (Total)
) {
    console.log(`[CreateAndAddRI] Init: Recipe(${recipeId}), Name(${name}), Unit(${unit}), Amount(${amount}), P.Price(${purchasePrice}), P.Amount(${purchaseAmount})`);
    const userId = await getSafeUserId();
    if (!userId) return { success: false, error: "세션 만료" };

    if (!recipeId || !name || !unit || amount == null) {
        return { success: false, error: "모든 항목을 입력해주세요." };
    }

    try {
        const recipe = await prisma.recipe.findFirst({ where: { id: recipeId, userId } });
        if (!recipe) return { success: false, error: "권한 없음" };

        // 1. Find or Create Ingredient
        // 이름으로 검색 (내 재료)
        let ingredient = await prisma.ingredient.findFirst({
            where: { name: name.trim(), userId }
        });

        if (!ingredient) {
            console.log(`[CreateAndAddRI] Creating new ingredient: ${name}`);
            ingredient = await prisma.ingredient.create({
                data: {
                    name: name.trim(),
                    unit: unit.trim().toLowerCase(), // Enforce Lowercase
                    userId
                }
            });
        }

        // [New Feature] Save Price History if provided
        if (purchasePrice && purchasePrice > 0) {
            // Calculate Unit Price
            let unitPrice = purchasePrice;
            const pAmount = purchaseAmount || 1;

            if (pAmount > 0) {
                unitPrice = Math.round(purchasePrice / pAmount);
            }

            try {
                // Fetch Market Data (Optional, but good for consistency)
                const { getMarketAnalysis } = await import("@/app/lib/naver");
                const analysis = await getMarketAnalysis(name, purchasePrice, unit, pAmount);

                await savePriceLogic(userId, ingredient.id, {
                    price: unitPrice,
                    totalPrice: purchasePrice,
                    amount: pAmount,
                    unit: unit.trim().toLowerCase(),
                    source: "레시피 등록 시 입력",
                    marketData: analysis
                });
                console.log(`[CreateAndAddRI] Saved price history for ${name}`);
            } catch (priceErr) {
                console.error(`[CreateAndAddRI] Failed to save price history`, priceErr);
                // Non-blocking error
            }
        }

        // 2. Add to Recipe (Reuse existing logic logic or duplicate for clarity)
        // Check existing link
        const existingRi = await prisma.recipeIngredient.findFirst({
            where: { recipeId, ingredientId: ingredient.id }
        });

        if (existingRi) {
            // 이미 있으면 수량 추가
            await prisma.recipeIngredient.update({
                where: { id: existingRi.id },
                data: { amount: existingRi.amount + amount }
            });
        } else {
            await prisma.recipeIngredient.create({
                data: {
                    recipeId,
                    ingredientId: ingredient.id,
                    amount
                }
            });
        }

        revalidatePath(`/recipes/${recipeId}`);
        revalidatePath("/ingredients");

        return { success: true };
    } catch (err: any) {
        console.error("[CreateAndAddRI] FAILED:", err);
        return { success: false, error: "추가 오류: " + err.message };
    }
}

export async function applyPresetToRecipe(recipeId: number) {
    const userId = await getSafeUserId();
    if (!userId) return { success: false, error: "세션 만료" };

    try {
        const recipe = await prisma.recipe.findFirst({ where: { id: recipeId, userId } });
        if (!recipe) return { success: false, error: "레시피 접근 불가" };

        const recipeNameClean = recipe.name.replace(/\s+/g, "");
        const sortedKeys = Object.keys(RECIPE_PRESETS).sort((a, b) => b.length - a.length);
        const matchedKey = sortedKeys.find(k => {
            const kClean = k.replace(/\s+/g, "");
            return recipeNameClean.includes(kClean) || kClean.includes(recipeNameClean);
        });
        const preset = matchedKey ? RECIPE_PRESETS[matchedKey] : null;

        if (!preset) return { success: false, message: "일치하는 추천 레시피가 없습니다." };

        // [Auto-Fill Image] If recipe has no image, use the preset's image
        if (!recipe.imageUrl && preset.imageUrl) {
            console.log(`[ApplyPreset] Updating image for recipe ${recipeId}`);
            await prisma.recipe.update({
                where: { id: recipeId },
                data: { imageUrl: preset.imageUrl }
            });
        }

        const createOps = [];

        for (const item of preset.ingredients) {
            try {
                let ingredient = await prisma.ingredient.findFirst({ where: { name: item.name, userId } });
                if (!ingredient) {
                    ingredient = await prisma.ingredient.create({
                        data: { name: item.name, unit: item.unit, userId }
                    });
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

                // [UNIT CONVERSION] - Using shared strict logic
                const finalAmount = convertIngredientAmount(item.name, item.amount, item.unit, ingredient.unit);

                createOps.push(
                    prisma.recipeIngredient.create({
                        data: {
                            recipeId: recipe.id,
                            ingredientId: ingredient.id,
                            amount: finalAmount * (recipe.servings || 1)
                        }
                    })
                );
            } catch (innerErr) {
                console.error(`[ApplyPreset] Failed to prepare item ${item.name}`, innerErr);
                // Continue with other items even if one fails
            }
        }

        if (createOps.length > 0) {
            await prisma.$transaction(createOps);
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

    try {
        const ri = await prisma.recipeIngredient.findUnique({ where: { id: riId }, include: { recipe: true } });
        if (!ri || ri.recipe.userId !== userId) return { success: false, error: "권한 없음 또는 찾을 수 없음" };

        await prisma.recipeIngredient.update({ where: { id: riId }, data: { amount } });
        revalidatePath(`/recipes/${ri.recipeId}`);
        return { success: true };
    } catch (err: any) {
        return { success: false, error: "수정 오류: " + err.message };
    }
}

export async function deleteRecipeIngredient(riId: number) {
    const userId = await getSafeUserId();
    if (!userId) return { success: false, error: "세션 만료" };

    try {
        const ri = await prisma.recipeIngredient.findUnique({ where: { id: riId }, include: { recipe: true } });
        if (!ri || ri.recipe.userId !== userId) return { success: false, error: "권한 없음 또는 찾을 수 없음" };

        await prisma.recipeIngredient.delete({ where: { id: riId } });
        return { success: true };
    } catch (err: any) {
        return { success: false, error: "삭제 오류: " + err.message };
    }
}

export async function deleteRecipeIngredients(riIds: number[]) {
    const userId = await getSafeUserId();
    if (!userId) return { success: false, error: "세션 만료" };

    try {
        // Verify ownership for all items (simple check: if count matches)
        const count = await prisma.recipeIngredient.count({
            where: {
                id: { in: riIds },
                recipe: { userId }
            }
        });

        if (count !== riIds.length) {
            return { success: false, error: "일부 항목에 대한 권한이 없거나 찾을 수 없습니다." };
        }

        await prisma.recipeIngredient.deleteMany({
            where: { id: { in: riIds } }
        });

        return { success: true };
    } catch (err: any) {
        return { success: false, error: "일괄 삭제 오류: " + err.message };
    }
}

export async function updateRecipe(recipeId: number, data: { name?: string, description?: string, servings?: number, sellingPrice?: number, imageUrl?: string }) {
    const userId = await getSafeUserId();
    if (!userId) return { success: false, error: "세션 만료" };

    try {
        const recipe = await prisma.recipe.findFirst({ where: { id: recipeId, userId } });
        if (!recipe) return { success: false, error: "권한 없음" };

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
