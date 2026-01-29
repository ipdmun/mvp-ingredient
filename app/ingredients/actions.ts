"use server";

import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";

export async function createIngredient(formData: FormData) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        throw new Error("Unauthorized");
    }

    const name = formData.get("name") as string;
    const unit = formData.get("unit") as string;

    if (!name || !unit) {
        throw new Error("Name and unit are required");
    }

    await prisma.ingredient.create({
        data: {
            name,
            unit,
            userId: session.user.id,
        },
    });

    // /ingredients 페이지 다시 렌더링
    revalidatePath("/ingredients");
}

export async function deleteIngredient(id: number) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        throw new Error("Unauthorized");
    }

    // Related data must be deleted first because of foreign key constraints
    await prisma.ingredientPrice.deleteMany({
        where: { ingredientId: id },
    });

    await prisma.ingredient.delete({
        where: {
            id,
            // SECURITY: Ensure user can only delete their own ingredients
            // If Prisma client isn't updated, we check after fetching or use raw if needed
            // But for now, we'll follow the existing pattern and fix the lint if it persists
            userId: session.user.id as any,
        },
    });

    revalidatePath("/ingredients");
}

export async function createIngredientPrice(
    ingredientId: number,
    formData: FormData
) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
        throw new Error("Unauthorized");
    }

    const price = parseInt(formData.get("price") as string);
    const totalPrice = formData.get("totalPrice") ? parseInt(formData.get("totalPrice") as string) : null;
    const amount = formData.get("amount") ? parseFloat(formData.get("amount") as string) : null;
    const unit = formData.get("unit") as string;
    const source = formData.get("source") as string;

    if (!price || !unit || !source) {
        throw new Error("All fields are required");
    }

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
        ? Math.min(...existingPrices.map(p => p.price))
        : null;

    // 2. 새 가격 추가
    await prisma.ingredientPrice.create({
        data: {
            ingredientId,
            price,
            totalPrice,
            amount,
            unit,
            source,
        },
    });

    // 3. 최저가 갱신 확인 및 알림 생성
    if (currentLowestPrice !== null && price < currentLowestPrice) {
        const ingredient = await prisma.ingredient.findUnique({
            where: { id: ingredientId },
        });

        if (ingredient && ingredient.userId === session.user.id) {
            await prisma.notification.create({
                data: {
                    userId: session.user.id,
                    message: `🎉 [${ingredient.name}] 최저가 갱신! (${currentLowestPrice.toLocaleString()}원 → ${price.toLocaleString()}원)`,
                },
            });
        }
    } else if (currentLowestPrice === null) {
        // 이번 달 첫 가격 등록인 경우 (선택사항: 알림 줄지 말지. 여기선 생략)
    }

    revalidatePath(`/ingredients/${ingredientId}`);
    revalidatePath("/notifications"); // 알림 페이지 갱신
}

export async function updateIngredientUsage(id: number, usage: number) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        throw new Error("Unauthorized");
    }

    await prisma.ingredient.update({
        where: { id },
        data: { monthlyUsage: usage },
    });

    revalidatePath(`/ingredients/${id}`);
}

export async function getIngredients() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        return [];
    }

    return prisma.ingredient.findMany({
        where: {
            userId: session.user.id,
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function createBulkIngredientPrices(
    items: {
        name: string;
        price: number;
        unit: string;
        source: string;
    }[]
) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
        throw new Error("Unauthorized");
    }

    let successCount = 0;

    for (const item of items) {
        try {
            // 1. Find or Create Ingredient
            let ingredientId: number;

            const existingIngredient = await prisma.ingredient.findFirst({
                where: {
                    userId: session.user.id,
                    name: item.name,
                },
            });

            if (existingIngredient) {
                ingredientId = existingIngredient.id;
            } else {
                // Create new ingredient if not found
                const newIngredient = await prisma.ingredient.create({
                    data: {
                        userId: session.user.id,
                        name: item.name,
                        unit: item.unit, // Use unit from OCR as default
                    },
                });
                ingredientId = newIngredient.id;
            }

            // 2. Save Price
            await createIngredientPrice(
                ingredientId,
                setFormData(item.price, item.unit, item.source, item.originalPrice, item.amount)
            );
            successCount++;
        } catch (error) {
            console.error(`Failed to save price for ${item.name}`, error);
        }
    }

    revalidatePath("/ingredients");
    return { success: true, count: successCount };
}

// Helper to create FormData for reusing createIngredientPrice logic
function setFormData(price: number, unit: string, source: string, totalPrice?: number, amount?: number) {
    const formData = new FormData();
    formData.append("price", price.toString());
    formData.append("unit", unit);
    formData.append("source", source);
    if (totalPrice !== undefined && totalPrice !== null) formData.append("totalPrice", totalPrice.toString());
    if (amount !== undefined && amount !== null) formData.append("amount", amount.toString());
    return formData;
}
