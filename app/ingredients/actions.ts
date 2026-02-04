"use server";

import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

// --- Internal Logic (No session checks, no revalidatePath) ---

async function savePriceLogic(userId: string, ingredientId: number, data: {
    price: number;
    totalPrice?: number | null;
    amount?: number | null;
    unit: string;
    source: string;
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

    await prisma.ingredient.create({
        data: {
            name,
            unit,
            userId: (session.user as any).id as string,
        },
    });

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

    await savePriceLogic(userId, ingredientId, { price, totalPrice, amount, unit, source });

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
                        unit: item.unit,
                    },
                });
                ingredientId = newIngredient.id;
            }

            await savePriceLogic(userId, ingredientId, {
                price: item.price,
                totalPrice: item.originalPrice,
                amount: item.amount,
                unit: item.unit,
                source: item.source
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
