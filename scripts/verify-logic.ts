import { convertIngredientAmount } from "../app/lib/recipeUtils";

console.log("=== Unit Conversion Verification Script ===");

const testCases = [
    { name: "대파", amount: 20, unit: "g", userUnit: "단", expected: 20 / 800 },
    { name: "대파", amount: 20, unit: "g", userUnit: "kg", expected: 0.02 },
    { name: "돼지고기", amount: 100, unit: "g", userUnit: "kg", expected: 0.1 },
    { name: "무", amount: 50, unit: "g", userUnit: "개", expected: 50 }, // No logic for '개' yet, should return same
    { name: "알수없는재료", amount: 100, unit: "g", userUnit: "봉", expected: 100 / 800 }
];

testCases.forEach((tc, idx) => {
    console.log(`\nTest Case #${idx + 1}: ${tc.name} (${tc.amount}${tc.unit}) -> User(${tc.userUnit})`);
    const result = convertIngredientAmount(tc.name, tc.amount, tc.unit, tc.userUnit);
    const passed = Math.abs(result - tc.expected) < 0.001 || (tc.userUnit === "개" && result === tc.amount); // loose equality for float

    console.log(`Expected: ${tc.expected.toFixed(4)}, Got: ${result.toFixed(4)}`);
    if (passed) console.log("✅ PASS");
    else console.log("❌ FAIL");
});

console.log("\n=== End Verification ===");
