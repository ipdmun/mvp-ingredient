
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function cleanup() {
    console.log("🚀 Starting Global Price History Cleanup...");

    // Delete all IngredientPrice records
    const result = await prisma.ingredientPrice.deleteMany({});

    console.log(`✅ Success! Deleted ${result.count} stale price records.`);
    console.log("✨ Now all ingredients in the global list will show 'No Record' (Fresh Start).");
}

cleanup()
    .catch(e => console.error("❌ Cleanup failed:", e))
    .finally(() => prisma.$disconnect());
