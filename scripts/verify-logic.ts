
import { sanitizeAmountInput } from "../app/lib/recipeUtils";

function assert(actual: string, expected: string, label: string) {
    if (actual === expected) {
        console.log(`[PASS] ${label}: '${actual}'`);
    } else {
        console.error(`[FAIL] ${label}: Expected '${expected}', got '${actual}'`);
        process.exit(1);
    }
}

console.log("Running Input Logic Verification...");

assert(sanitizeAmountInput("05"), "5", "Leading zero removal");
assert(sanitizeAmountInput("0"), "0", "Single zero allowed");
assert(sanitizeAmountInput("0."), "0.", "Zero decimal allowed");
assert(sanitizeAmountInput("0.5"), "0.5", "Decimal value allowed");
assert(sanitizeAmountInput("007"), "7", "Multiple leading zeros");
assert(sanitizeAmountInput("123"), "123", "Normal number");
assert(sanitizeAmountInput("abc"), "", "Non-numeric stripped");
assert(sanitizeAmountInput("10"), "10", "Ten preserved");

console.log("All logic tests passed!");
