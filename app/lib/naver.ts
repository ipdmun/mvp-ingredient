
export const fetchNaverPrice = async (queryName: string): Promise<{ price: number, source: string, link: string }[] | null> => {
    const naverClientId = process.env.NAVER_CLIENT_ID;
    const naverClientSecret = process.env.NAVER_CLIENT_SECRET;

    if (!naverClientId || !naverClientSecret) return null;

    // Keywords to exclude (Machines, Seeds, Snacks, Processed foods, etc.)
    const EXCLUDED_KEYWORDS = [
        "기계", "이절기", "다듬기", "씨앗", "모종", "비료", "화분", "농약", "제초제", "절단기", "호미", "삽", // Agriculture tools
        "메이커", "제조기", "슬라이서", "채칼", "거치대", "받침대", "모형", "장난감", "껍질", "세척기", "탈피기", // Kitchen tools
        "과자", "스낵", "칩", "안주", "말랭이", "젤리", "사탕", "초콜릿", "쫀드기", "쫄면", "떡볶이", "빵", "케이크", "쿠키", // Processed Snacks
        "분말", "가루", "파우더", "엑기스", "농축", "즙", "청", "오일", "향", "맛", "시럽", // Processed Ingredients & Flavorings
        "소스", "양념", "드레싱", "시즈닝", // Sauces
        "추억", "간식", "주전부리", "답례품", "선물세트", "홍보", "판촉", "인쇄", "스티커", // Marketing keywords for snacks
        "곤약", "실곤약", "면", "누들", "국수", "다이어트", "체중", // Diet foods
        // Non-food Containers/Packaging (Crucial for filtering "Onion Bag" vs "Onion")
        "양파망", "빈병", "공병", "빈박스", "공박스", "용기", "케이스", "바구니", "봉투", "비닐", "포장지", "박스만", "트레이", "자루", "그물",
        // Non-Food Items (Toys, Education, Stationery, Masks) - Fix for "Pork Mask" & "Cabbage Toy"
        "마스크", "우드", "팬시", "문구", "완구", "교구", "학습", "교재", "MDF", "부자재", "만들기", "장식", "가짜", "모형", "사료", "키링", "열쇠고리",
        // Processed Meals (Exclude "Rice Bowl" when searching for "Pork")
        "덮밥", "볶음밥", "컵밥", "도시락", "무침", "반찬", "절임", "장아찌", "튀김", "밀키트", "쿠킹박스", "짜사이", "자차이", "가공", "완제"
    ];

    try {
        const query = encodeURIComponent(queryName);
        // [Key Improvement]: Use sort='sim' (Relevance/Accuracy) instead of 'asc' (Lowest Price)
        // 'asc' often returns irrelevant cheap items (hooks, scales) for generic queries like "Mu".
        // 'sim' returns relevant items first (like "Radish").
        // We fetch 100 items (max) to increase the chance of finding cheap ones among relevant ones.
        const apiRes = await fetch(`https://openapi.naver.com/v1/search/shop.json?query=${query}&display=100&start=1&sort=sim`, {
            headers: {
                "X-Naver-Client-Id": naverClientId,
                "X-Naver-Client-Secret": naverClientSecret
            },
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!apiRes.ok) return null;

        const data = await apiRes.json();
        const validItems: { price: number, source: string, link: string }[] = [];

        if (data.items && data.items.length > 0) {
            // Filter Loop (Collect ALL valid items)
            for (const item of data.items) {
                const title = item.title.toLowerCase();
                // Naver returns category1, category2, category3, category4
                const categories = [item.category1, item.category2, item.category3, item.category4].filter(Boolean).join(" ");
                const price = parseInt(item.lprice, 10);

                // 1. Minimum Price Check
                if (price < 100) continue;

                // 2. Keyword Exclusion
                if (EXCLUDED_KEYWORDS.some(keyword => title.includes(keyword))) continue;

                // 3. Category Check
                // MUST contain food-related keywords in the category path.
                // Strict check: If it contains "주방용품", "가전", "생활", it's risky unless "식품" is explicitly there.

                // [Strict Category Filter]
                // Only allow items where the Primary Category (category1) is clearly "Food" or related.
                // This eliminates "Living/Health" > "Kitchen" (Onion Bag), "Stationery" (Fancy), "Toys" (Wood)
                const validCategory1 = ["식품", "출산/육아", "농산물", "축산물", "수산물"];
                const isFoodCategory = validCategory1.some(cat => item.category1.includes(cat));

                if (!isFoodCategory) {
                    continue; // Skip non-food categories entirely
                }

                // [Negative Filter] Explicitly exclude non-food categories even if they contain "식품" (e.g. "식품보관용기")
                const EXCLUDED_CATEGORIES = ["주방용품", "수납", "정리", "원예", "자재", "비료", "농기구", "식기", "그릇", "냄비", "조리도구", "포장", "용기", "잡화", "문구", "완구", "교구", "서적", "출산", "육아", "취미", "반려동물", "공구", "산업"];
                if (EXCLUDED_CATEGORIES.some(badCat => categories.includes(badCat))) {
                    continue;
                }

                // 4. Title Match Check (Relaxed)
                // The title MUST contain ALL keywords from the query.
                // e.g. Query: "배추 20kg" -> Title must contain "배추" AND "20kg"
                const queryParts = queryName.toLowerCase().split(/\s+/).filter(Boolean);
                const titleLower = title.toLowerCase(); // Title already lowercased above

                const allKeywordsMatch = queryParts.every(part => titleLower.includes(part));

                if (!allKeywordsMatch) {
                    continue;
                }

                // Valid Item Found! Add to list.
                validItems.push({
                    price: price,
                    source: `네이버최저가(${item.mallName || '쇼핑몰'})`,
                    link: item.link
                });
            }
        }

        // If generic query "Mu" returns 100 relevant items, we sort them by PRICE ASCENDING to find the cheapest relevant one.
        if (validItems.length > 0) {
            validItems.sort((a, b) => a.price - b.price);
            return validItems.slice(0, 20); // Return top 20 candidates for user selection
        }

    } catch (error) {
        console.error("Naver API Fetch Error:", error);
    }
    return null;
};

// Default Static Data (Fallback)
const STATIC_MARKET_PRICES: Record<string, { price: number, source: string, link?: string }> = {
    "양파": { price: 4500, source: "쿠팡", link: "https://www.coupang.com" },
    "대파": { price: 4000, source: "롯데마트", link: "https://www.lottemart.com" },
    "마늘": { price: 9000, source: "마켓컬리", link: "https://www.kurly.com" },
    "간마늘": { price: 9500, source: "하나로마트", link: "https://www.nhhanaro.co.kr" },
    "계란": { price: 8900, source: "이마트몰", link: "https://emart.ssg.com" },
    "판계란": { price: 8900, source: "이마트몰", link: "https://emart.ssg.com" },
    "무": { price: 1500, source: "가락시장", link: "https://www.garak.co.kr" },
    "배추": { price: 4500, source: "홈플러스", link: "https://front.homeplus.co.kr" },
    "청양고추": { price: 11000, source: "식자재왕", link: "https://www.fooden.net" },
    "감자": { price: 3800, source: "쿠팡", link: "https://www.coupang.com" },
    "당근": { price: 3000, source: "노브랜드", link: "https://www.ssg.com/mall/nobrand" },
};

export const getMarketAnalysis = async (name: string, price: number, unit: string, amount: number) => {
    // 1. Construct Search Queries
    // Strategy: Try specific "Name + Amount + Unit" first (e.g. "Onion 10kg"), if that fails, try "Name".

    let searchQueries: string[] = [];

    // [Fix Single Char Query Issue for "getMarketAnalysis"]
    // If name is "무", alias it here too just in case (though fetchNaverPrice handles it internally now)
    // But expanding queries logic uses original name.

    // [Fix] Sanitize Name: Remove contents in parentheses (e.g. "호박(애호박, 데친것)" -> "호박")
    const sanitizedName = name.replace(/\([^)]*\)/g, "").trim();

    // If unit is standard weight/volume, prioritize specific search
    // Expanded units to include common market units (Bundle, Net, Box, EA, Head, Tofu count)
    const validUnits = ['kg', 'g', 'L', 'ml', '단', '망', '박스', '개', '포기', '모', '봉'];
    if (amount > 0 && validUnits.includes(unit)) {
        searchQueries.push(`${sanitizedName} ${amount}${unit}`);
    }
    searchQueries.push(sanitizedName); // Fallback

    let marketDataList: { price: number, source: string, link: string }[] | null = null;
    let matchType: 'specific' | 'fallback' = 'fallback';

    for (const query of searchQueries) {
        marketDataList = await fetchNaverPrice(query);
        if (marketDataList && marketDataList.length > 0) {
            // Check if this was a specific query match
            // query matches specifically if it matches the first query in list (amount included scenario)
            if (amount > 0 && query === searchQueries[0] && searchQueries.length > 1) {
                matchType = 'specific';
            }
            break;
        }
    }

    if (!marketDataList || marketDataList.length === 0) return null;

    // Use the best match (cheapest) for main analysis
    const bestMatch = marketDataList[0];
    const marketPrice = bestMatch.price;
    let diff = 0;

    // Check query strategy result
    // If we matched specific quantity (e.g. "Onion 15kg"), Naver result is Total Price for 15kg.
    // If we matched fallback (e.g. "Onion"), Naver result is likely Cheapest Unit Price (1kg or 1ea).

    if (matchType === 'specific') {
        const totalDiff = price - marketPrice;
        // Normalize to Unit Diff so downstream logic (which usually multiplies by amount) works consistently
        diff = (amount > 0) ? totalDiff / amount : totalDiff;
    } else {
        // Fallback Match:
        // Compare Unit Price (User) vs Unit Price (Naver)
        // Calculate user's unit price
        const userUnitPrice = amount > 0 ? price / amount : price;
        diff = userUnitPrice - marketPrice;
    }

    let status: "BEST" | "GOOD" | "BAD" = "GOOD";

    if (diff <= -500) status = "BEST";   // Cheaper by 500+
    else if (diff >= 500) status = "BAD"; // Expensive by 500+
    else status = "GOOD"; // Similar

    return {
        cheapestSource: bestMatch.source,
        price: marketPrice,
        status: status,
        diff: diff,
        link: bestMatch.link,
        cheapestLink: bestMatch.link,
        marketDataRaw: bestMatch,
        candidates: marketDataList // [New Feature] Return all candidates for user selection
    };
};
