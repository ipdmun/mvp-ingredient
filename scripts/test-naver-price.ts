
import { getMarketAnalysis, fetchNaverPrice } from '../app/lib/naver.ts';
import 'dotenv/config';

async function testNaverPrice() {
    console.log("Testing Naver Price Search for '감자'...");
    console.log("NAVER_CLIENT_ID exists:", !!process.env.NAVER_CLIENT_ID);
    console.log("NAVER_CLIENT_SECRET exists:", !!process.env.NAVER_CLIENT_SECRET);

    // 1. Test fetchNaverPrice directly
    const query = "감자";
    console.log(`\n--- Fetching Price for '${query}' ---`);
    const results = await fetchNaverPrice(query);

    if (results) {
        console.log(`Found ${results.length} items.`);
        results.forEach((item, index) => {
            console.log(`[${index + 1}] ${item.source} - ${item.price}원 - ${item.link}`);
        });
    } else {
        console.log("No results found (fetchNaverPrice returned null).");
    }

    // 2. Test getMarketAnalysis
    console.log(`\n--- Market Analysis for '${query}' ---`);
    const analysis = await getMarketAnalysis(query, 2000, 'g', 100); // Dummy user price
    console.log("Analysis Result:", analysis);
}

testNaverPrice();
