export function getIngredientIcon(name: string): string {
    const n = name.toLowerCase();
    // --- Specific Korean Ingredients (Design Team Selection) ---
    if (n.includes("쪽파")) return "/icons/jjokpa.png";
    if (n.includes("대파")) return "/icons/daepa.png";
    if (n.includes("간마늘") || n.includes("다진마늘")) return "/icons/minced_garlic.png";
    if (n.includes("마늘")) return "🧄"; // Whole Garlic
    if (n.includes("배추") || n.includes("알배기") || n.includes("봄동")) return "/icons/cabbage.png";
    if (n.includes("무") || n.includes("알타리") || n.includes("단무지")) return "/icons/radish.png";
    if (n.includes("고추") || n.includes("고춧") || n.includes("피망")) return "🌶️";
    if (n.includes("당근")) return "🥕";
    if (n.includes("오이") || n.includes("애호박")) return "🥒";
    if (n.includes("호박")) return "🎃";
    if (n.includes("토마토") || n.includes("방울")) return "🍅";
    if (n.includes("양파")) return "🧅";
    if (n.includes("감자")) return "🥔";
    if (n.includes("고구마")) return "🍠";
    if (n.includes("콩나물") || n.includes("숙주")) return "🌱";
    if (n.includes("김치")) return "🥬"; // Kimchi
    if (n.includes("쌀") || n.includes("밥")) return "🍚";
    if (n.includes("고기") || n.includes("돼지") || n.includes("소") || n.includes("한우")) return "🥩";
    if (n.includes("닭") || n.includes("치킨")) return "🍗";
    if (n.includes("생선") || n.includes("고등어") || n.includes("갈치") || n.includes("멸치")) return "🐟";
    if (n.includes("조개") || n.includes("우렁") || n.includes("굴") || n.includes("전복")) return "🦪";
    if (n.includes("우유")) return "🥛";
    if (n.includes("치즈")) return "🧀";
    if (n.includes("두부")) return "🧊"; // Tofu
    if (n.includes("버섯")) return "🍄";
    if (n.includes("된장") || n.includes("쌈장") || n.includes("고추장") || n.includes("간장")) return "🏺";
    if (n.includes("소금") || n.includes("후추") || n.includes("설탕") || n.includes("다시다") || n.includes("조미료")) return "🧂";
    if (n.includes("물") || n.includes("육수") || n.includes("생수")) return "💧";
    if (n.includes("기름") || n.includes("식용유") || n.includes("참기름")) return "🫒";

    return "📦";
}

export function formatIngredientName(name: string): string {
    if (!name.includes(",")) return name;

    const parts = name.split(",").map(s => s.trim());
    const main = parts[0];
    const details = parts.slice(1).join(", ");

    return `${main}(${details})`;
}

export function formatUnit(unit: string): string {
    return unit.toLowerCase();
}

/**
 * Converts a price from one unit to another for display.
 * @param price Raw price value
 * @param fromUnit Unit of the raw price (e.g. 'g')
 * @param toUnit Target display unit (e.g. 'kg')
 */
export function convertPriceForDisplay(price: number, fromUnit: string, toUnit: string): number {
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

/**
 * Converts an amount from one unit to another for display.
 * @param amount Raw amount value
 * @param fromUnit Unit of the raw amount (e.g. 'g')
 * @param toUnit Target display unit (e.g. 'kg')
 */
export function convertAmountForDisplay(amount: number, fromUnit: string, toUnit: string): number {
    const from = fromUnit.toLowerCase();
    const to = toUnit.toLowerCase();

    if (from === to) return amount;

    // g -> kg
    if (from === 'g' && to === 'kg') return amount / 1000;
    // ml -> l
    if (from === 'ml' && to === 'l') return amount / 1000;

    // kg -> g
    if (from === 'kg' && to === 'g') return amount * 1000;
    // l -> ml
    if (from === 'l' && to === 'ml') return amount * 1000;

    return amount;
}
