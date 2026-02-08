import { config } from "dotenv";
config();

import { fetchNaverPrice } from "../app/lib/naver";

// Extended Debug Function for fetchNaverPrice
// Copying relevant logic to a standalone function for debugging
async function debugNaverPrice(queryName: string) {
    const naverClientId = process.env.NAVER_CLIENT_ID;
    const naverClientSecret = process.env.NAVER_CLIENT_SECRET;

    if (!naverClientId || !naverClientSecret) {
        console.error("❌ Missing Naver API Keys");
        return;
    }

    console.log(`\n🔍 Searching for: "${queryName}"`);

    const EXCLUDED_KEYWORDS = [
        "기계", "이절기", "다듬기", "씨앗", "모종", "비료", "화분", "농약", "제초제", "절단기", "호미", "삽",
        "메이커", "제조기", "슬라이서", "채칼", "거치대", "받침대", "모형", "장난감", "껍질", "세척기", "탈피기",
        "과자", "스낵", "칩", "안주", "말랭이", "젤리", "사탕", "초콜릿", "쫀드기", "쫄면", "떡볶이", "빵", "케이크", "쿠키",
        "분말", "가루", "파우더", "엑기스", "농축", "즙", "청", "오일", "향", "맛", "시럽",
        "소스", "양념", "드레싱", "시즈닝",
        "추억", "간식", "주전부리", "답례품", "선물세트", "홍보", "판촉", "인쇄", "스티커",
        "곤약", "실곤약", "면", "누들", "국수", "다이어트", "체중",
        "양파망", "빈병", "공병", "빈박스", "공박스", "용기", "케이스", "바구니", "봉투", "비닐", "포장지", "박스만", "트레이", "자루", "그물",
        "마스크", "우드", "팬시", "문구", "완구", "교구", "학습", "교재", "MDF", "부자재", "만들기", "장식", "가짜", "모형", "사료", "키링", "열쇠고리",
        "덮밥", "볶음밥", "컵밥", "도시락", "무침", "반찬", "절임", "장아찌", "튀김", "밀키트", "쿠킹박스", "짜사이", "자차이", "가공", "완제"
    ];

    try {
        const query = encodeURIComponent(queryName);
        const apiRes = await fetch(`https://openapi.naver.com/v1/search/shop.json?query=${query}&display=40&start=1&sort=asc`, {
            headers: {
                "X-Naver-Client-Id": naverClientId,
                "X-Naver-Client-Secret": naverClientSecret
            }
        });

        if (!apiRes.ok) {
            console.error("❌ API Error:", apiRes.status, await apiRes.text());
            return;
        }

        const data = await apiRes.json();
        console.log(`📊 Total Results Found: ${data.total}, Display: ${data.display}`);

        if (data.items && data.items.length > 0) {
            let passedCount = 0;
            for (const item of data.items) {
                const title = item.title.replace(/<[^>]*>?/gm, ''); // Strip HTML tags
                const titleLower = title.toLowerCase();
                const categories = [item.category1, item.category2, item.category3, item.category4].filter(Boolean).join(" ");
                const price = parseInt(item.lprice, 10);

                console.log(`\n📦 Item: [${title}] (${price} krw)`);
                console.log(`   📂 Cats: ${categories}`);

                // 1. Minimum Price Check
                if (price < 100) {
                    console.log(`   ⛔ REJECTED: Price too low (<100)`);
                    continue;
                }

                // 2. Keyword Exclusion
                const excluded = EXCLUDED_KEYWORDS.find(keyword => titleLower.includes(keyword));
                if (excluded) {
                    console.log(`   ⛔ REJECTED: Excluded Keyword "${excluded}"`);
                    continue;
                }

                // 3. Strict Category Check
                const validCategory1 = ["식품", "출산/육아", "농산물", "축산물", "수산물"];
                const isFoodCategory = validCategory1.some(cat => item.category1.includes(cat));

                // Also check Negative Categories
                const EXCLUDED_CATEGORIES = ["주방용품", "수납", "정리", "원예", "자재", "비료", "농기구", "식기", "그릇", "냄비", "조리도구", "포장", "용기", "잡화", "문구", "완구", "교구", "서적", "출산", "육아", "취미", "반려동물", "공구", "산업"];
                const isBadCategory = EXCLUDED_CATEGORIES.some(badCat => categories.includes(badCat));

                if (isBadCategory) {
                    console.log(`   ⛔ REJECTED: Negative Category Match "${categories}"`); // Might catch "Baby Food" if "Baby" excluded? "출산/육아" excluded? Wait.
                    continue;
                }

                if (!isFoodCategory) {
                    console.log(`   ⛔ REJECTED: Not a Food Category1 (Found: ${item.category1})`);
                    continue;
                }

                // 4. Title Match Check
                const queryParts = queryName.toLowerCase().split(/\s+/).filter(Boolean);
                const allKeywordsMatch = queryParts.every(part => titleLower.includes(part));

                if (!allKeywordsMatch) {
                    console.log(`   ⛔ REJECTED: Title Missing Keywords (Required: ${queryParts.join(", ")})`);
                    continue;
                }

                console.log(`   ✅ ACCEPTED!`);
                passedCount++;
                break; // Stop after first match (as per real logic)
            }

            if (passedCount === 0) {
                console.log(`\n❌ PRE-FILTERED ALL 40 ITEMS. No valid item found.`);
            }
        } else {
            console.log(`\n❌ No items returned from API.`);
        }

    } catch (error) {
        console.error("Script Error:", error);
    }
}

async function run() {
    await debugNaverPrice("무");
    await debugNaverPrice("무 15kg");
}

run();
