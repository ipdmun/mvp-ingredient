export interface IngredientItem {
    name: string;
    amount: number;
    unit: string;
}

const UNIT_STANDARDS: Record<string, number> = {
    // Tofu (1 block = 350g approx)
    "두부": 350,
    "순두부": 350,
    "연두부": 250,
    // Veggies (1 piece approx weight in g)
    "양파": 200, // Medium onion. 10g -> 1/20
    "대파": 80, // 1 stalk
    "쪽파": 10,
    "마늘": 5, // 1 clove
    "다진마늘": 15, // 1 tbsp
    "간마늘": 15,
    "고추": 15,
    "청양고추": 10,
    "홍고추": 15,
    "피망": 100,
    "파프리카": 150,
    "오이": 200,
    "호박": 250,
    "애호박": 275,
    "당근": 200, // Medium carrot. 10g -> 1/20 (changed from 150 to avoid 1/15)
    "감자": 150,
    "고구마": 200,
    "무": 1000, // 1 whole radish is heavy
    "배추": 2000, // 1 whole cabbage
    "알배기": 500,
    "양배추": 1500,
    // Seasonings (1 tbsp = 15g/ml approx)
    "간장": 15,
    "고추장": 15,
    "된장": 15,
    "쌈장": 15,
    "고춧가루": 10, // lighter than liquid
    "설탕": 12,
    "소금": 12,
    "참기름": 12,
    "들기름": 12,
    "식용유": 12,
    "올리브유": 12,
    "식초": 15,
    "맛술": 15,
    "미림": 15,
    "액젓": 15,
    "굴소스": 18,
    "물엿": 20,
    "올리고당": 20,
    "후추": 1, // pinch
    "깨": 1,
    "통깨": 1,
};

/**
 * Returns standard weight/amount for a given ingredient name.
 */
export function getStandardWeight(name: string): { weight: number; unit: string } | null {
    const key = Object.keys(UNIT_STANDARDS).find(k => name.includes(k));
    if (!key) return null;

    // Default to 'g' for these standards
    return { weight: UNIT_STANDARDS[key], unit: 'g' };
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

    // Smart Conversions (g -> piece/unit)
    else if (u1 === 'g' || u1 === 'ml') {
        // Find standard weight for this ingredient
        const stdWeight = Object.entries(UNIT_STANDARDS).find(([key, val]) => targetName.includes(key))?.[1];

        if (stdWeight) {
            // Case: Tofu 350g -> 1 piece (user has '개' or '모')
            const isPieceUnit = /개|모|봉|단|block|piece|ea/i.test(u2);
            const isSpoonUnit = /큰술|T|tbsp|spoon/i.test(u2);

            if (isPieceUnit) {
                finalAmount = targetAmount / stdWeight;
                console.log(`   -> Smart Convert: ${targetName} (${u1}->${u2}) using std weight ${stdWeight}g. Result: ${finalAmount}`);
            } else if (isSpoonUnit) {
                // 1 tbsp approx 15g/ml usually, but use specific if available
                finalAmount = targetAmount / (stdWeight > 50 ? 15 : stdWeight); // if stdWeight is 'piece' weight (big), fallback to 15g. Else use specific (e.g. garlic 15g)
                // Actually, for seasonings, stdWeight IS the tbsp weight mostly.
                // For veggies, we shouldn't convert to spoon usually.
                if (stdWeight <= 20) {
                    finalAmount = targetAmount / stdWeight;
                } else {
                    finalAmount = targetAmount / 15; // default spoon
                }
            }
        }
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

/**
 * Helper to convert decimal amount to friendly fraction string if applicable.
 */
function toFractionString(val: number): string | number {
    const eps = 0.03; // Stricter tolerance (3%) to avoid false positives on mid-points

    if (val <= 0) return 0;

    // 1. Exact Integers
    if (Math.abs(val - Math.round(val)) < eps) return Math.round(val);

    // 2. Common Cooking Fractions
    const fractions = [
        { n: 2, v: 1 / 2 },
        { n: 3, v: 1 / 3 }, { n: 3, v: 2 / 3 },
        { n: 4, v: 1 / 4 }, { n: 4, v: 3 / 4 },
        { n: 5, v: 1 / 5 }, { n: 5, v: 2 / 5 }, { n: 5, v: 3 / 5 }, { n: 5, v: 4 / 5 },
        { n: 8, v: 1 / 8 }, { n: 8, v: 3 / 8 }, { n: 8, v: 5 / 8 }, { n: 8, v: 7 / 8 },
        { n: 10, v: 1 / 10 }, // 0.1
        { n: 15, v: 1 / 15 }, // ~0.067 (1g/15g)
        { n: 2, v: 1.5 },   // 1.5 is common
    ];

    for (const f of fractions) {
        // v for value, n for denominator (just for comment, we use v to compare)
        if (Math.abs(val - f.v) < eps) {
            // Special case for improper fractions if needed, but here we just return string
            if (f.v === 1.5) return 1.5; // Keep 1.5 as decimal? Or "1 1/2"? User asked for < 1 handling.
            // Construct string
            // Find numerator? We hardcoded value.
            // Let's store string in array.
            return f.v >= 1 ? Number(f.v.toFixed(1)) : formatFraction(f.v);
        }
    }

    // Helper to format known values
    function formatFraction(v: number): string {
        if (Math.abs(v - 1 / 2) < eps) return "1/2";
        if (Math.abs(v - 1 / 3) < eps) return "1/3";
        if (Math.abs(v - 2 / 3) < eps) return "2/3";
        if (Math.abs(v - 1 / 4) < eps) return "1/4";
        if (Math.abs(v - 3 / 4) < eps) return "3/4";
        if (Math.abs(v - 1 / 5) < eps) return "1/5";
        if (Math.abs(v - 2 / 5) < eps) return "2/5";
        if (Math.abs(v - 3 / 5) < eps) return "3/5";
        if (Math.abs(v - 4 / 5) < eps) return "4/5";
        if (Math.abs(v - 1 / 8) < eps) return "1/8";
        if (Math.abs(v - 3 / 8) < eps) return "3/8";
        if (Math.abs(v - 5 / 8) < eps) return "5/8";
        if (Math.abs(v - 7 / 8) < eps) return "7/8";
        if (Math.abs(v - 1 / 10) < eps) return "1/10";
        if (Math.abs(v - 1 / 15) < eps) return "1/15";
        return String(v);
    }

    // 3. Generic 1/n Fallback for small numbers < 0.5
    if (val < 0.5) {
        const n = Math.round(1 / val);
        if (n <= 30 && Math.abs(val - (1 / n)) < 0.01) { // Higher precision check for 1/n match
            return `1/${n}`;
        }
    }

    // Default
    if (val > 1) return Number(val.toFixed(1));
    return Number(val.toFixed(2));
}

/**
 * Formats a recipe ingredient amount for friendly display.
 * e.g. "0.5 모" instead of "175 g" for Tofu.
 */
export function formatRecipeDisplay(name: string, amount: number, unit: string): { amount: string | number, unit: string } {
    let displayAmount: number | string = amount;
    let displayUnit = unit.toLowerCase();

    // 1. Tofu (두부)
    if (name.includes("두부")) {
        // If unit is 'g', convert to '모' (block)
        if (displayUnit === 'g') {
            const blocks = amount / 350;
            return { amount: toFractionString(blocks), unit: "모" };
        }
        // If unit is 'piece'/'개', show as '모' with fraction logic
        else if (displayUnit === '개' || displayUnit === 'piece' || displayUnit === 'ea' || displayUnit === '모') {
            return { amount: toFractionString(amount), unit: "모" };
        }
    }

    // 2. Seasonings to Spoon (큰술)
    const spoonItems = ["간장", "고추장", "된장", "쌈장", "고춧가루", "설탕", "다진마늘", "간마늘", "참기름", "들기름", "식초", "맛술", "미림", "액젓", "굴소스", "물엿", "올리고당"];
    if (spoonItems.some(item => name.includes(item))) {
        if (displayUnit === 'g' || displayUnit === 'ml') {
            const stdWeight = UNIT_STANDARDS[Object.keys(UNIT_STANDARDS).find(k => name.includes(k)) || ""] || 15;
            const spoons = amount / stdWeight;
            return { amount: toFractionString(spoons), unit: "큰술" };
        }
        else if (displayUnit === '큰술' || displayUnit === 't' || displayUnit === 'tbsp') {
            return { amount: toFractionString(amount), unit: "큰술" };
        }
    }

    // 3. Veggies to Pieces (개)
    const pieceItems = ["양파", "오이", "애호박", "호박", "당근", "감자", "고구마", "대파", "쪽파", "청양고추", "홍고추", "고추", "피망", "파프리카", "무", "배추", "알배기", "양배추"];
    if (pieceItems.some(item => name.includes(item))) {
        if (displayUnit === 'g') {
            const stdWeight = UNIT_STANDARDS[Object.keys(UNIT_STANDARDS).find(k => name.includes(k)) || ""] || 100;
            const pieces = amount / stdWeight;
            return { amount: toFractionString(pieces), unit: "개" };
        }
        else if (displayUnit === '개' || displayUnit === 'piece' || displayUnit === 'ea') {
            return { amount: toFractionString(amount), unit: "개" };
        }
    }

    // 4. Default: Prefer 'g' over 'kg' for small amounts
    if (displayUnit === 'kg') {
        if (amount < 1) {
            return { amount: amount * 1000, unit: "g" }; // 0.1kg -> 100g
        }
    }

    // Cleanup decimals for default case
    if (typeof displayAmount === 'number' && !Number.isInteger(displayAmount)) {
        displayAmount = Number(displayAmount.toFixed(1));
    }

    return { amount: displayAmount, unit: displayUnit };
}

export function sanitizeAmountInput(val: string): string {
    // Remove non-numeric chars except dot
    let cleanVal = val.replace(/[^0-9.]/g, '');

    // Prevent multiple dots
    if ((cleanVal.match(/\./g) || []).length > 1) return val; // invalid, stick to old or just ignore input? Better to strip extra dots or ignoring current char. 
    // Simplified: Just take the previous valid value if complex invalid (but here we are transforming current string)
    // Actually, simple robust regex for "starting with 0 but not 0."

    // Re-check regex for multiple dots?
    // Let's stick to the verified logic in previous component, just heavily tested.

    // Remove leading zeros if not decimal (e.g. 05 -> 5)
    if (cleanVal.length > 1 && cleanVal.startsWith('0') && cleanVal[1] !== '.') {
        cleanVal = cleanVal.replace(/^0+/, '');
    }

    return cleanVal;
}
