export function getIngredientIcon(name: string): string {
    const n = name.toLowerCase();
    if (n.includes("양파")) return "🧅";
    if (n.includes("계란") || n.includes("달걀")) return "🥚";
    if (n.includes("무")) return "⚪";
    if (n.includes("마늘")) return "🧄";
    if (n.includes("파")) return "🌱";
    if (n.includes("감자")) return "🥔";
    if (n.includes("고구마")) return "🍠";
    if (n.includes("배추")) return "🥬";
    if (n.includes("고추")) return "🌶️";
    if (n.includes("당근")) return "🥕";
    if (n.includes("오이")) return "🥒";
    if (n.includes("토마토")) return "🍅";
    if (n.includes("쌀")) return "🍚";
    if (n.includes("고기") || n.includes("돼지") || n.includes("소")) return "🥩";
    if (n.includes("닭")) return "🍗";
    if (n.includes("생선")) return "🐟";
    if (n.includes("우유")) return "🥛";
    if (n.includes("치즈")) return "🧀";
    return "📦";
}
