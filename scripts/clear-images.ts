
import { prisma } from "@/app/lib/prisma";

async function main() {
    console.log("Clearing image URLs...");
    const result = await prisma.recipe.updateMany({
        where: {
            OR: [
                { name: { contains: "된장" } },
                { name: { contains: "김치" } }
            ]
        },
        data: { imageUrl: null }
    });

    console.log(`Updated ${result.count} recipes. Image URL set to null to trigger AI fallback.`);
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
