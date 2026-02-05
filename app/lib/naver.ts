

export const fetchNaverPrice = async (queryName: string): Promise<{ price: number, source: string, link?: string } | null> => {
    const naverClientId = process.env.NAVER_CLIENT_ID;
    const naverClientSecret = process.env.NAVER_CLIENT_SECRET;

    if (!naverClientId || !naverClientSecret) return null;

    // Keywords to exclude (Machines, Seeds, etc.)
    const EXCLUDED_KEYWORDS = ["기계", "이절기", "다듬기", "씨앗", "모종", "비료", "화분", "농약", "제초제", "절단기"];

    // Allowed Categories (Must be Food related)
    const ALLOWED_CATEGORIES = ["식품", "생활/건강"]; // 생활/건강 is sometimes used for health foods, but mostly 식품 is key.

    try {
        const query = encodeURIComponent(queryName);
        // display: 20 (Fetch more to filter out bad results), sort: 'asc' (lowest price)
        const apiRes = await fetch(`https://openapi.naver.com/v1/search/shop.json?query=${query}&display=20&start=1&sort=asc`, {
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
                const category1 = item.category1;
                const price = parseInt(item.lprice, 10);

                // 1. Minimum Price Check (10 won is usually an error or accessory)
                if (price < 100) continue;

                // 2. Keyword Exclusion
                if (EXCLUDED_KEYWORDS.some(keyword => title.includes(keyword))) continue;

                // 3. Category Check
                // Note: category1 usually contains "식품" for ingredients.
                if (!category1.includes("식품") && !category1.includes("농산물") && !category1.includes("축산물") && !category1.includes("수산물")) {
                    // Fallback: If it's "생활/건강" but title contains the query name, maybe ok? 
                    // But for "vegetables", it MUST be food.
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
    if (!marketData) {
        const key = Object.keys(STATIC_MARKET_PRICES).find(k => name.includes(k));
        if (key) {
            marketData = STATIC_MARKET_PRICES[key];
        }
    }

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
        marketDataRaw: marketData // For debugging or direct access
    };
};
