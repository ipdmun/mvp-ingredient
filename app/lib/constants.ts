export const RECIPE_PRESETS: Record<string, { imageUrl: string, illustrationPrompt?: string, ingredients: { name: string, amount: number, unit: string }[] }> = {
    "된장찌개": {
        imageUrl: "https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&q=80&w=800",
        illustrationPrompt: "Raw photo, 8k, dslr, Korean Soybean Paste Stew (Doenjang-jjigae) in an earthen pot, bubbling hot, tofu and zucchini visible, professional food styling, appetizing, cinematic lighting.",
        ingredients: [
            { name: "된장", amount: 30, unit: "g" },
            { name: "두부", amount: 150, unit: "g" }, // Changed from 100
            { name: "무", amount: 50, unit: "g" },
            { name: "대파", amount: 20, unit: "g" },
            { name: "애호박", amount: 30, unit: "g" },
            { name: "청양고추", amount: 1, unit: "개" },
        ]
    },
    "김치찌개": {
        imageUrl: "https://images.unsplash.com/photo-1583225214464-9296fae5dcd4?auto=format&fit=crop&q=80&w=800",
        illustrationPrompt: "Raw photo, 8k, dslr, Spicy Kimchi Stew (Kimchi-jjigae) with pork and tofu, boiling in a black stone pot, deep red broth, steam rising, high quality, professional studio lighting.",
        ingredients: [
            { name: "김치", amount: 150, unit: "g" },
            { name: "돼지고기", amount: 100, unit: "g" },
            { name: "두부", amount: 150, unit: "g" }, // Changed from 100 to 150 to avoid confusion
            { name: "대파", amount: 20, unit: "g" },
            { name: "다진마늘", amount: 10, unit: "g" },
        ]
    },
    "비빔밥": {
        imageUrl: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=800",
        illustrationPrompt: "Raw photo, 8k, dslr, Korean Bibimbap in a stone bowl, colorful seasoned vegetables, sunny side up egg in center, red gochujang sauce, top-down professional food styling.",
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
        illustrationPrompt: "Photorealistic food photography of Spicy Pork Bulgogi (Jeyuk-bokkeum) on a ceramic plate, vibrant red spicy sauce, sesame seeds garnish, sizzling, professional food styling close-up.",
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
        illustrationPrompt: "Photorealistic food photography of Crispy Kimchi Pancake (Kimchijeon), golden brown crispy edges, red kimchi pieces visible, professional food styling on a rustic wooden table.",
        ingredients: [
            { name: "신김치", amount: 150, unit: "g" },
            { name: "부침가루", amount: 100, unit: "g" },
            { name: "돼지고기", amount: 50, unit: "g" },
            { name: "양파", amount: 30, unit: "g" },
        ]
    },
    "뚝배기불고기": {
        imageUrl: "https://images.unsplash.com/photo-1628260412297-a3377e45006f?auto=format&fit=crop&q=80&w=800",
        illustrationPrompt: "Photorealistic food photography of Pot-stewed Bulgogi (Ttukbaegi-bulgogi), clear soy broth with beef and glass noodles, steam rising from black earthen pot, professional food styling.",
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
        illustrationPrompt: "Photorealistic food photography of Grilled Pork Belly (Samgyeopsal) on a gas grill, golden crispy skin, fresh lettuce, garlic and ssamjang on side, 8k professional shot.",
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
        illustrationPrompt: "Photorealistic food photography of Spicy Stir-fried Chicken (Dakgalbi) in a large iron skillet, colorful cabbage and sweet potato, rich red spicy glaze, professional food styling.",
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
        illustrationPrompt: "Photorealistic food photography of Soft Tofu Stew (Sundubu-jjigae), vibrant red spicy broth, silky soft white tofu, clams and a fresh egg yolk, boiling hot in a stone pot.",
        ingredients: [
            { name: "순두부", amount: 350, unit: "g" },
            { name: "바지락", amount: 100, unit: "g" },
            { name: "계란", amount: 1, unit: "개" },
            { name: "대파", amount: 20, unit: "g" },
            { name: "고추기름", amount: 15, unit: "ml" },
        ]
    },
    "잡채": {
        imageUrl: "https://images.unsplash.com/photo-1633479392261-bd8c37f074b1?auto=format&fit=crop&q=80&w=800",
        illustrationPrompt: "Realistic food photography of Korean Glass Noodle Stir Fry (Japchae), glossy noodles with spinach, carrots, mushrooms, beef, sesame seeds, elegant plating.",
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
        illustrationPrompt: "Realistic food photography of Korean Seaweed Soup (Miyeok-guk), clear beef broth with soft seaweed, beef brisket chunks, warm and comforting home meal.",
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
        illustrationPrompt: "Photorealistic food photography of Spicy Rice Cakes (Tteokbokki) in a bowl, thick glossy red sauce, green onions, boiled egg, professional commercial food shot.",
        ingredients: [
            { name: "떡볶이떡", amount: 200, unit: "g" },
            { name: "사각어묵", amount: 2, unit: "장" },
            { name: "대파", amount: 30, unit: "g" },
            { name: "고추장", amount: 30, unit: "g" },
            { name: "설탕", amount: 15, unit: "g" },
        ]
    },
    // Remainder simplified/removed duplicates to prevent override issues. 
    // Keeping unique entries that were added for coverage but were partial duplicates.

    "부대찌개": {
        imageUrl: "https://images.unsplash.com/photo-1583225214464-9296fae5dcd4?auto=format&fit=crop&q=80&w=800",
        illustrationPrompt: "Realistic food photography of Army Stew (Budae-jjigae), ramen noodles, spam, sausages, kimchi, baked beans, cheese slice, bubbling in pot.",
        ingredients: [
            { name: "햄", amount: 50, unit: "g" },
            { name: "소세지", amount: 50, unit: "g" },
            { name: "김치", amount: 60, unit: "g" },
            { name: "라면사리", amount: 0.5, unit: "개" },
            { name: "두부", amount: 50, unit: "g" },
            { name: "대파", amount: 20, unit: "g" },
            { name: "베이크드빈스", amount: 30, unit: "g" },
            { name: "치즈", amount: 1, unit: "장" },
        ]
    },
    "김밥": {
        imageUrl: "https://images.unsplash.com/photo-1616422312675-9bad4d930fe6?auto=format&fit=crop&q=80&w=800",
        illustrationPrompt: "Realistic food photography of Korean Seaweed Rice Rolls (Gimbap), neatly sliced on a plate, colorful filling of spinach, carrot, egg, ham, pickled radish.",
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
        illustrationPrompt: "Realistic food photography of Ginseng Chicken Soup (Samgyetang), whole chicken in stone pot, ginseng root, jujube, scallions, clear healthy broth.",
        ingredients: [
            { name: "닭(영계)", amount: 1, unit: "마리" },
            { name: "찹쌀", amount: 50, unit: "g" },
            { name: "인삼", amount: 1, unit: "뿌리" },
            { name: "대추", amount: 3, unit: "개" },
            { name: "마늘", amount: 5, unit: "알" },
        ]
    },
    "냉면": {
        imageUrl: "https://images.unsplash.com/photo-1616422312675-9bad4d930fe6?auto=format&fit=crop&q=80&w=800",
        illustrationPrompt: "Realistic food photography of Cold Buckwheat Noodles (Naengmyeon) in stainless steel bowl, clear icy broth, cucumber slices, boiled egg, refreshing summer meal.",
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
        illustrationPrompt: "Realistic food photography of Seafood Scallion Pancake (Haemul-pajeon), golden crispy, abundant green onions and squid/shrimp, soy sauce dip on side.",
        ingredients: [
            { name: "쪽파", amount: 100, unit: "g" },
            { name: "오징어", amount: 50, unit: "g" },
            { name: "새우", amount: 30, unit: "g" },
            { name: "부침가루", amount: 100, unit: "g" },
            { name: "달걀", amount: 1, unit: "개" },
        ]
    },
    "콩나물국밥": {
        imageUrl: "https://images.unsplash.com/photo-1547928576-a4a33237bec3?auto=format&fit=crop&q=80&w=800",
        illustrationPrompt: "Realistic food photography of Bean Sprout Soup with Rice (Kongnamul-gukbap), steaming hot earthen pot, clear broth, green onions, kimchi on side.",
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
        illustrationPrompt: "Realistic food photography of Banquet Noodles (Janchi-guksu), thin wheat noodles in clear anchovy broth, garnished with zucchini, egg strips, seaweed, kimchi.",
        ingredients: [
            { name: "소면", amount: 100, unit: "g" },
            { name: "멸치육수", amount: 300, unit: "ml" },
            { name: "애호박", amount: 30, unit: "g" },
            { name: "달걀", amount: 1, unit: "개" },
            { name: "김", amount: 1, unit: "장" },
        ]
    },
    "오징어볶음": {
        imageUrl: "https://images.unsplash.com/photo-1548152433-4df4529329c9?auto=format&fit=crop&q=80&w=800",
        illustrationPrompt: "Realistic food photography of Spicy Stir-fried Squid (Ojing-eo-bokkeum), red spicy sauce, vegetables, sesame seeds, appetizing close-up.",
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
        illustrationPrompt: "Realistic food photography of Rich Soybean Paste Stew (Cheonggukjang), thick texture, tofu chunks, radish, rustic korean meal setting.",
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
        illustrationPrompt: "Realistic food photography of Boiled Pork Wrap (Bossam), sliced pork belly, spicy radish kimchi, fresh napa cabbage leaves, salted shrimp sauce.",
        ingredients: [
            { name: "돼지삼겹살(수육용)", amount: 200, unit: "g" },
            { name: "무말랭이", amount: 50, unit: "g" },
            { name: "배추", amount: 50, unit: "g" },
            { name: "새우젓", amount: 10, unit: "g" },
        ]
    },
    "돈까스(경양식)": {
        imageUrl: "https://images.unsplash.com/photo-1628260412297-a3377e45006f?auto=format&fit=crop&q=80&w=800",
        illustrationPrompt: "Realistic food photography of Korean Style Pork Cutlet (Donkatsu), large crispy fried cutlet covered in brown sauce, side of rice, cabbage salad, corn.",
        ingredients: [
            { name: "돼지등심", amount: 150, unit: "g" },
            { name: "빵가루", amount: 50, unit: "g" },
            { name: "돈까스소스", amount: 30, unit: "g" },
            { name: "양배추", amount: 30, unit: "g" },
            { name: "밥", amount: 100, unit: "g" },
        ]
    }
};
