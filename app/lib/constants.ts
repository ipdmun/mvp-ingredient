export const RECIPE_PRESETS: Record<string, { imageUrl: string, ingredients: { name: string, amount: number, unit: string }[] }> = {
    "된장찌개": {
        imageUrl: "https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&q=80&w=800",
        ingredients: [
            { name: "된장", amount: 30, unit: "g" },
            { name: "두부", amount: 100, unit: "g" },
            { name: "무", amount: 50, unit: "g" },
            { name: "대파", amount: 20, unit: "g" },
        ]
    },
    "김치찌개": {
        imageUrl: "https://images.unsplash.com/photo-1617093228322-97cb355a6fa4?auto=format&fit=crop&q=80&w=800",
        ingredients: [
            { name: "김치", amount: 150, unit: "g" },
            { name: "돼지고기", amount: 100, unit: "g" },
            { name: "두부", amount: 100, unit: "g" },
            { name: "대파", amount: 20, unit: "g" },
        ]
    },
    "육전 국밥": {
        imageUrl: "https://images.unsplash.com/photo-1547928576-a4a33237bec3?auto=format&fit=crop&q=80&w=800",
        ingredients: [
            { name: "소고기(양지)", amount: 60, unit: "g" },
            { name: "무", amount: 50, unit: "g" },
            { name: "콩나물", amount: 30, unit: "g" },
            { name: "대파", amount: 15, unit: "g" },
            { name: "소고기(육전용)", amount: 30, unit: "g" },
            { name: "달걀", amount: 15, unit: "g" },
        ]
    },
    "국밥": {
        imageUrl: "https://images.unsplash.com/photo-1547928576-a4a33237bec3?auto=format&fit=crop&q=80&w=800",
        ingredients: [
            { name: "소고기(양지)", amount: 60, unit: "g" },
            { name: "무", amount: 50, unit: "g" },
            { name: "콩나물", amount: 30, unit: "g" },
            { name: "대파", amount: 15, unit: "g" },
        ]
    }
};
