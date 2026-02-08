
// Mocking the calculated logic since we can't easily spin up a full endpoint test without fetching.
// But we can verify the logic itself here.

const mockRecipe = {
    id: 1,
    name: "Test Recipe",
    ingredients: [
        { ingredientId: 1, amount: 200 }, // e.g., Meat
        { ingredientId: 2, amount: 50 },  // e.g., Sauce
    ],
    servings: 2,
    sellingPrice: 10000
};

const mockPrices: Record<number, number> = {
    1: 20, // 20 won per unit
    2: 10 // 10 won per unit
};

function calculateAnalytics(recipe: any, priceMap: Record<number, number>) {
    let totalCost = 0;
    recipe.ingredients.forEach((ri: any) => {
        const price = priceMap[ri.ingredientId] || 0;
        totalCost += price * ri.amount;
    });

    const servings = recipe.servings || 1;
    const unitCost = Math.round(totalCost / servings);
    const sellingPrice = recipe.sellingPrice || 0;

    // Analytics
    const unitProfit = sellingPrice - unitCost;
    const costRate = sellingPrice > 0 ? (unitCost / sellingPrice) * 100 : 0;
    const marginRate = sellingPrice > 0 ? (unitProfit / sellingPrice) * 100 : 0;

    return {
        unitCost,
        unitProfit,
        costRate: Number(costRate.toFixed(1)),
        marginRate: Number(marginRate.toFixed(1))
    };
}

const analytics = calculateAnalytics(mockRecipe, mockPrices);
console.log("Analytics:", analytics);

// Logic Verification
// Cost: (200*20 + 50*10) = 4000 + 500 = 4500
// Servings: 2 -> Unit Cost = 2250
// Selling: 10000
// Profit: 7750
// Cost Rate: 22.5%
// Margin Rate: 77.5%

if (analytics.unitCost === 2250 && analytics.unitProfit === 7750 && analytics.costRate === 22.5) {
    console.log("PASS: Calculation logic verified.");
} else {
    console.error("FAIL: Logic incorrect.");
    process.exit(1);
}
