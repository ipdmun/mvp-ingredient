
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { createRecipe, deleteRecipe, applyPresetToRecipe } from '@/app/recipes/actions';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Please login first" }, { status: 401 });
        }

        // Test Log
        const logs: string[] = [];
        const log = (msg: string) => logs.push(`[${new Date().toISOString().split('T')[1].split('.')[0]}] ${msg}`);

        log("Starting Recipe Action Verification...");

        // 1. Create Recipe
        log("1. Creating Test Recipe '삭제테스트용'...");
        const createRes = await createRecipe({ name: "삭제테스트용", description: "This is a test", servings: 1 });
        if (!createRes.success || !createRes.recipe) {
            return NextResponse.json({ error: "Failed to create recipe", details: createRes.error, logs });
        }
        const recipeId = createRes.recipe.id;
        log(`   -> Created Recipe ID: ${recipeId}`);

        // 2. Load Preset (Original)
        log("2. Loading Preset '된장찌개'...");
        // Hack: update name to match preset key for test
        await prisma.recipe.update({ where: { id: recipeId }, data: { name: "된장찌개 테스트" } });

        const presetRes1 = await applyPresetToRecipe(recipeId);
        if (!presetRes1.success) {
            log(`   -> Preset Load Failed: ${presetRes1.error}`);
        } else {
            log("   -> Preset Load Success");
        }

        // 3. Count Ingredients
        const count1 = await prisma.recipeIngredient.count({ where: { recipeId } });
        log(`   -> Ingredient Count after 1st load: ${count1}`);

        // 4. Load Preset Again (Should not duplicate)
        log("4. Loading Preset AGAIN (Duplicate Check)...");
        const presetRes2 = await applyPresetToRecipe(recipeId);
        if (!presetRes2.success && presetRes2.message !== "일치하는 추천 레시피가 없습니다.") {
            log(`   -> Preset 2nd Load returned error (might be expected?): ${presetRes2.error || presetRes2.message}`);
        } else {
            log("   -> Preset 2nd Load Success (or silently skipped)");
        }

        const count2 = await prisma.recipeIngredient.count({ where: { recipeId } });
        log(`   -> Ingredient Count after 2nd load: ${count2}`);

        if (count1 === count2) {
            log("   SUCCESS: Ingredient count did not increase!");
        } else {
            log("   FAILURE: Ingredient count INCREASED!");
        }

        // 5. Delete Recipe
        log("5. Deleting Recipe...");
        const deleteRes = await deleteRecipe(recipeId);
        if (deleteRes.success) {
            // Verify references are gone
            const refCount = await prisma.recipeIngredient.count({ where: { recipeId } });
            const recipeExists = await prisma.recipe.findUnique({ where: { id: recipeId } });

            if (refCount === 0 && !recipeExists) {
                log("   SUCCESS: Recipe and ingredients fully deleted.");
            } else {
                log(`   FAILURE: Recipe deleted? ${!recipeExists}, Leftover Ingredients: ${refCount}`);
            }
        } else {
            log(`   FAILURE: Delete action returned false. ${deleteRes.error}`);
        }

        return NextResponse.json({
            result: "Verification Complete",
            logs
        });

    } catch (e: any) {
        return NextResponse.json({ error: "Script Error", message: e.message, stack: e.stack }, { status: 500 });
    }
}
