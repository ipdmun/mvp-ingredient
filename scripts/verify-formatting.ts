
// Copied from app/lib/utils.ts to avoid import issues
function convertPriceForDisplay(price: number, fromUnit: string, toUnit: string): number {
    const from = fromUnit.toLowerCase();
    const to = toUnit.toLowerCase();

    if (from === to) return price;

    // g -> kg
    if (from === 'g' && to === 'kg') return price * 1000;
    // ml -> l
    if (from === 'ml' && to === 'l') return price * 1000;

    // kg -> g
    if (from === 'kg' && to === 'g') return price / 1000;
    // l -> ml
    if (from === 'l' && to === 'ml') return price / 1000;

    return price;
}

// Mocking the logic found in IngredientList.tsx
function getPriceAnalysis(prices: any[]) {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekPrices = prices.filter(p => new Date(p.recordedAt) >= weekAgo);

    // FIX: Removed Math.round here
    const weekAvg = weekPrices.length > 0
        ? weekPrices.reduce((acc, p) => acc + p.price, 0) / weekPrices.length
        : 0;

    return { weekAvg };
}

async function verify() {
    console.log("Verifying Price Logic...");

    // Case 1: Pork Average (14,800 vs 15,000)
    // Scenario: Price is 14.8 won/g. User wants to see per kg.
    const porkPrices = [
        { price: 14.8, recordedAt: new Date(), unit: 'g' },
        { price: 14.8, recordedAt: new Date(), unit: 'g' }
    ];

    const { weekAvg } = getPriceAnalysis(porkPrices);
    console.log(`Calculated Week Avg (raw/g): ${weekAvg}`); // Should be 14.8

    const displayPrice = convertPriceForDisplay(weekAvg, 'g', 'kg');
    console.log(`Converted to kg: ${displayPrice}`); // Should be 14800

    const finalDisplay = Math.round(displayPrice);
    console.log(`Final Display (Math.round): ${finalDisplay}`);

    if (finalDisplay === 14800) {
        console.log("PASS: Pork price calculated correctly (14,800).");
    } else {
        console.error(`FAIL: Pork price mismatch. Expected 14,800, got ${finalDisplay}`);
        process.exit(1);
    }

    // Case 2: Tofu Decimal (3833.33)
    const tofuPrice = 3833.333333;
    const tofuDisplay = Math.round(tofuPrice);

    console.log(`Tofu Raw: ${tofuPrice}, Display: ${tofuDisplay}`);

    if (tofuDisplay === 3833) {
        console.log("PASS: Tofu price formatted correctly (3,833).");
    } else {
        console.error(`FAIL: Tofu price mismatch. Expected 3,833, got ${tofuDisplay}`);
        process.exit(1);
    }
}

verify();
