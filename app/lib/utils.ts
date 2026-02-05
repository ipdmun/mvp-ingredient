export function getIngredientIcon(name: string): string {
    const n = name.toLowerCase();
    // --- Specific Korean Ingredients (Design Team Selection) ---
    if (n.includes("쪽파")) return "/icons/jjokpa.png";
    if (n.includes("대파")) return "/icons/daepa.png";
    if (n.includes("간마늘") || n.includes("다진마늘")) return "/icons/minced_garlic.png";
    if (n.includes("마늘")) return "🧄"; // Whole Garlic
    if (n.includes("배추") || n.includes("알배기") || n.includes("봄동")) return "/icons/cabbage.png";
    if (n.includes("무") || n.includes("알타리") || n.includes("단무지")) return "/icons/radish.png";
    if (n.includes("고추") || n.includes("피망")) return "🌶️";
    if (n.includes("당근")) return "🥕";
    if (n.includes("오이") || n.includes("애호박")) return "🥒";
    if (n.includes("토마토") || n.includes("방울")) return "🍅";
    if (n.includes("쌀") || n.includes("밥")) return "🍚";
    if (n.includes("고기") || n.includes("돼지") || n.includes("소") || n.includes("한우")) return "🥩";
    if (n.includes("닭") || n.includes("치킨")) return "🍗";
    if (n.includes("생선") || n.includes("고등어") || n.includes("갈치")) return "🐟";
    if (n.includes("우유")) return "🥛";
    if (n.includes("치즈")) return "🧀";
    if (n.includes("두부")) return "🧊"; // Tofu (Ice Cube looks like Tofu block)
    if (n.includes("버섯")) return "🍄";

    return "📦";
}
