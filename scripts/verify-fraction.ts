export { };

function toFractionString(val: number): string | number {
    if (val >= 0.9 && val <= 1.1) return "1";
    if (val >= 0.4 && val <= 0.6) return "1/2";
    if (val >= 0.2 && val <= 0.3) return "1/4";
    if (val >= 0.31 && val <= 0.35) return "1/3";
    if (val >= 0.18 && val <= 0.22) return "1/5";

    // Spoons specific - integers
    if (val >= 1.8 && val <= 2.2) return "2";
    if (val >= 2.8 && val <= 3.2) return "3";

    if (Number.isInteger(val)) return val;
    if (val > 1) return Number(val.toFixed(1));
    return Number(val.toFixed(2));
}

function formatRecipeDisplay(name: string, amount: number, unit: string): { amount: string | number, unit: string } {
    let displayAmount: number | string = amount;
    let displayUnit = unit.toLowerCase();

    // 1. Tofu (두부)
    if (name.includes("두부")) {
        if (displayUnit === 'g') {
            const blocks = amount / 350;
            return { amount: toFractionString(blocks), unit: "모" };
        }
        else if (displayUnit === '개' || displayUnit === 'piece' || displayUnit === 'ea' || displayUnit === '모') {
            return { amount: toFractionString(amount), unit: "모" };
        }
    }
    // ... Simplified other cases for verification
    if (name.includes("대파")) {
        if (displayUnit === '개' || displayUnit === 'piece') {
            return { amount: toFractionString(amount), unit: "개" };
        }
    }

    return { amount: displayAmount, unit: displayUnit };
}

async function verify() {
    console.log("Verifying Fraction Display...");
    let failed = false;

    // Case 1: Tofu 0.429 'mo' (Should be "1/2 모")
    const tofuDisp = formatRecipeDisplay("두부", 0.429, "모");
    console.log(`Tofu 0.429 모 -> ${tofuDisp.amount} ${tofuDisp.unit}`);

    if (tofuDisp.amount === "1/2") {
        console.log("PASS: Tofu fraction correct.");
    } else {
        console.log("FAIL: Tofu fraction incorrect (Expected 1/2).");
        failed = true;
    }

    // Case 2: Green Onion 0.25 'gae' (Should be "1/4 개")
    const onionDisp = formatRecipeDisplay("대파", 0.25, "개");
    console.log(`Green Onion 0.25 개 -> ${onionDisp.amount} ${onionDisp.unit}`);

    if (onionDisp.amount === "1/4") {
        console.log("PASS: Onion fraction correct.");
    } else {
        console.log("FAIL: Onion fraction incorrect (Expected 1/4).");
        failed = true;
    }

    // Case 3: 0.33 (1/3)
    const thirdDisp = formatRecipeDisplay("대파", 0.33, "개");
    console.log(`Green Onion 0.33 개 -> ${thirdDisp.amount} ${thirdDisp.unit}`);
    if (thirdDisp.amount === "1/3") {
        console.log("PASS: Onion 1/3 correct.");
    } else {
        console.log("FAIL: Onion 1/3 incorrect.");
        failed = true;
    }

    if (failed) process.exit(1);
}

verify();
