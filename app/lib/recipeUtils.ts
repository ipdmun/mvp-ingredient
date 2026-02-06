export interface IngredientItem {
    name: string;
    amount: number;
    unit: string;
}

export function convertIngredientAmount(
    targetName: string,
    targetAmount: number,
    targetUnit: string,
    userUnit: string
): number {
    let finalAmount = targetAmount;
    const u1 = targetUnit.toLowerCase().trim();
    const u2 = userUnit.toLowerCase().trim();

    if (u1 === u2) return finalAmount;

    console.log(`[UnitConversion] Converting ${targetName}: ${targetAmount}${u1} -> ?${u2}`);

    // Standard metric conversions
    if (u1 === 'g' && u2 === 'kg') {
        finalAmount = targetAmount / 1000;
    } else if (u1 === 'kg' && u2 === 'g') {
        finalAmount = targetAmount * 1000;
    }
    else if (u1 === 'ml' && u2 === 'l') {
        finalAmount = targetAmount / 1000;
    } else if (u1 === 'l' && u2 === 'ml') {
        finalAmount = targetAmount * 1000;
    }

    // Bundle conversions (approximate)
    // Case 1: Recipe asks for 'g', User has 'bundle' (단, 봉 etc)
    else if (u1 === 'g') {
        const isBundle = /단|bundle|pkt|bunch|봉/i.test(u2);
        const isDaepa = targetName.includes("대파") || targetName.includes("파");

        if (isBundle) {
            // Assume 1 bundle is roughly 800g for vegetables like Green Onion
            // But this varies wildly. We'll use 800g as a standard "market bundle"
            console.log(`   -> Bundle detection: User has '${u2}', Recipe needs '${u1}'. Using divisor 800.`);
            finalAmount = targetAmount / 800;
        } else if (isDaepa && u2 !== 'g' && u2 !== 'kg' && u2 !== 'ml' && u2 !== 'l') {
            // If it's Daepa and user unit is something weird (likely a piece or bundle unit not caught by regex)
            console.log(`   -> Daepa fallback: User unit '${u2}' treated as ~800g bundle.`);
            finalAmount = targetAmount / 800;
        }
    }
    // Case 2: Recipe asks for 'kg', User has 'bundle'
    else if (u1 === 'kg') {
        const isBundle = /단|bundle|pkt|bunch|봉/i.test(u2);
        if (isBundle) {
            // 1 bundle = 0.8kg
            finalAmount = targetAmount / 0.8;
        }
    }

    // Round to 3 decimal places to avoid floating point weirdness
    return Number(finalAmount.toFixed(3));
}
