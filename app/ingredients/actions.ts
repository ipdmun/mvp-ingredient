"use server";

import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

// --- Internal Logic (No session checks, no revalidatePath) ---

import { getStandardWeight } from "@/app/lib/recipeUtils";

// Helper to normalize price to base unit (g, ml, 개)
function calculateNormalizedPrice(price: number, amount: number, unit: string, ingredientName: string) {
    // 1. Basic Unit Price (Total Price / Amount)
    let unitPrice = amount > 0 ? price / amount : price;
    let normalizedUnit = unit;
    let normalizedAmount = amount;

    // 2. Normalize Unit (kg -> g, l -> ml)
    const lowerUnit = unit.toLowerCase().trim();

    const isPieceUnit = /개|ea|piece|모|봉|단|포기/i.test(lowerUnit);

    if (lowerUnit === 'kg') {
        unitPrice = unitPrice / 1000; // Price per kg -> Price per g
        normalizedUnit = 'g';
        normalizedAmount = amount * 1000;
    } else if (lowerUnit === 'l' || lowerUnit === 'liter') {
        unitPrice = unitPrice / 1000; // Price per L -> Price per ml
        normalizedUnit = 'ml';
        normalizedAmount = amount * 1000;
    } else if (lowerUnit === '돈') {
        unitPrice = unitPrice / 3.75; // Price per don -> Price per g (approx)
        normalizedUnit = 'g';
        normalizedAmount = amount * 3.75;
    } else if (lowerUnit === '근') {
        unitPrice = unitPrice / 600; // Meat usually 600g
        normalizedUnit = 'g';
        normalizedAmount = amount * 600;
    } else if (isPieceUnit) {
        // [Piece-to-Weight Logic]
        // If the unit is piece-based, convert to grams based on standard weight
        const std = getStandardWeight(ingredientName);
        if (std) {
            unitPrice = unitPrice / std.weight; // Price per piece -> Price per g
            normalizedUnit = 'g';
            normalizedAmount = amount * std.weight;
        }
    }

    return {
        unitPrice: Math.round(unitPrice * 100) / 100, // Keep 2 decimal places for precision
        unit: normalizedUnit,
        amount: normalizedAmount
    };
}


export async function savePriceLogic(userId: string, ingredientId: number, data: {
    price: number;
    totalPrice?: number | null;
    amount?: number | null;
    unit: string;
    source: string;
    marketData?: any; // Add optional marketData
    type?: string; // New field
}) {
    // 1. 해당 재료의 이번 달 기존 최저가 확인 (PURCHASE type only)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const checkType = data.type || "PURCHASE";

    // Only verify "lowest price" logic for PURCHASE type
    let currentLowestPrice = null;
    if (checkType === "PURCHASE") {
        const existingPrices = await prisma.ingredientPrice.findMany({
            where: {
                ingredientId,
                type: "PURCHASE",
                recordedAt: { gte: startOfMonth },
            },
        });
        currentLowestPrice = existingPrices.length > 0
            ? Math.min(...existingPrices.map((p: any) => p.price))
            : null;
    }

    // 2. 새 가격 추가
    await prisma.ingredientPrice.create({
        data: {
            ingredientId,
            price: data.price,
            totalPrice: data.totalPrice,
            amount: data.amount,
            unit: data.unit,
            source: data.source,
            marketData: data.marketData ?? undefined,
            type: checkType,
        },
    });

    // 3. 최저가 갱신 확인 및 알림 (PURCHASE type only)
    if (checkType === "PURCHASE" && currentLowestPrice !== null && data.price < currentLowestPrice) {
        const ingredient = await prisma.ingredient.findUnique({ where: { id: ingredientId } });
        if (ingredient && (ingredient as any).userId === userId) {
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
        // Reset isDeleted if it was true, and update unit
        await prisma.ingredient.update({
            where: { id: ingredientId },
            data: {
                isDeleted: false,
                unit: unit, // Update unit in case it changed
                userId: (session.user as any).id as string // Ensure userId is passed if needed, though prisma handles it usually on unique
            }
        });
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
        // [Fix] Normalize Unit (kg -> g)
        const normalized = calculateNormalizedPrice(price, amount, unit, name);

        await savePriceLogic((session.user as any).id, ingredientId, {
            price: normalized.unitPrice, // Save Normalized Unit Price (e.g. per g)
            totalPrice: price, // Save Total Paid
            unit: normalized.unit, // Save Normalized Unit (e.g. g)
            amount: normalized.amount, // Save Normalized Amount
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

    console.log(`[deleteIngredient] Request for ID: ${id}`);

    try {
        const update = await prisma.ingredient.update({
            where: {
                id,
                userId: (session.user as any).id as any,
            },
            data: { isDeleted: true }
        });
        console.log(`[deleteIngredient] Success: ${id}, isDeleted: ${update.isDeleted}`);

        revalidatePath("/ingredients", "page");
        revalidatePath("/", "layout");
    } catch (error) {
        console.error(`[deleteIngredient] FAILED for ID ${id}. User: ${(session.user as any)?.id}. Error:`, error);
        throw error;
    }
}

export async function bulkDeleteIngredients(ids: number[]) {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) throw new Error("Unauthorized");
    const userId = (session.user as any).id;

    console.log(`[bulkDelete] Request for IDs: ${ids.join(', ')}`);

    try {
        const result = await prisma.ingredient.updateMany({
            where: {
                id: { in: ids },
                userId: userId
            },
            data: { isDeleted: true }
        });
        console.log(`[bulkDelete] Success. Count: ${result.count}`);

        revalidatePath("/ingredients", "page");
        revalidatePath("/", "layout");
    } catch (error) {
        console.error(`[bulkDelete] Error:`, error);
        throw error;
    }
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

    // Fetch Ingredient Name
    const ingredient = await prisma.ingredient.findUnique({ where: { id: ingredientId } });
    const ingredientName = ingredient?.name || "Unknown";

    // Calculate Unit Price with Normalization
    const normalized = calculateNormalizedPrice(price, amount || 1, unit, ingredientName);

    // Ensure totalPrice is set (it's the input price)
    const finalTotalPrice = totalPrice || price;

    await savePriceLogic(userId, ingredientId, {
        price: normalized.unitPrice,
        totalPrice: finalTotalPrice,
        amount: normalized.amount,
        unit: normalized.unit,
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
        where: {
            userId,
            isDeleted: false
        },
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
                // [Fix] Restore deleted ingredient and update unit
                await prisma.ingredient.update({
                    where: { id: ingredientId },
                    data: {
                        isDeleted: false,
                        unit: item.unit || "개"
                    }
                });
            } else {
                const newIngredient = await prisma.ingredient.create({
                    data: {
                        // @ts-ignore
                        userId,
                        name: item.name,
                        unit: item.unit || "개",
                        isDeleted: false
                    },
                });
                ingredientId = newIngredient.id;
            }

            // Normalize Data
            // We trust 'price' (Unit Price) from the client as the base truth if 'originalPrice' (Total) is missing.
            // If 'originalPrice' exists, we use it to calculate precision.

            let normalized;
            if (item.originalPrice && item.originalPrice > 0) {
                // Case A: accurate Total Price exists
                normalized = calculateNormalizedPrice(item.originalPrice, item.amount || 1, item.unit, item.name);
            } else {
                // Case B: Only Unit Price exists (or Total is 0/missing)
                // We treat item.price as the Unit Price for the given item.unit
                // To use calculateNormalizedPrice correctly:
                // "Total Price" = item.price * (item.amount || 1)
                const estimatedTotal = item.price * (item.amount || 1);
                normalized = calculateNormalizedPrice(estimatedTotal, item.amount || 1, item.unit, item.name);
            }

            // Sanitize Market Data
            const safeMarketData = item.marketData ? JSON.parse(JSON.stringify(item.marketData)) : undefined;

            await savePriceLogic(userId, ingredientId, {
                price: normalized.unitPrice,
                totalPrice: item.originalPrice || (normalized.unitPrice * normalized.amount), // Fallback to calculated total
                amount: normalized.amount,
                unit: normalized.unit,
                source: item.source || "Unknown",
                marketData: safeMarketData
            });
            successCount++;
        } catch (error) {
            console.error(`Failed to save price for ${item.name}`, error);
            // Don't throw, allow other items to proceed
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

    // Use Total Price for accurate comparison (matches naver.ts logic)
    // @ts-ignore
    const totalPrice = latestPrice.totalPrice ?? (latestPrice.price * (latestPrice.amount || 1));

    const analysis = await getMarketAnalysis(
        ingredient.name,
        totalPrice,
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

// --- Update & Delete Price Actions ---

export async function updateIngredientPrice(priceId: number, formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) throw new Error("Unauthorized");

    const inputTotalPrice = parseInt(formData.get("totalPrice") as string);
    const inputAmount = parseFloat(formData.get("amount") as string);
    const inputUnit = formData.get("unit") as string;
    const source = formData.get("source") as string;
    const recordedAt = formData.get("recordedAt") as string; // 'YYYY-MM-DD'

    if (!inputTotalPrice || !inputUnit || !source) throw new Error("Fields required");

    // Get name
    const priceRecord = await prisma.ingredientPrice.findUnique({
        where: { id: priceId },
        include: { ingredient: true }
    });
    if (!priceRecord) throw new Error("Record not found");
    const ingredientName = priceRecord.ingredient?.name || "Unknown";

    // Normalize
    const normalized = calculateNormalizedPrice(inputTotalPrice, inputAmount || 1, inputUnit, ingredientName);

    await prisma.ingredientPrice.update({
        where: { id: priceId },
        data: {
            price: normalized.unitPrice,
            totalPrice: inputTotalPrice,
            amount: normalized.amount,
            unit: normalized.unit,
            source,
            recordedAt: recordedAt ? new Date(recordedAt) : priceRecord.recordedAt
        }
    });

    revalidatePath(`/ingredients/${priceRecord.ingredientId}`);
    revalidatePath("/");
}

export async function deleteIngredientPrice(priceId: number) {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) throw new Error("Unauthorized");

    const priceRecord = await prisma.ingredientPrice.findUnique({ where: { id: priceId } });
    if (!priceRecord) return;

    await prisma.ingredientPrice.delete({
        where: { id: priceId }
    });

    revalidatePath(`/ingredients/${priceRecord.ingredientId}`);
    revalidatePath("/");
}
