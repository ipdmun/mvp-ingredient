
// Mock utils to avoid import issues
function convertPriceForDisplay(price: number, fromUnit: string, toUnit: string): number {
    const from = fromUnit.toLowerCase();
    const to = toUnit.toLowerCase();

    if (from === to) return price;

    if (from === 'g' && to === 'kg') return price * 1000;
    if (from === 'ml' && to === 'l') return price * 1000;

    if (from === 'kg' && to === 'g') return price / 1000;
    if (from === 'l' && to === 'ml') return price / 1000;

    return price;
}

const prices = [
    {
        price: 1.6, // 24000 / 15000
        amount: 15000,
        totalPrice: 24000,
        unit: 'g',
        recordedAt: new Date(),
        source: 'User'
    }
];

const unit = 'kg';

// Logic from IngredientPriceSummary (Fixed)
const calculateAverage = () => {
    // 1. Calculate Total Spend
    const totalSpend = prices.reduce((acc, p) => {
        return acc + (p.totalPrice ?? (p.price * (p.amount ?? 1)));
    }, 0);

    // 2. Calculate Total Amount
    const totalAmount = prices.reduce((acc, p) => {
        return acc + (p.amount ?? 1);
    }, 0);

    if (totalAmount === 0) return 0;

    // 3. Calculate Raw Average (per base unit)
    // FIX: Do NOT round here. 1.6 should remain 1.6
    const rawAverage = totalSpend / totalAmount;

    const sourceUnit = prices[0]?.unit || 'g';

    // 4. Convert to Display Unit
    return convertPriceForDisplay(rawAverage, sourceUnit, unit);
};

// Logic from IngredientPriceSummary (Old/Buggy)
const calculateAverageBuggy = () => {
    const totalSpend = prices.reduce((acc, p) => {
        return acc + (p.totalPrice ?? (p.price * (p.amount ?? 1)));
    }, 0);

    const totalAmount = prices.reduce((acc, p) => {
        return acc + (p.amount ?? 1);
    }, 0);

    if (totalAmount === 0) return 0;

    // BUG: Rounding here (1.6 becomes 2)
    const rawAverage = Math.round(totalSpend / totalAmount);

    const sourceUnit = prices[0]?.unit || 'g';
    return convertPriceForDisplay(rawAverage, sourceUnit, unit);
};

console.log("--- Verification ---");
console.log(`Input: 15kg (15000g) for 24,000 won`);
console.log(`Raw Unit Price: 1.6 won/g`);
console.log(`Target Display Unit: kg`);
console.log(`Expected Display Price: 1,600 won/kg`);
console.log(`-----------------------------------`);

const fixedResult = calculateAverage();
const buggyResult = calculateAverageBuggy();

console.log(`Fixed Logic Result (Raw): ${fixedResult}`);
console.log(`Fixed Logic Result (Rounded for Display): ${Math.round(fixedResult)}`);

console.log(`Buggy Logic Result (Raw): ${buggyResult}`);
console.log(`Buggy Logic Result (Rounded for Display): ${Math.round(buggyResult)}`);

if (Math.round(fixedResult) === 1600 && Math.round(buggyResult) === 2000) {
    console.log("✅ Verification Successful: Fix behavior confirmed.");
} else {
    console.error("❌ Verification Failed!");
}
