
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function nuke() {
    console.log("💣 RAW NUKE INITIATED...");

    // 1. Check DB URL (censored)
    const dbUrl = process.env.DATABASE_URL || "NOT SET";
    console.log(`📡 DB URL starts with: ${dbUrl.substring(0, 20)}...`);

    // 2. Count before
    const countBefore = await prisma.ingredientPrice.count();
    console.log(`📊 Count before: ${countBefore}`);

    // 3. Raw SQL Delete (Just in case deleteMany is being optimized away or failing)
    // @ts-ignore
    const deletedCount = await prisma.$executeRaw`DELETE FROM "IngredientPrice"`;
    console.log(`💥 Raw SQL deleted rows: ${deletedCount}`);

    // 4. Fallback deleteMany
    const result = await prisma.ingredientPrice.deleteMany({});
    console.log(`🧹 Prisma deleteMany removed: ${result.count}`);

    // 5. Check Ingredients
    const totalIngs = await prisma.ingredient.count();
    console.log(`📦 Total Ingredients in DB: ${totalIngs}`);

    // 6. Set all ingredients to isDeleted: false if they are in the "active" list (not part of cleanup, but for curiosity)
    const activeIngs = await prisma.ingredient.count({ where: { isDeleted: false } });
    console.log(`✅ Currently active ingredients: ${activeIngs}`);
}

nuke()
    .catch(e => console.error("❌ NUKE FAILED:", e))
    .finally(() => prisma.$disconnect());
