import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // @ts-ignore
        const userId = session.user.id;
        const recipeId = parseInt(params.id);

        // Fetch Recipe
        // @ts-ignore
        const recipe = await prisma.recipe.findFirst({
            where: { id: recipeId, userId },
            include: {
                ingredients: {
                    include: { ingredient: true }
                }
            }
        });

        if (!recipe) {
            return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
        }

        // Fetch All Ingredients (for adding new ones)
        const allIngredients = await prisma.ingredient.findMany({
            orderBy: { name: "asc" }
        });

        // Fetch Prices (for correct cost calculation)
        const prices = await prisma.ingredientPrice.findMany({
            where: {
                ingredientId: {
                    in: recipe.ingredients.map((ri: any) => ri.ingredientId)
                }
            },
            orderBy: { recordedAt: "desc" }
        });

        const priceMap: Record<number, number> = {};
        recipe.ingredients.forEach((ri: any) => {
            const itemPrices = prices.filter((p: any) => p.ingredientId === ri.ingredientId);
            priceMap[ri.ingredientId] = itemPrices.length > 0 ? itemPrices[0].price : 0;
        });

        return NextResponse.json({
            recipe: JSON.parse(JSON.stringify(recipe)),
            ingredients: JSON.parse(JSON.stringify(allIngredients)),
            priceMap
        });

    } catch (error: any) {
        console.error("[API_RECIPE_DETAIL] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
