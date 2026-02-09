
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testSoftDelete() {
    console.log("Starting Soft Delete Test...");

    // 1. Create a dummy user/ingredient if needed, or just find one to test with?
    // Better to create a temp one to avoid messing with real data.
    // However, creating a user is complex with NextAuth.
    // I'll try to find an existing user.
    let user = await prisma.user.findFirst();
    if (!user) {
        console.log("No user found. Creating dummy user...");
        user = await prisma.user.create({
            data: {
                email: "test_user_softdelete@example.com",
                name: "Test User"
            }
        });
    }
    console.log(`Using user: ${user.id} (${user.email})`);

    // 2. Create a dummy ingredient
    const ingredient = await prisma.ingredient.create({
        data: {
            name: "SoftDeleteTest_" + Date.now(),
            unit: "kg",
            userId: user.id
        }
    });
    console.log(`Created Ingredient: ${ingredient.id} - ${ingredient.name}`);

    // 3. Mark as Deleted (Simulate action)
    console.log("Soft Deleting...");
    await prisma.ingredient.update({
        where: { id: ingredient.id },
        data: { isDeleted: true }
    });

    // 4. Verify it's NOT in the list (mimic getIngredients)
    const list = await prisma.ingredient.findMany({
        where: {
            userId: user.id,
            isDeleted: false
        }
    });

    const foundInList = list.find(i => i.id === ingredient.id);
    if (foundInList) {
        console.error("FAIL: Ingredient still appears in the list!");
    } else {
        console.log("SUCCESS: Ingredient is hidden from list.");
    }

    // 5. Verify it DOES exist in DB
    const dbItem = await prisma.ingredient.findUnique({ where: { id: ingredient.id } });
    if (dbItem && dbItem.isDeleted) {
        console.log("SUCCESS: Ingredient exists in DB with isDeleted=true.");
    } else {
        console.error("FAIL: Ingredient not found in DB or isDeleted is false.");
    }

    // Cleanup
    console.log("Cleaning up...");
    await prisma.ingredient.delete({ where: { id: ingredient.id } }); // Hard delete for cleanup
}

testSoftDelete()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
