
const UNIT_STANDARDS: Record<string, number> = {
    "두부": 350,
    "순두부": 350,
    "연두부": 250,
    "양파": 200,
    "대파": 80,
    "마늘": 5, "다진마늘": 15, "간마늘": 15,
    "고추": 15, "청양고추": 10, "홍고추": 15,
    "간장": 15, "고추장": 15, "된장": 15, "쌈장": 15,
    "고춧가루": 10, "설탕": 12, "소금": 12, "참기름": 12
};

function convertIngredientAmount(
    targetName: string,
    targetAmount: number,
    targetUnit: string,
    userUnit: string
): number {
    let finalAmount = targetAmount;
    const u1 = targetUnit.toLowerCase().trim();
    const u2 = userUnit.toLowerCase().trim();

    if (u1 === u2) return finalAmount;

    if (u1 === 'g' && u2 === 'kg') finalAmount = targetAmount / 1000;
    else if (u1 === 'kg' && u2 === 'g') finalAmount = targetAmount * 1000;
    else if (u1 === 'ml' && u2 === 'l') finalAmount = targetAmount / 1000;
    else if (u1 === 'l' && u2 === 'ml') finalAmount = targetAmount * 1000;

    else if (u1 === 'g' || u1 === 'ml') {
        const stdWeight = Object.entries(UNIT_STANDARDS).find(([key, val]) => targetName.includes(key))?.[1];
        if (stdWeight) {
            const isPieceUnit = /개|모|봉|단|block|piece|ea/i.test(u2);
            const isSpoonUnit = /큰술|T|tbsp|spoon/i.test(u2);

            if (isPieceUnit) {
                finalAmount = targetAmount / stdWeight;
            } else if (isSpoonUnit) {
                if (stdWeight <= 20) {
                    finalAmount = targetAmount / stdWeight;
                } else {
                    finalAmount = targetAmount / 15;
                }
            }
        }
    }
    return Number(finalAmount.toFixed(3));
}

function formatRecipeDisplay(name: string, amount: number, unit: string): { amount: string | number, unit: string } {
    let displayAmount: number | string = amount;
    let displayUnit = unit.toLowerCase();

    if (name.includes("두부")) {
        if (displayUnit === 'g') {
            const blocks = amount / 350;
            if (blocks >= 0.9 && blocks <= 1.1) return { amount: "1", unit: "모" };
            if (blocks >= 0.4 && blocks <= 0.6) return { amount: "1/2", unit: "모" };
            if (blocks >= 0.2 && blocks <= 0.3) return { amount: "1/4", unit: "모" };
            if (blocks > 1) return { amount: Number(blocks.toFixed(1)), unit: "모" };
        }
        else if (displayUnit === '개' || displayUnit === 'piece' || displayUnit === 'ea') {
            return { amount: amount, unit: "모" };
        }
    }

    const spoonItems = ["간장", "고추장", "된장", "쌈장", "고춧가루", "설탕", "다진마늘", "간마늘", "참기름", "들기름", "식초", "맛술", "미림", "액젓", "굴소스", "물엿", "올리고당"];
    if (spoonItems.some(item => name.includes(item))) {
        if (displayUnit === 'g' || displayUnit === 'ml') {
            const stdWeight = UNIT_STANDARDS[Object.keys(UNIT_STANDARDS).find(k => name.includes(k)) || ""] || 15;
            const spoons = amount / stdWeight;
            if (spoons >= 0.9 && spoons <= 1.1) return { amount: "1", unit: "큰술" };
            if (spoons >= 0.4 && spoons <= 0.6) return { amount: "1/2", unit: "큰술" };
            if (spoons >= 0.2 && spoons <= 0.3) return { amount: "1/4", unit: "큰술" };
            if (spoons >= 1.8 && spoons <= 2.2) return { amount: "2", unit: "큰술" };
            if (spoons >= 2.8 && spoons <= 3.2) return { amount: "3", unit: "큰술" };
            if (Number.isInteger(spoons)) return { amount: spoons, unit: "큰술" };
            if (spoons > 0.5) return { amount: Number(spoons.toFixed(1)), unit: "큰술" };
        }
    }

    const pieceItems = ["양파", "오이", "애호박", "호박", "당근", "감자", "고구마"];
    if (pieceItems.some(item => name.includes(item))) {
        if (displayUnit === 'g') {
            const stdWeight = UNIT_STANDARDS[Object.keys(UNIT_STANDARDS).find(k => name.includes(k)) || ""] || 100;
            const pieces = amount / stdWeight;
            if (pieces >= 0.9 && pieces <= 1.1) return { amount: "1", unit: "개" };
            if (pieces >= 0.4 && pieces <= 0.6) return { amount: "1/2", unit: "개" };
            if (pieces > 0.5) return { amount: Number(pieces.toFixed(1)), unit: "개" };
        }
    }

    if (displayUnit === 'kg') {
        if (amount < 1) {
            return { amount: amount * 1000, unit: "g" };
        }
    }

    if (typeof displayAmount === 'number' && !Number.isInteger(displayAmount)) {
        displayAmount = Number(displayAmount.toFixed(1));
    }

    return { amount: displayAmount, unit: displayUnit };
}

// Verification Tests
let failed = false;

// 1. Tofu Convert
const tofuConv = convertIngredientAmount("두부", 150, "g", "모"); // 150 / 350 = 0.428
console.log(`Tofu 150g -> ? 모: ${tofuConv}`);
if (tofuConv > 0.4 && tofuConv < 0.5) {
    console.log("PASS: Tofu conversion correct.");
} else {
    console.error(`FAIL: Tofu conversion ${tofuConv}`);
    failed = true;
}

// 2. Tofu Display
const tofuDisp = formatRecipeDisplay("두부", 175, "g"); // 0.5 block
console.log(`Tofu 175g Display: ${tofuDisp.amount} ${tofuDisp.unit}`);
if (tofuDisp.amount === "1/2" && tofuDisp.unit === "모") {
    console.log("PASS: Tofu display correct.");
} else {
    console.error("FAIL: Tofu display incorrect.");
    failed = true;
}

// 3. Soy Sauce Display
const soyDisp = formatRecipeDisplay("진간장", 30, "g"); // 2 tbsp
console.log(`Soy Sauce 30g Display: ${soyDisp.amount} ${soyDisp.unit}`);
if (soyDisp.amount === "2" && soyDisp.unit === "큰술") {
    console.log("PASS: Soy Sauce display correct.");
} else {
    console.error("FAIL: Soy Sauce display incorrect.");
    failed = true;
}

if (failed) process.exit(1);
console.log("ALL TESTS PASSED");
