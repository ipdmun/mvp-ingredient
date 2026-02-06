"use server";

import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

// --- Internal Logic (No session checks, no revalidatePath) ---

export async function savePriceLogic(userId: string, ingredientId: number, data: {
    price: number;
    totalPrice?: number | null;
    amount?: number | null;
    unit: string;
    source: string;
    marketData?: any; // Add optional marketData
}) {
    // 1. 해당 재료의 이번 달 기존 최저가 확인
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const existingPrices = await prisma.ingredientPrice.findMany({
        where: {
            ingredientId,
            recordedAt: { gte: startOfMonth },
        },
    });

    const currentLowestPrice = existingPrices.length > 0
        ? Math.min(...existingPrices.map((p: any) => p.price))
        : null;

    // 2. 새 가격 추가
    await prisma.ingredientPrice.create({
        data: {
            ingredientId,
            price: data.price,
            // @ts-ignore
            totalPrice: data.totalPrice,
            // @ts-ignore
            amount: data.amount,
            unit: data.unit,
            source: data.source,
            marketData: data.marketData ?? undefined, // Save to DB
        },
    });

    // 3. 최저가 갱신 확인 및 알림 생성 (사용자 본인 확인)
    if (currentLowestPrice !== null && data.price < currentLowestPrice) {
        const ingredient = await prisma.ingredient.findUnique({
            where: { id: ingredientId },
        });

        if (ingredient && (ingredient as any).userId === userId) {
            // @ts-ignore
            await prisma.notification.create({
                data: {
                    userId,
                    message: `🎉 [${ingredient.name}] 최저가 갱신! (${currentLowestPrice.toLocaleString()}원 → ${data.price.toLocaleString()}원)`,
                },
            });
        }
    }
}

// --- Exported Server Actions ---

export async function createIngredient(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) throw new Error("Unauthorized");

    const name = formData.get("name") as string;
    const unit = formData.get("unit") as string;

    if (!name || !unit) throw new Error("Name and unit are required");

    const price = parseInt(formData.get("price") as string);
    const amount = formData.get("amount") ? parseFloat(formData.get("amount") as string) : 1;

    // Check for existing ingredient
    const existingIngredient = await prisma.ingredient.findFirst({
        where: {
            name: name,
            userId: (session.user as any).id as string,
        }
    });

    let ingredientId: number;

    if (existingIngredient) {
        ingredientId = existingIngredient.id;
        // Keep existing logic, just skip updating updatedAt 
    } else {
        // Create Ingredient
        const newIngredient = await prisma.ingredient.create({
            data: {
                name,
                unit,
                userId: (session.user as any).id as string,
            },
        });
        ingredientId = newIngredient.id;
    }

    // Fetch Market Data & Create Price Record
    if (!isNaN(price) && price > 0) {
        const { getMarketAnalysis } = await import("@/app/lib/naver");
        const analysis = await getMarketAnalysis(name, price, unit, amount);

        // Calculate Unit Price for storage/comparison
        let unitPrice = price;
        if (amount > 0) {
            unitPrice = Math.round(price / amount);
        }

        await savePriceLogic((session.user as any).id, ingredientId, {
            price: unitPrice, // Save Unit Price
            totalPrice: price, // Save Total Paid
            unit,
            amount,
            source: "직접 입력",
            marketData: analysis
        });
    }

    revalidatePath("/ingredients");
    revalidatePath("/");
}

export async function deleteIngredient(id: number) {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) throw new Error("Unauthorized");

    // Related data must be deleted first
    await prisma.ingredientPrice.deleteMany({ where: { ingredientId: id } });
    await prisma.ingredient.delete({
        where: {
            id,
            userId: (session.user as any).id as any,
        },
    });

    revalidatePath("/");
}

export async function bulkDeleteIngredients(ids: number[]) {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) throw new Error("Unauthorized");
    const userId = (session.user as any).id;

    // Verify ownership and delete in transaction or batch
    // We can just use deleteMany with userId check for safety
    await prisma.ingredientPrice.deleteMany({
        where: {
            ingredientId: { in: ids },
            ingredient: { userId: userId } // Ensure we only delete prices for user's ingredients
        }
    });

    await prisma.ingredient.deleteMany({
        where: {
            id: { in: ids },
            userId: userId
        }
    });

    revalidatePath("/ingredients");
    revalidatePath("/");
}

export async function createIngredientPrice(ingredientId: number, formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) throw new Error("Unauthorized");
    const userId = (session.user as any).id;

    const price = parseInt(formData.get("price") as string);
    const totalPrice = formData.get("totalPrice") ? parseInt(formData.get("totalPrice") as string) : null;
    const amount = formData.get("amount") ? parseFloat(formData.get("amount") as string) : null;
    const unit = formData.get("unit") as string;
    const source = formData.get("source") as string;

    if (!price || !unit || !source) throw new Error("All fields are required");

    // Calculate Unit Price
    let unitPrice = price;
    if (amount && amount > 0) {
        unitPrice = Math.round(price / amount);
    }

    // Ensure totalPrice is set (it's the input price)
    const finalTotalPrice = totalPrice || price;

    await savePriceLogic(userId, ingredientId, {
        price: unitPrice,
        totalPrice: finalTotalPrice,
        amount: amount || 1,
        unit,
        source
    });

    revalidatePath(`/ingredients/${ingredientId}`);
    revalidatePath("/notifications");
    revalidatePath("/");
}

export async function updateIngredientUsage(id: number, usage: number) {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) throw new Error("Unauthorized");

    await prisma.ingredient.update({
        where: { id },
        data: { monthlyUsage: usage },
    });

    revalidatePath(`/ingredients/${id}`);
    revalidatePath("/");
}

export async function getIngredients() {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) return [];
    const userId = (session.user as any).id;

    console.log(`[getIngredients] Fetching for user: ${userId}`);

    return prisma.ingredient.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
    });
}

export async function createBulkIngredientPrices(items: {
    name: string;
    price: number;
    unit: string;
    source: string;
    amount?: number;
    originalPrice?: number;
    marketData?: any;
}[]) {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) throw new Error("Unauthorized");
    const userId = (session.user as any).id;

    console.log(`[BulkSave] Starting for user: ${userId}, items: ${items.length}`);
    let successCount = 0;

    for (const item of items) {
        try {
            let ingredientId: number;

            const existingIngredient = await prisma.ingredient.findFirst({
                where: {
                    // @ts-ignore
                    userId,
                    name: item.name,
                },
            });

            if (existingIngredient) {
                ingredientId = existingIngredient.id;
            } else {
                const newIngredient = await prisma.ingredient.create({
                    data: {
                        // @ts-ignore
                        userId,
                        name: item.name,
                        unit: item.unit || "개",
                    },
                });
                ingredientId = newIngredient.id;
            }

            // Ensure numbers are valid
            const safePrice = isNaN(item.price) ? 0 : item.price;
            const safeTotalPrice = item.originalPrice && !isNaN(item.originalPrice) ? item.originalPrice : null;
            const safeAmount = item.amount && !isNaN(item.amount) ? item.amount : null;

            await savePriceLogic(userId, ingredientId, {
                price: safePrice,
                totalPrice: safeTotalPrice,
                amount: safeAmount,
                unit: item.unit || "개",
                source: item.source || "Unknown",
                marketData: item.marketData || null // Pass market data
            });
            successCount++;
        } catch (error) {
            console.error(`Failed to save price for ${item.name}`, error);
        }
    }

    revalidatePath("/ingredients");
    revalidatePath("/notifications");
    revalidatePath("/");

    return { success: true, count: successCount };
}

// --- New Features: Market Price Checks ---

export async function checkMarketPrice(name: string, price: number, unit: string, amount: number) {
    const { getMarketAnalysis } = await import("@/app/lib/naver");
    const analysis = await getMarketAnalysis(name, price, unit, amount);
    return analysis;
}

export async function refreshIngredientPrice(ingredientId: number) {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) throw new Error("Unauthorized");
    const userId = (session.user as any).id;

    // 1. Get latest price record
    const ingredient = await prisma.ingredient.findUnique({
        where: { id: ingredientId },
        include: {
            prices: {
                orderBy: { recordedAt: "desc" },
                take: 1
            }
        }
    });

    if (!ingredient || ingredient.prices.length === 0) return null;

    const latestPrice = ingredient.prices[0];

    // 2. Fetch fresh market data
    const { getMarketAnalysis } = await import("@/app/lib/naver");
    const analysis = await getMarketAnalysis(
        ingredient.name,
        latestPrice.price,
        latestPrice.unit,
        latestPrice.amount || 1
    );

    if (analysis) {
        // 3. Update the existing price record with new market data
        await prisma.ingredientPrice.update({
            where: { id: latestPrice.id },
            data: {
                marketData: analysis
            }
        });

        revalidatePath("/");
        revalidatePath("/ingredients");
        return analysis;
    }

    return null;
}
