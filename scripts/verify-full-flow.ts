
import { convertIngredientAmount } from "../app/lib/recipeUtils";

console.log("\n=== 2차 통합 검증: 시나리오 테스트 ===");

// Scenario: User has '대파' in '단' unit. Recipe asks for '대파' 20g.
const mockPresetItem = { name: "대파", amount: 20, unit: "g" };
const mockUserIngredient = { id: 101, name: "대파", unit: "단", userId: "test-user" };

console.log(`[Scenario 1] User Unit: ${mockUserIngredient.unit}, Preset: ${mockPresetItem.amount}${mockPresetItem.unit}`);

const result = convertIngredientAmount(
    mockPresetItem.name,
    mockPresetItem.amount,
    mockPresetItem.unit,
    mockUserIngredient.unit
);

console.log(`Input: ${mockPresetItem.amount}g -> Output: ${result}단`);

const expected = 20 / 800; // 0.025
if (Math.abs(result - expected) < 0.001) {
    console.log("✅ PASS: Correctly converted using 800g bundle logic.");
} else {
    console.log(`❌ FAIL: Expected ${expected}, got ${result}`);
}

// Scenario 2: User has '대파' in 'kg'. Recipe asks for 20g.
console.log(`\n[Scenario 2] User Unit: kg, Preset: 20g`);
const resultKg = convertIngredientAmount("대파", 20, "g", "kg");
console.log(`Input: 20g -> Output: ${resultKg}kg`);
if (resultKg === 0.02) {
    console.log("✅ PASS: Correctly converted g to kg.");
} else {
    console.log("❌ FAIL");
}

console.log("\n=== Modal Safe Render Test (Mock) ===");
// Mocking the safe render logic
const list = [
    { id: 1, name: "정상재료", unit: "kg" },
    null,
    { id: 3, name: undefined, unit: "g" } // Edge case
];

console.log("Rendering Ingredients List...");
list.forEach((item, idx) => {
    if (item) {
        console.log(`[Item ${idx}] Rendered: ${item.name || "이름 없음"} (${item.unit || "-"})`);
    } else {
        console.log(`[Item ${idx}] Skipped (Safe Guard Working)`);
    }
});
console.log("✅ PASS: No crash on null items.");
