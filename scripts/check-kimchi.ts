
import { prisma } from "@/app/lib/prisma";

async function main() {
    const recipes = await prisma.recipe.findMany({
        where: { name: { contains: "김치" } },
        select: { id: true, name: true, imageUrl: true }
    });
    console.log("Kimchi Recipes:", JSON.stringify(recipes, null, 2));
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
