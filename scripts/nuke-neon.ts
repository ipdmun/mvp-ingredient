
import { PrismaClient } from '@prisma/client';

// Explicitly use the Neon URL discovered in .env.prod
const neonUrl = "postgresql://neondb_owner:npg_9qwLlFD3dfgV@ep-cool-snow-ah9kodj4-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require";

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: neonUrl,
        },
    },
});

async function nuke() {
    console.log("💣 NEON DB NUKE INITIATED...");

    // 1. Count before
    const countBefore = await prisma.ingredientPrice.count();
    console.log(`📊 Count before: ${countBefore}`);

    if (countBefore > 0) {
        // 2. Raw SQL Delete
        // @ts-ignore
        const deletedCount = await prisma.$executeRaw`DELETE FROM "IngredientPrice"`;
        console.log(`💥 Raw SQL deleted rows: ${deletedCount}`);

        // 3. Fallback deleteMany
        const result = await prisma.ingredientPrice.deleteMany({});
        console.log(`🧹 Prisma deleteMany removed: ${result.count}`);
    }

    // 4. Check Ingredients
    const totalIngs = await prisma.ingredient.count();
    console.log(`📦 Total Ingredients in DB: ${totalIngs}`);

    const activeIngs = await prisma.ingredient.count({ where: { isDeleted: false } });
    console.log(`✅ Currently active ingredients: ${activeIngs}`);

    console.log("✨ CLEANUP COMPLETE ON NEON DB.");
}

nuke()
    .catch(e => console.error("❌ NEON NUKE FAILED:", e))
    .finally(() => prisma.$disconnect());
