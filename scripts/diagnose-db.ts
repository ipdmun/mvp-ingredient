
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function diagnose() {
    console.log("🔍 Diagnosing IngredientPrice data...");

    const count = await prisma.ingredientPrice.count();
    console.log(`Total IngredientPrice records: ${count}`);

    if (count > 0) {
        const samples = await prisma.ingredientPrice.findMany({
            take: 5,
            include: { ingredient: true }
        });
        console.log("Sample records:");
        samples.forEach(s => {
            console.log(`- [${s.recordedAt.toISOString()}] ${s.ingredient?.name}: ${s.price} ${s.unit} (${s.source})`);
        });
    }

    const deletedIngredientsWithPrices = await prisma.ingredient.count({
        where: {
            isDeleted: true,
            prices: { some: {} }
        }
    });
    console.log(`Deleted ingredients that still have prices: ${deletedIngredientsWithPrices}`);
}

diagnose()
    .catch(e => console.error("❌ Diagnosis failed:", e))
    .finally(() => prisma.$disconnect());
