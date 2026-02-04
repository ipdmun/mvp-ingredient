const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const total = await prisma.ingredient.count();
        const orphaned = await prisma.ingredient.count({
            where: { userId: null }
        });
        const users = await prisma.user.findMany({
            select: { id: true, email: true }
        });

        console.log("Total Ingredients:", total);
        console.log("Ingredients with NULL userId (Orphaned):", orphaned);
        console.log("Total Users in DB:", users.length);

        if (users.length > 0) {
            for (const user of users) {
                const count = await prisma.ingredient.count({
                    where: { userId: user.id }
                });
                console.log(`User ${user.email} (${user.id}): ${count} ingredients`);
            }
        }

        const sample = await prisma.ingredient.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' }
        });
        console.log("Sample Ingredients (Last 5):", JSON.stringify(sample, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
