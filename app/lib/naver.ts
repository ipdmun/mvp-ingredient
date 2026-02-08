

export const fetchNaverPrice = async (queryName: string): Promise<{ price: number, source: string, link?: string } | null> => {
    const naverClientId = process.env.NAVER_CLIENT_ID;
    const naverClientSecret = process.env.NAVER_CLIENT_SECRET;

    if (!naverClientId || !naverClientSecret) return null;

    // Keywords to exclude (Machines, Seeds, Snacks, Processed foods, etc.)
    const EXCLUDED_KEYWORDS = [
        "기계", "이절기", "다듬기", "씨앗", "모종", "비료", "화분", "농약", "제초제", "절단기", // Agriculture tools
        "메이커", "제조기", "슬라이서", "채칼", "거치대", "받침대", "모형", "장난감", "껍질", "세척기", // Kitchen tools
        "과자", "스낵", "칩", "안주", "말랭이", "젤리", "사탕", "초콜릿", "쫀드기", "쫄면", "떡볶이", "빵", "케이크", // Processed Snacks (ZZONDEUGI added)
        "분말", "가루", "파우더", "엑기스", "농축", "즙", "청", "오일", "향", "맛", "시럽", // Processed Ingredients & Flavorings
        "소스", "양념", "드레싱", "시즈닝", // Sauces
        "추억", "간식", "주전부리", "답례품", "선물세트", // Marketing keywords for snacks
        "곤약", "실곤약", "면", "누들", "국수", "다이어트", "체중", // Diet foods (Tofu confusion prevention)
        "식당용", "업소용" // Bulk
    ];

    try {
        const query = encodeURIComponent(queryName);
        // display: 40 (Increased to allow better filtering), sort: 'asc' (lowest price)
        const apiRes = await fetch(`https://openapi.naver.com/v1/search/shop.json?query=${query}&display=40&start=1&sort=asc`, {
            headers: {
                "X-Naver-Client-Id": naverClientId,
                "X-Naver-Client-Secret": naverClientSecret
            },
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!apiRes.ok) return null;

        const data = await apiRes.json();

        if (data.items && data.items.length > 0) {
            // Filter Loop
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
                // Safest bet: Must include "식품" or "농산물" or "축산물" or "수산물".
                if (!categories.includes("식품") && !categories.includes("농산물") && !categories.includes("축산물") && !categories.includes("수산물")) {
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

                return {
                    price: price,
                    source: `네이버최저가(${item.mallName || '쇼핑몰'})`,
                    link: item.link
                };
            }
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

    // If unit is standard weight/volume, prioritize specific search
    if (amount > 0 && (unit === 'kg' || unit === 'g' || unit === 'L' || unit === 'ml')) {
        searchQueries.push(`${name} ${amount}${unit}`);
    }
    searchQueries.push(name); // Fallback

    let marketData = null;

    for (const query of searchQueries) {
        marketData = await fetchNaverPrice(query);
        if (marketData) break;
    }

    // 2. Fallback to static data if API fails or no result
    // DISABLED: User requested removal of generic static data.
    /*
    if (!marketData) {
        const key = Object.keys(STATIC_MARKET_PRICES).find(k => name.includes(k));
        if (key) {
            marketData = STATIC_MARKET_PRICES[key];
        }
    }
    */

    if (!marketData) return null;

    const marketPrice = marketData.price;

    // Normalize scanned price to unit price if possible
    let scannedUnitPrice = price;
    if (amount > 1 && (unit === 'kg' || unit === '개' || unit === '단' || unit === '망')) {
        scannedUnitPrice = price / amount;
    }

    // Simple Comparison
    const diff = scannedUnitPrice - marketPrice;
    let status: "BEST" | "GOOD" | "BAD" = "GOOD";

    if (diff <= -500) status = "BEST";   // Cheaper by 500+
    else if (diff >= 500) status = "BAD"; // Expensive by 500+
    else status = "GOOD"; // Similar

    return {
        cheapestSource: marketData.source,
        price: marketPrice,
        status: status,
        diff: diff,
        link: marketData.link,
        cheapestLink: marketData.link, // Store explicitly as cheapestLink
        marketDataRaw: marketData // For debugging or direct access
    };
};
