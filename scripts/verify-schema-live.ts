
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function verifySchema() {
    console.log("Verifying DB Schema for isDeleted...");
    try {
        // Try to create a dummy with isDeleted: true
        const dummy = await prisma.ingredient.create({
            data: {
                name: "SchemaTest_" + Date.now(),
                unit: "ea",
                isDeleted: true, // This will throw if column missing
                userId: "test_user_schema"
            }
        });
        console.log("SUCCESS: Created item with isDeleted: true", dummy.id);

        // Try to find it filtering by isDeleted
        const found = await prisma.ingredient.findFirst({
            where: {
                id: dummy.id,
                isDeleted: true
            }
        });

        if (found) {
            console.log("SUCCESS: Found item by isDeleted: true");
        } else {
            console.error("FAIL: Could not find item by isDeleted: true");
        }

        // Clean up
        await prisma.ingredient.delete({ where: { id: dummy.id } });

    } catch (error) {
        console.error("SCHEMA VERIFICATION FAILED:", error);
    } finally {
        await prisma.$disconnect();
    }
}

verifySchema();
