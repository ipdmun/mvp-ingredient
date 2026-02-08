
import { config } from "dotenv";
config();

import { fetchNaverPrice, getMarketAnalysis } from "../app/lib/naver";

async function main() {
    console.log("-----------------------------------------");
    console.log("🧅 Onion Price Check (Naver Shopping API)");
    console.log("-----------------------------------------");

    const terms = [
        "양파",
        "양파 1kg",
        "양파 1.5kg",
        "양파 3kg",
        "양파 5kg",
        "양파 10kg",
        "양파 15kg",
        "양파 20kg",
        "양파 1망"
    ];

    for (const term of terms) {
        console.log(`\n🔍 Searching: "${term}"`);
        const result = await fetchNaverPrice(term);
        if (result) {
            console.log(`✅ Found: ${result.price.toLocaleString()}원`);
            console.log(`   Source: ${result.source}`);
            console.log(`   Link: ${result.link}`);
        } else {
            console.log("❌ No result found.");
        }
    }

    console.log("\n-----------------------------------------");
    console.log("📊 Comparison Logic Test");
    console.log("-----------------------------------------");

    // Test Case: User bought 15kg Onion for 20,000 KRW (1,333/kg)
    // We expect the system to find "Onion 15kg" and compare correctly.
    const testCases = [
        { name: "양파", amount: 15, unit: "kg", price: 20000 }, // Expensive check? Or Cheap compared to 15kg?
        { name: "양파", amount: 1, unit: "kg", price: 3000 },   // Cheap check?
    ];

    for (const test of testCases) {
        console.log(`\n🧪 Testing: ${test.name} ${test.amount}${test.unit} @ ${test.price.toLocaleString()}원 (Total)`);
        // Note: getMarketAnalysis currently expects 'price' to be the UNIT PRICE if calling for analysis?
        // Wait, app/api/ocr/route.ts passes UNIT PRICE.
        // Let's modify the test to pass UNIT PRICE as per current code.
        const unitPrice = test.price / test.amount;
        console.log(`   -> Calculated Unit Price passed to func: ${Math.round(unitPrice)}원`);

        const analysis = await getMarketAnalysis(test.name, unitPrice, test.unit, test.amount);
        if (analysis) {
            console.log(`   -> Market Price Found: ${analysis.price.toLocaleString()}원`);
            console.log(`   -> Diff: ${analysis.diff.toLocaleString()}원`);
            console.log(`   -> Status: ${analysis.status}`);
        } else {
            console.log("   -> Analysis Failed (No Data)");
        }
    }
}

main();
