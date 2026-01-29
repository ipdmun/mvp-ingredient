
import { prisma } from "./app/lib/prisma";

async function main() {
    try {
        const count = await prisma.ingredient.count();
        console.log("Successfully connected. Ingredient count:", count);
    } catch (e) {
        console.error("Connection failed:", e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
