
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
    console.log('Starting verification...');

    // 1. Create a dummy user (or find existing one, but for safety create new if possible, but let's just use existing one if we can find one to avoid complex setup, actually let's just create a dummy ingredient for a known user if possible, or just create one without user since user is optional in schema? No, user is optional in Ingredient: `user User? @relation...`)
    // Oh wait, `userId` is optional on `Ingredient`.

    try {
        const ingredient = await prisma.ingredient.create({
            data: {
                name: 'Test Pork',
                unit: 'kg',
            }
        });
        console.log('Created test ingredient:', ingredient.id);

        // 2. Add Price: 14,800 won for 1kg (1000g)
        // Normalized calculation: 14,800 / 1000 = 14.8 won/g
        const priceValue = 14.8;

        const priceRecord = await prisma.ingredientPrice.create({
            data: {
                ingredientId: ingredient.id,
                price: priceValue, // This should be stored as 14.8
                totalPrice: 14800,
                amount: 1000,
                unit: 'g',
                source: 'Test Script'
            }
        });

        console.log('Created price record:', priceRecord);

        if (priceRecord.price === 14.8) {
            console.log('SUCCESS: Price stored correctly as float (14.8)');
        } else {
            console.error(`FAILURE: Price stored incorrectly. Expected 14.8, got ${priceRecord.price}`);
        }

        // Clean up
        await prisma.ingredientPrice.delete({ where: { id: priceRecord.id } });
        await prisma.ingredient.delete({ where: { id: ingredient.id } });
        console.log('Cleaned up test data');

    } catch (e) {
        console.error('Verification failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

verify();
