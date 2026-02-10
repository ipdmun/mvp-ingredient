import { getStandardWeight } from "./recipeUtils";

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
    "덮밥", "볶음밥", "컵밥", "도시락", "무침", "반찬", "절임", "장아찌", "튀김", "밀키트", "쿠킹박스", "짜사이", "자차이", "가공", "완제",
    // Beverages & Health Foods (Strictly exclude unless requested)
    "티백", "차류", "액상", "스틱", "환", "정", "캡슐", "진액", "건강식품", "호박차", "팥차", "율무차", "생강차", "대추차", "쌍화차", "유자차", "매실차", "오미자차", "식혜", "수정과"
];

// Keywords that indicate processed/beverage products. 
const BEVERAGE_KEYWORDS = ["차", "즙", "주스", "에이드", "라떼", "음료", "드링크", "수"];

/**
 * Parses weight/quantity from Naver product titles.
 * e.g. "양파 5kg" -> { amount: 5, unit: "kg" }
 */
export const parseWeightFromTitle = (title: string, ingredientName: string): { amount: number, unit: string } | null => {
    const lowerTitle = title.toLowerCase();

    // 1. Check for explicit weight (kg, g, L, ml)
    const weightMatch = lowerTitle.match(/(\d+(\.\d+)?)\s*(kg|g|l|ml|ml)/i);
    if (weightMatch) {
        return { amount: parseFloat(weightMatch[1]), unit: weightMatch[3].toLowerCase() };
    }

    // 2. Check for count/units (단, 망, 박스, 개, 포기, 모, 봉)
    const unitMatch = lowerTitle.match(/(\d+)\s*(단|망|박스|개|포기|모|봉)/);
    if (unitMatch) {
        const amount = parseInt(unitMatch[1], 10);
        const unit = unitMatch[2];

        const std = getStandardWeight(ingredientName);
        if (std) {
            return { amount: amount * std.weight, unit: 'g' };
        }
        return { amount, unit };
    }

    // 3. Standalone units
    const standaloneMatch = lowerTitle.match(/(단|망|박스|개|포기|모|봉)/);
    if (standaloneMatch) {
        const unit = standaloneMatch[1];
        const std = getStandardWeight(ingredientName);
        if (std) {
            return { amount: std.weight, unit: 'g' };
        }
        return { amount: 1, unit };
    }

    return null;
};

export const fetchNaverPrice = async (queryName: string, ingredientName?: string): Promise<{ price: number, source: string, link: string, parsedAmount?: number, parsedUnit?: string }[] | null> => {
    const naverClientId = process.env.NAVER_CLIENT_ID;
    const naverClientSecret = process.env.NAVER_CLIENT_SECRET;

    if (!naverClientId || !naverClientSecret) return null;

    try {
        const query = encodeURIComponent(queryName);
        const apiRes = await fetch(`https://openapi.naver.com/v1/search/shop.json?query=${query}&display=100&start=1&sort=sim`, {
            headers: {
                "X-Naver-Client-Id": naverClientId,
                "X-Naver-Client-Secret": naverClientSecret
            },
            next: { revalidate: 3600 }
        });

        if (!apiRes.ok) return null;

        const data = await apiRes.json();
        const validItems: { price: number, source: string, link: string, parsedAmount?: number, parsedUnit?: string }[] = [];

        if (data.items && data.items.length > 0) {
            for (const item of data.items) {
                let title = item.title.toLowerCase().replace(/<[^>]+>/g, "");
                const categories = [item.category1, item.category2, item.category3, item.category4].filter(Boolean).join(" ");
                const price = parseInt(item.lprice, 10);

                if (price < 100) continue;
                if (EXCLUDED_KEYWORDS.some(keyword => title.includes(keyword))) continue;

                const isQueryBeverage = BEVERAGE_KEYWORDS.some(k => queryName.includes(k));
                if (!isQueryBeverage) {
                    if (BEVERAGE_KEYWORDS.some(k => title.includes(k)) && !title.includes("배추") && !title.includes("고추")) continue;
                }

                if (item.mallName === "네이버") continue;

                const validCategory1 = ["식품", "출산/육아", "농산물", "축산물", "수산물"];
                if (!validCategory1.some(cat => item.category1.includes(cat))) continue;

                const EXCLUDED_CATEGORIES = ["주방용품", "수납", "정리", "원예", "자재", "비료", "농기구", "식기", "그릇", "냄비", "조리도구", "포장", "용기", "잡화", "문구", "완구", "교구", "서적", "출산", "육아", "취미", "반려동물", "공구", "산업", "가렌드", "파티"];
                const BEVERAGE_CATEGORIES = ["차류", "건강식품", "음료", "커피", "전통차", "허브차", "홍차", "녹차", "다이어트식품", "건강환", "건강즙", "건강분말"];

                if (!isQueryBeverage && BEVERAGE_CATEGORIES.some(badCat => categories.includes(badCat))) continue;
                if (EXCLUDED_CATEGORIES.some(badCat => categories.includes(badCat))) continue;

                const queryParts = queryName.toLowerCase().split(/\s+/).filter(Boolean);
                if (!queryParts.every(part => title.includes(part))) continue;

                const parsed = parseWeightFromTitle(title, ingredientName || queryName);
                validItems.push({
                    price: price,
                    source: `네이버최저가(${item.mallName || '쇼핑몰'})`,
                    link: item.link,
                    parsedAmount: parsed?.amount,
                    parsedUnit: parsed?.unit
                });
            }
        }

        if (validItems.length > 0) {
            validItems.sort((a, b) => a.price - b.price);
            if (validItems.length >= 5) {
                validItems.shift();
                validItems.pop();
            }
            return validItems.slice(0, 20);
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
    const sanitizedName = name.split(/[,(]/)[0].trim();
    let searchQueries: string[] = [];
    const validUnits = ['kg', 'g', 'L', 'ml', '단', '망', '박스', '개', '포기', '모', '봉'];
    if (amount > 0 && validUnits.includes(unit)) {
        searchQueries.push(`${sanitizedName} ${amount}${unit}`);
    }
    searchQueries.push(sanitizedName);

    let marketDataList: { price: number, source: string, link: string, parsedAmount?: number, parsedUnit?: string }[] | null = null;
    let matchType: 'specific' | 'fallback' = 'fallback';

    for (const query of searchQueries) {
        marketDataList = await fetchNaverPrice(query, sanitizedName);
        if (marketDataList && marketDataList.length > 0) {
            if (amount > 0 && query === searchQueries[0] && searchQueries.length > 1) {
                matchType = 'specific';
            }
            break;
        }
    }

    if (!marketDataList || marketDataList.length === 0) return null;

    const bestMatch = marketDataList[0];
    const marketPrice = bestMatch.price;
    let diff = 0;

    let userUnitPrice = amount > 0 ? price / amount : price;
    const lowerUnit = unit.toLowerCase().trim();
    const isPieceUnit = /개|ea|piece|모|봉|단|포기/i.test(lowerUnit);

    if (isPieceUnit) {
        const std = getStandardWeight(name);
        if (std) {
            userUnitPrice = userUnitPrice / std.weight;
        }
    } else if (lowerUnit === 'kg' || lowerUnit === 'l') {
        userUnitPrice = userUnitPrice / 1000;
    }

    let naverUnitPrice = bestMatch.price;
    if (bestMatch.parsedAmount && bestMatch.parsedAmount > 0) {
        naverUnitPrice = bestMatch.price / bestMatch.parsedAmount;
        if (bestMatch.parsedUnit === 'kg' || bestMatch.parsedUnit === 'l') {
            naverUnitPrice = naverUnitPrice / 1000;
        }
    } else if (matchType === 'specific' && amount > 0) {
        // Fallback: If we searched "Onion 10kg" and got a result but couldn't parse 10kg from title.
        // DANGER: If Naver result is actually 1kg (4,900) but we assume it's 10kg, we get a huge error.
        // Fix: Only assume it matches the query quantity IF the price is high enough to be that quantity.
        // e.g. If user bought 10kg for 30,000, and Naver is 25,000, it's likely 10kg.
        // If Naver is 4,900, it's likely 1kg.

        const isSuspiciouslyLow = bestMatch.price < (userUnitPrice * amount * 0.3); // Less than 30% of expected total? Likely a smaller unit.

        if (isSuspiciouslyLow) {
            // Treat as "per unit" (1kg or 1ea) instead of normalizing by 'amount'
            naverUnitPrice = bestMatch.price;
        } else {
            naverUnitPrice = bestMatch.price / amount;
        }

        if (lowerUnit === 'kg' || lowerUnit === 'l') {
            naverUnitPrice = naverUnitPrice / 1000;
        }
    }

    diff = userUnitPrice - naverUnitPrice;

    if (lowerUnit === 'kg' || lowerUnit === 'l') {
        diff = diff * 1000;
    } else if (isPieceUnit) {
        const std = getStandardWeight(name);
        if (std) {
            diff = diff * std.weight;
        }
    }

    // 4. Calculate Total Price Difference (User's Total vs Market's Total for SAME amount)
    // naverUnitPrice is currently "per standard unit" (per gram if kg/l, per piece if pieces).

    let standardizedAmount = amount > 0 ? amount : 1;
    if (lowerUnit === 'kg' || lowerUnit === 'l') {
        standardizedAmount = standardizedAmount * 1000;
    } else if (isPieceUnit) {
        const std = getStandardWeight(name);
        if (std) standardizedAmount = standardizedAmount * std.weight;
    }

    const marketTotalForUserAmount = Math.round(naverUnitPrice * standardizedAmount);
    const totalDiff = price - marketTotalForUserAmount;

    // Calculate Price Per User's Unit (for UI Display)
    // e.g. if User Unit is kg, we want Price Per Kg (3125), not Price Per Gram (3.125).
    let marketPricePerUserUnit = naverUnitPrice;
    if (lowerUnit === 'kg' || lowerUnit === 'l') {
        marketPricePerUserUnit = naverUnitPrice * 1000;
    }

    // Status Determination
    let status: "BEST" | "GOOD" | "BAD" = "GOOD";
    if (totalDiff <= -100) status = "BEST";
    else if (totalDiff >= 100) status = "BAD";
    else status = "GOOD";

    return {
        cheapestSource: bestMatch.source,
        price: marketPrice,
        status: status,
        diff: diff,

        // [New Fields for UI]
        totalDiff: totalDiff,
        marketUnit: lowerUnit,
        marketUnitPrice: marketPricePerUserUnit, // Return price matching the user's unit (e.g. per kg)
        marketTotalForUserAmount: marketTotalForUserAmount,

        link: bestMatch.link,
        cheapestLink: bestMatch.link,
        marketDataRaw: bestMatch,
        candidates: marketDataList.map(c => {
            // Pre-calculate unit price for each candidate to simplify client-side switching
            let cUnitPrice = c.price;
            if (c.parsedAmount && c.parsedAmount > 0) {
                cUnitPrice = c.price / c.parsedAmount;
                if (c.parsedUnit === 'kg' || c.parsedUnit === 'l') {
                    cUnitPrice = cUnitPrice / 1000;
                }
            } else if (matchType === 'specific' && amount > 0) {
                const isSuspiciouslyLow = c.price < (userUnitPrice * amount * 0.3);
                if (isSuspiciouslyLow) cUnitPrice = c.price;
                else cUnitPrice = c.price / amount;

                if (lowerUnit === 'kg' || lowerUnit === 'l') {
                    cUnitPrice = cUnitPrice / 1000;
                }
            }
            return {
                ...c,
                perUnitPrice: cUnitPrice
            };
        })
    };
};

/**
 * Generates a human-friendly AI business report based on processed market analysis data.
 * Used in both API routes and client-side real-time updates.
 */
export const generateBusinessReport = (items: any[]) => {
    const businessReport: string[] = [];
    let totalSavings = 0;
    let totalLoss = 0;
    let analyzedSpend = 0;
    let analyzedCount = 0;

    items.forEach((item) => {
        const analysis = item.marketAnalysis;
        if (analysis) {
            analyzedSpend += (item.originalPrice || item.price);
            analyzedCount++;

            if (analysis.totalDiff !== undefined) {
                const diff = Math.round(analysis.totalDiff);
                const isLoss = diff > 0;
                const costDiff = Math.abs(diff).toLocaleString();
                const amountCtx = item.amount && item.unit ? `${item.amount}${item.unit} 기준` : '구매량 기준';

                if (Math.abs(diff) > 100) {
                    if (isLoss) {
                        businessReport.push(`🔴 ${item.name}: 시장가보다 ${costDiff}원 더 비싸게 구매하셨어요. (${amountCtx})`);
                        totalLoss += diff;
                    } else if (Math.abs(diff) > 5000 || (item.originalPrice > 0 && Math.abs(diff) / item.originalPrice > 0.2)) {
                        businessReport.push(`💎 ${item.name}: 시장가보다 무려 ${costDiff}원이나 저렴하게 득템하셨네요! (${amountCtx})`);
                        totalSavings += Math.abs(diff);
                    } else {
                        businessReport.push(`🔵 ${item.name}: 시장가보다 ${costDiff}원 저렴하게 잘 구매하셨어요. (${amountCtx})`);
                        totalSavings += Math.abs(diff);
                    }
                } else {
                    if (diff > 0) totalLoss += diff;
                    else totalSavings += Math.abs(diff);
                }
            }
        }
    });

    const finalReport: string[] = [];
    const netSavings = totalSavings - totalLoss;
    const percentage = analyzedSpend > 0 ? (Math.abs(netSavings) / analyzedSpend) * 100 : 0;
    const monthlyProjection = Math.abs(netSavings) * 4;

    if (analyzedCount === 0) {
        finalReport.push(`❓ 분석 가능한 식자재가 없습니다. (시장 데이터 부족)`);
        finalReport.push(`직접 단가를 입력하여 정확한 분석을 받아보세요.`);
    } else if (netSavings > 0) {
        finalReport.push(`🔵 사장님! 이번 장보기로 ${Math.round(netSavings).toLocaleString()}원을 아끼셨네요!`);
        finalReport.push(`평균가 대비 약 ${percentage.toFixed(1)}% 저렴하며, 한 달이면 약 ${Math.round(monthlyProjection).toLocaleString()}원을 절약하실 수 있어요.`);
    } else if (netSavings < 0) {
        finalReport.push(`🔴 사장님! 이번엔 평소보다 ${Math.round(Math.abs(netSavings)).toLocaleString()}원 더 지출하셨어요.`);
        finalReport.push(`평균가 대비 약 ${percentage.toFixed(1)}% 비싸며, 최저가 구매 시 한 달에 약 ${Math.round(monthlyProjection).toLocaleString()}원을 아낄 수 있어요!`);
    } else {
        finalReport.push(`🟠 합리적인 소비를 하셨군요! 시장 평균 가격과 비슷합니다.`);
    }

    finalReport.push(...businessReport);
    finalReport.push(`(기준 : 주요 온라인몰 및 식자재 플랫폼 평균 단가 비교)`);

    return finalReport;
};
