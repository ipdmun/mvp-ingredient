export const RECIPE_PRESETS: Record<string, { imageUrl: string, illustrationPrompt?: string, ingredients: { name: string, amount: number, unit: string }[] }> = {
    "된장찌개": {
        imageUrl: "https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&q=80&w=800",
        illustrationPrompt: "Illustration of Korean soybean paste stew in an earthen pot, bubbling, earthy tones, flat design art.",
        ingredients: [
            { name: "된장", amount: 30, unit: "g" },
            { name: "두부", amount: 100, unit: "g" },
            { name: "무", amount: 50, unit: "g" },
            { name: "대파", amount: 20, unit: "g" },
            { name: "애호박", amount: 30, unit: "g" },
            { name: "청양고추", amount: 1, unit: "개" },
        ]
    },
    "김치찌개": {
        imageUrl: "https://images.unsplash.com/photo-1583225214464-9296fae5dcd4?auto=format&fit=crop&q=80&w=800",
        illustrationPrompt: "Spicy Kimchi stew with tofu and pork, boiling in a black stone pot, rich red color, appetizing vector art.",
        ingredients: [
            { name: "김치", amount: 150, unit: "g" },
            { name: "돼지고기", amount: 100, unit: "g" },
            { name: "두부", amount: 100, unit: "g" },
            { name: "대파", amount: 20, unit: "g" },
            { name: "다진마늘", amount: 10, unit: "g" },
        ]
    },
    "비빔밥": {
        imageUrl: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=800",
        illustrationPrompt: "Colorful Korean Bibimbap bowl illustration, top-down view, segmented vegetables, fried egg on top, vector graphics.",
        ingredients: [
            { name: "쌀밥", amount: 200, unit: "g" },
            { name: "콩나물", amount: 50, unit: "g" },
            { name: "시금치", amount: 50, unit: "g" },
            { name: "고사리", amount: 40, unit: "g" },
            { name: "당근", amount: 30, unit: "g" },
            { name: "소고기(다짐육)", amount: 50, unit: "g" },
            { name: "계란", amount: 1, unit: "개" },
            { name: "고추장", amount: 30, unit: "g" },
            { name: "참기름", amount: 10, unit: "ml" },
        ]
    },
    "제육볶음": {
        imageUrl: "https://images.unsplash.com/photo-1548152433-4df4529329c9?auto=format&fit=crop&q=80&w=800",
        illustrationPrompt: "Flat vector illustration of Korean spicy pork bulgogi (Jeyuk-bokkeum), vibrant red sauce, overhead view, minimalist food art style.",
        ingredients: [
            { name: "돼지고기(앞다리살)", amount: 200, unit: "g" },
            { name: "양파", amount: 50, unit: "g" },
            { name: "대파", amount: 30, unit: "g" },
            { name: "당근", amount: 20, unit: "g" },
            { name: "고추장", amount: 30, unit: "g" },
            { name: "고춧가루", amount: 15, unit: "g" },
            { name: "간장", amount: 15, unit: "ml" },
        ]
    },
    "김치전": {
        imageUrl: "https://images.unsplash.com/photo-1616422312675-9bad4d930fe6?auto=format&fit=crop&q=80&w=800",
        illustrationPrompt: "Crispy Korean Kimchi pancake illustration, orange and red palette, textured flat art, simple background.",
        ingredients: [
            { name: "신김치", amount: 150, unit: "g" },
            { name: "부침가루", amount: 100, unit: "g" },
            { name: "돼지고기", amount: 50, unit: "g" },
            { name: "양파", amount: 30, unit: "g" },
        ]
    },
    "뚝배기불고기": {
        imageUrl: "https://images.unsplash.com/photo-1628260412297-a3377e45006f?auto=format&fit=crop&q=80&w=800",
        illustrationPrompt: "Pot-stewed Bulgogi illustration, steam rising, sweet soy sauce color, clean line art, appetizing.",
        ingredients: [
            { name: "소고기(불고기용)", amount: 150, unit: "g" },
            { name: "당면", amount: 30, unit: "g" },
            { name: "팽이버섯", amount: 30, unit: "g" },
            { name: "간장", amount: 20, unit: "ml" },
            { name: "설탕", amount: 10, unit: "g" },
        ]
    },
    "삼겹살 구이": {
        imageUrl: "https://images.unsplash.com/photo-1628260412297-a3377e45006f?auto=format&fit=crop&q=80&w=800",
        illustrationPrompt: "Vector illustration of thick grilled pork belly slices on a grid, fresh lettuce wraps on the side, warm lighting, flat design.",
        ingredients: [
            { name: "통삼겹살", amount: 200, unit: "g" },
            { name: "쌈장", amount: 30, unit: "g" },
            { name: "상추", amount: 10, unit: "장" },
            { name: "깻잎", amount: 10, unit: "장" },
            { name: "마늘", amount: 5, unit: "알" },
            { name: "고추", amount: 2, unit: "개" },
        ]
    },
    "닭갈비": {
        imageUrl: "https://images.unsplash.com/photo-1548152433-4df4529329c9?auto=format&fit=crop&q=80&w=800",
        illustrationPrompt: "Spicy Korean stir-fried chicken (Dak-galbi) in a large round pan, vibrant red sauce, colorful vegetables, appetizing flat art.",
        ingredients: [
            { name: "닭다리살", amount: 200, unit: "g" },
            { name: "고구마", amount: 50, unit: "g" },
            { name: "양배추", amount: 50, unit: "g" },
            { name: "떡국떡", amount: 30, unit: "g" },
            { name: "고추장", amount: 30, unit: "g" },
            { name: "깻잎", amount: 5, unit: "장" },
        ]
    },
    "순두부찌개": {
        imageUrl: "https://images.unsplash.com/photo-1583225214464-9296fae5dcd4?auto=format&fit=crop&q=80&w=800",
        illustrationPrompt: "Soft tofu stew (Sundubu-jjigae) in a stone pot, red spicy broth, a raw egg yolk on top, minimalist vector style.",
        ingredients: [
            { name: "순두부", amount: 350, unit: "g" },
            { name: "바지락", amount: 100, unit: "g" },
            { name: "계란", amount: 1, unit: "개" },
            { name: "대파", amount: 20, unit: "g" },
            { name: "고추기름", amount: 15, unit: "ml" },
        ]
    },
    // --- Added Recipes for Analyst Coverage (Total ~15 here, allowing for variation) ---
    "잡채": {
        imageUrl: "https://images.unsplash.com/photo-1633479392261-bd8c37f074b1?auto=format&fit=crop&q=80&w=800",
        illustrationPrompt: "Korean glass noodle stir fry (Japchae), colorful vegetables, sesame seeds garnish, bright lighting, food illustration.",
        ingredients: [
            { name: "당면", amount: 100, unit: "g" },
            { name: "시금치", amount: 50, unit: "g" },
            { name: "당근", amount: 30, unit: "g" },
            { name: "양파", amount: 50, unit: "g" },
            { name: "소고기", amount: 50, unit: "g" },
            { name: "간장", amount: 30, unit: "ml" },
        ]
    },
    "미역국": {
        imageUrl: "https://images.unsplash.com/photo-1604579169213-3922338c2079?auto=format&fit=crop&q=80&w=800", // Fallback
        illustrationPrompt: "Warm Seaweed Soup (Miyeok-guk) in a white bowl, clear broth with beef brisket, soothing colors, vector art.",
        ingredients: [
            { name: "건미역", amount: 20, unit: "g" },
            { name: "소고기(국거리)", amount: 100, unit: "g" },
            { name: "다진마늘", amount: 10, unit: "g" },
            { name: "참기름", amount: 10, unit: "ml" },
            { name: "국간장", amount: 15, unit: "ml" },
        ]
    },
    "떡볶이": {
        imageUrl: "https://images.unsplash.com/photo-1583224964978-2257b960c3d3?auto=format&fit=crop&q=80&w=800",
        illustrationPrompt: "Spicy Rice Cake (Tteokbokki), red glossy sauce, fish cakes, green onions, street food vibe, flat illustration.",
        ingredients: [
            { name: "떡볶이떡", amount: 200, unit: "g" },
            { name: "사각어묵", amount: 2, unit: "장" },
            { name: "대파", amount: 30, unit: "g" },
            { name: "고추장", amount: 30, unit: "g" },
            { name: "설탕", amount: 15, unit: "g" },
        ]
    },
    "갈비찜": {
        imageUrl: "https://images.unsplash.com/photo-1606509939523-74b09b575775?auto=format&fit=crop&q=80&w=800", // Placeholder
        illustrationPrompt: "Braised Short Ribs (Galbijjim), rich dark sauce, carrots and chestnuts, steaming, premium food illustration.",
        ingredients: [
            { name: "소갈비", amount: 500, unit: "g" },
            { name: "무", amount: 100, unit: "g" },
            { name: "당근", amount: 50, unit: "g" },
            { name: "밤", amount: 5, unit: "알" },
            { name: "대추", amount: 3, unit: "알" },
        ]
    },
    "콩나물국": {
        imageUrl: "https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&q=80&w=800", // Placeholder
        illustrationPrompt: "Clear Bean Sprout Soup, refreshing broth, green onions and red chili slices, simple clean vector art.",
        ingredients: [
            { name: "콩나물", amount: 150, unit: "g" },
            { name: "대파", amount: 20, unit: "g" },
            { name: "다진마늘", amount: 5, unit: "g" },
            { name: "소금", amount: 5, unit: "g" },
        ]
    },
    "계란말이": {
        imageUrl: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=800", // Placeholder
        illustrationPrompt: "Rolled Omelet (Gyeran-mari), yellow layers, chopped vegetables visible, sliced on a plate, warm colors.",
        ingredients: [
            { name: "계란", amount: 5, unit: "개" },
            { name: "당근", amount: 20, unit: "g" },
            { name: "대파", amount: 20, unit: "g" },
            { name: "소금", amount: 2, unit: "g" },
        ]
    }        ingredients: [
        { name: "순두부", amount: 1, unit: "봉" },
        { name: "바지락", amount: 50, unit: "g" },
        { name: "달걀", amount: 1, unit: "개" },
        { name: "고추기름", amount: 10, unit: "ml" },
        { name: "대파", amount: 20, unit: "g" },
    ]
},
"부대찌개": {
    imageUrl: "https://images.unsplash.com/photo-1583225214464-9296fae5dcd4?auto=format&fit=crop&q=80&w=800",
        illustrationPrompt: "Korean Army Stew (Budae-jjigae) filled with ham, sausages, and ramen noodles, hearty and colorful illustration.",
            ingredients: [
                { name: "햄", amount: 50, unit: "g" },
                { name: "소세지", amount: 50, unit: "g" },
                { name: "김치", amount: 60, unit: "g" },
                { name: "라면사리", amount: 0.5, unit: "개" },
                { name: "두부", amount: 50, unit: "g" },
                { name: "대파", amount: 20, unit: "g" },
                { name: "베이크드빈스", amount: 30, unit: "g" },
                { name: "치즈", amount: 1, unit: "장" }, // Added cheese from user list
            ]
},
"잡채": {
    imageUrl: "https://images.unsplash.com/photo-1616422312675-9bad4d930fe6?auto=format&fit=crop&q=80&w=800",
        illustrationPrompt: "Glass noodles with stir-fried vegetables (Japchae), sesame seed garnish, glossy texture, clean line art.",
            ingredients: [
                { name: "당면", amount: 100, unit: "g" },
                { name: "시금치", amount: 50, unit: "g" },
                { name: "당근", amount: 30, unit: "g" },
                { name: "양파", amount: 50, unit: "g" },
                { name: "표고버섯", amount: 30, unit: "g" },
                { name: "소고기(잡채용)", amount: 50, unit: "g" },
                { name: "간장", amount: 30, unit: "ml" },
            ]
},
"떡볶이": {
    imageUrl: "https://images.unsplash.com/photo-1583224964978-2257b9607036?auto=format&fit=crop&q=80&w=800",
        illustrationPrompt: "Spicy rice cakes (Tteokbokki) with fish cakes in a bowl, thick red sauce, bright and fun vector graphics.",
            ingredients: [
                { name: "떡볶이떡", amount: 200, unit: "g" },
                { name: "사각어묵", amount: 1, unit: "장" },
                { name: "대파", amount: 30, unit: "g" },
                { name: "고추장", amount: 30, unit: "g" },
                { name: "고춧가루", amount: 15, unit: "g" },
                { name: "설탕", amount: 15, unit: "g" },
                { name: "삶은 달걀", amount: 1, unit: "개" }, // User idea
            ]
},
"김밥": {
    imageUrl: "https://images.unsplash.com/photo-1616422312675-9bad4d930fe6?auto=format&fit=crop&q=80&w=800",
        illustrationPrompt: "Sliced Korean seaweed rice rolls (Gimbap) on a wooden plate, colorful cross-section, minimal flat design.",
            ingredients: [
                { name: "쌀밥", amount: 80, unit: "g" },
                { name: "김밥김", amount: 1, unit: "장" },
                { name: "햄", amount: 15, unit: "g" },
                { name: "단무지", amount: 20, unit: "g" },
                { name: "당근", amount: 15, unit: "g" },
                { name: "시금치", amount: 15, unit: "g" },
                { name: "달걀", amount: 30, unit: "g" },
            ]
},
"삼계탕": {
    imageUrl: "https://images.unsplash.com/photo-1547928576-a4a33237bec3?auto=format&fit=crop&q=80&w=800",
        illustrationPrompt: "Ginseng chicken soup (Samgyetang) in a black bowl, whole chicken in clear broth, healthy and traditional art style.",
            ingredients: [
                { name: "닭(영계)", amount: 1, unit: "마리" },
                { name: "찹쌀", amount: 50, unit: "g" },
                { name: "인삼", amount: 1, unit: "뿌리" },
                { name: "대추", amount: 3, unit: "개" },
                { name: "마늘", amount: 5, unit: "알" },
            ]
},
"갈비찜": {
    imageUrl: "https://images.unsplash.com/photo-1628260412297-a3377e45006f?auto=format&fit=crop&q=80&w=800",
        illustrationPrompt: "Braised short ribs (Galbijjim), rich brown glaze, tender meat texture, elegant food illustration.",
            ingredients: [
                { name: "소갈비", amount: 300, unit: "g" },
                { name: "무", amount: 100, unit: "g" },
                { name: "당근", amount: 50, unit: "g" },
                { name: "대파", amount: 30, unit: "g" },
                { name: "배", amount: 50, unit: "g" },
                { name: "간장", amount: 45, unit: "ml" },
                { name: "설탕", amount: 20, unit: "g" },
            ]
},
"냉면": {
    imageUrl: "https://images.unsplash.com/photo-1616422312675-9bad4d930fe6?auto=format&fit=crop&q=80&w=800",
        illustrationPrompt: "Cold buckwheat noodles (Naengmyeon) in a stainless steel bowl, icy broth, refreshing summer vibe, flat art.",
            ingredients: [
                { name: "메밀면", amount: 150, unit: "g" },
                { name: "동치미 육수", amount: 300, unit: "ml" },
                { name: "삶은 달걀", amount: 0.5, unit: "개" },
                { name: "오이", amount: 20, unit: "g" },
                { name: "무절임", amount: 20, unit: "g" },
            ]
},
"해물파전": {
    imageUrl: "https://images.unsplash.com/photo-1616422312675-9bad4d930fe6?auto=format&fit=crop&q=80&w=800",
        illustrationPrompt: "Korean seafood scallion pancake (Haemul-pajeon), crispy edges, topped with seafood, cozy warm colors.",
            ingredients: [
                { name: "쪽파", amount: 100, unit: "g" },
                { name: "오징어", amount: 50, unit: "g" },
                { name: "새우", amount: 30, unit: "g" },
                { name: "부침가루", amount: 100, unit: "g" },
                { name: "달걀", amount: 1, unit: "개" },
            ]
},
"육개장": {
    imageUrl: "https://images.unsplash.com/photo-1583225214464-9296fae5dcd4?auto=format&fit=crop&q=80&w=800",
        illustrationPrompt: "Spicy beef soup (Yukgaejang), deep red color, shredded beef and vegetables, bold and hearty illustration.",
            ingredients: [
                { name: "소고기(양지)", amount: 50, unit: "g" },
                { name: "고사리", amount: 30, unit: "g" },
                { name: "숙주", amount: 30, unit: "g" },
                { name: "대파", amount: 30, unit: "g" },
                { name: "고추가루", amount: 10, unit: "g" },
            ]
},
"돼지국밥": {
    imageUrl: "https://images.unsplash.com/photo-1547928576-a4a33237bec3?auto=format&fit=crop&q=80&w=800",
        illustrationPrompt: "Pork rice soup (Dwaeji-gukbap), milky white broth, topped with chives, traditional Busan style art.",
            ingredients: [
                { name: "돼지수육", amount: 100, unit: "g" },
                { name: "사골육수", amount: 500, unit: "ml" },
                { name: "부추", amount: 20, unit: "g" },
                { name: "새우젓", amount: 10, unit: "g" },
                { name: "다대기", amount: 10, unit: "g" },
            ]
},
"콩나물국밥": {
    imageUrl: "https://images.unsplash.com/photo-1547928576-a4a33237bec3?auto=format&fit=crop&q=80&w=800",
        illustrationPrompt: "Soybean sprout soup with rice (Kongnamul-gukbap), steaming hot pot, light and clean vector style.",
            ingredients: [
                { name: "콩나물", amount: 100, unit: "g" },
                { name: "공기밥", amount: 1, unit: "공기" },
                { name: "오징어", amount: 30, unit: "g" },
                { name: "청양고추", amount: 1, unit: "개" },
                { name: "새우젓", amount: 10, unit: "g" },
            ]
},
"잔치국수": {
    imageUrl: "https://images.unsplash.com/photo-1616422312675-9bad4d930fe6?auto=format&fit=crop&q=80&w=800",
        illustrationPrompt: "Banquet noodles (Janchi-guksu), thin noodles in clear broth, colorful toppings, simple and warm line art.",
            ingredients: [
                { name: "소면", amount: 100, unit: "g" },
                { name: "멸치육수", amount: 300, unit: "ml" }, // Replaced water/broth
                { name: "애호박", amount: 30, unit: "g" },
                { name: "달걀", amount: 1, unit: "개" }, // or "계란지단"
                { name: "김", amount: 1, unit: "장" }, // or "김가루"
            ]
},
"오징어볶음": {
    imageUrl: "https://images.unsplash.com/photo-1548152433-4df4529329c9?auto=format&fit=crop&q=80&w=800",
        illustrationPrompt: "Stir-fried spicy squid, vibrant colors, ring-shaped squid, spicy and sweet vibe illustration.",
            ingredients: [
                { name: "오징어", amount: 1, unit: "마리" },
                { name: "양배추", amount: 50, unit: "g" },
                { name: "당근", amount: 20, unit: "g" },
                { name: "고추가루", amount: 20, unit: "g" },
                { name: "물엿", amount: 10, unit: "g" },
            ]
},
"청국장찌개": {
    imageUrl: "https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&q=80&w=800",
        illustrationPrompt: "Strong soybean paste stew (Cheonggukjang), thick texture, earthy tones, traditional stone bowl art.",
            ingredients: [
                { name: "청국장", amount: 50, unit: "g" },
                { name: "두부", amount: 50, unit: "g" },
                { name: "신김치", amount: 30, unit: "g" },
                { name: "무", amount: 30, unit: "g" },
                { name: "대파", amount: 20, unit: "g" },
            ]
},
"보쌈": {
    imageUrl: "https://images.unsplash.com/photo-1628260412297-a3377e45006f?auto=format&fit=crop&q=80&w=800",
        illustrationPrompt: "Boiled pork slices (Bossam) with spicy radish salad and cabbage, neat arrangement, flat vector art.",
            ingredients: [
                { name: "돼지삼겹살(수육용)", amount: 200, unit: "g" },
                { name: "무말랭이", amount: 50, unit: "g" },
                { name: "배추", amount: 50, unit: "g" },
                { name: "새우젓", amount: 10, unit: "g" },
            ]
},
"돈까스(경양식)": {
    imageUrl: "https://images.unsplash.com/photo-1628260412297-a3377e45006f?auto=format&fit=crop&q=80&w=800",
        illustrationPrompt: "Korean-style pork cutlet (Donkasu), large fried cutlet with brown sauce, retro restaurant style art.",
            ingredients: [
                { name: "돼지등심", amount: 150, unit: "g" },
                { name: "빵가루", amount: 50, unit: "g" },
                { name: "돈까스소스", amount: 30, unit: "g" },
                { name: "양배추", amount: 30, unit: "g" },
                { name: "밥", amount: 100, unit: "g" },
            ]
},
"불고기": { // Keeping old but adding prompt (Step 43 prompt for "But it exists in step 37 list? No, step 37 had Pot-stewed Bulgogi. Step 43 doesn't have Bulgogi!")
    imageUrl: "https://images.unsplash.com/photo-1628260412297-a3377e45006f?auto=format&fit=crop&q=80&w=800",
        ingredients: [
            { name: "소고기(불고기용)", amount: 200, unit: "g" },
            { name: "양파", amount: 50, unit: "g" },
            { name: "대파", amount: 20, unit: "g" },
            { name: "당근", amount: 20, unit: "g" },
            { name: "간장", amount: 30, unit: "ml" },
            { name: "설탕", amount: 15, unit: "g" },
            { name: "다진마늘", amount: 10, unit: "g" },
        ]
}, // I'll add "Pot-stewed" separately as 뚝배기불고기
"미역국": { // Keeping old
    imageUrl: "https://images.unsplash.com/photo-1547928576-a4a33237bec3?auto=format&fit=crop&q=80&w=800",
        ingredients: [
            { name: "미역(건조)", amount: 10, unit: "g" },
            { name: "소고기(국거리)", amount: 60, unit: "g" },
            { name: "다진마늘", amount: 10, unit: "g" },
            { name: "국간장", amount: 15, unit: "ml" },
            { name: "참기름", amount: 5, unit: "ml" },
        ]
},
"칼국수": { // Keeping old
    imageUrl: "https://images.unsplash.com/photo-1616422312675-9bad4d930fe6?auto=format&fit=crop&q=80&w=800",
        ingredients: [
            { name: "칼국수면", amount: 150, unit: "g" },
            { name: "바지락", amount: 100, unit: "g" },
            { name: "애호박", amount: 30, unit: "g" },
            { name: "대파", amount: 20, unit: "g" },
        ]
},
"육전 국밥": { // Keeping old
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
"국밥": { // Keeping old
    imageUrl: "https://images.unsplash.com/photo-1547928576-a4a33237bec3?auto=format&fit=crop&q=80&w=800",
        ingredients: [
            { name: "소고기(양지)", amount: 60, unit: "g" },
            { name: "무", amount: 50, unit: "g" },
            { name: "콩나물", amount: 30, unit: "g" },
            { name: "대파", amount: 15, unit: "g" },
        ]
}
};
