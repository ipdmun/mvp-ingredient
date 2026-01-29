
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function main() {
    try {
        console.log("Connecting...");
        await prisma.$connect();
        console.log("Connected.");
        const count = await prisma.ingredient.count();
        console.log("Ingredient count:", count);
    } catch (e) {
        console.error("Connection failed:", e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
