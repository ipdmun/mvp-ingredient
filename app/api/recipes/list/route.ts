import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // @ts-ignore
        const userId = session.user.id;

        // Use fallback if ID is missing (double check)
        if (!userId && session.user.email) {
            const user = await prisma.user.findUnique({
                where: { email: session.user.email },
                select: { id: true }
            });
            if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // @ts-ignore
        const recipes = await prisma.recipe.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            include: {
                ingredients: {
                    include: { ingredient: true }
                }
            }
        });

        // Collect all ingredient IDs to fetch prices
        const allIngredientIds = new Set<number>();
        recipes.forEach((r: any) => {
            r.ingredients.forEach((ri: any) => allIngredientIds.add(ri.ingredientId));
        });

        // Fetch latest prices for these ingredients
        const prices = await prisma.ingredientPrice.findMany({
            where: {
                ingredientId: { in: Array.from(allIngredientIds) }
            },
            orderBy: { recordedAt: "desc" },
            // distinct: ['ingredientId'] // Prisma generic distinct might be tricky, let's manual filter
        });

        // Create Price Map (Latest Price)
        const priceMap: Record<number, number> = {};
        prices.forEach((p: any) => {
            if (priceMap[p.ingredientId] === undefined) {
                priceMap[p.ingredientId] = p.price;
            }
        });

        // Calculate Metrics for each recipe
        const enrichedRecipes = recipes.map((recipe: any) => {
            let totalCost = 0;
            recipe.ingredients.forEach((ri: any) => {
                const price = priceMap[ri.ingredientId] || 0;
                totalCost += price * ri.amount; // total cost for this batch
            });

            const servings = recipe.servings || 1;
            const unitCost = Math.round(totalCost / servings); // Cost per serving
            const sellingPrice = recipe.sellingPrice || 0;

            // Analytics
            const unitProfit = sellingPrice - unitCost;
            const costRate = sellingPrice > 0 ? (unitCost / sellingPrice) * 100 : 0;
            const marginRate = sellingPrice > 0 ? (unitProfit / sellingPrice) * 100 : 0;

            return {
                ...recipe,
                analytics: {
                    totalCost, // Batch cost
                    unitCost,  // Per serving
                    unitProfit,
                    costRate: Number(costRate.toFixed(1)),
                    marginRate: Number(marginRate.toFixed(1))
                }
            };
        });

        // Manual sanitization
        const sanitized = JSON.parse(JSON.stringify(enrichedRecipes));

        return NextResponse.json({ recipes: sanitized });
    } catch (error: any) {
        console.error("[API_RECIPES_LIST] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
