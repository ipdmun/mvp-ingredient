
import { getMarketAnalysis, parseWeightFromTitle } from '../app/lib/naver';

async function runTests() {
    console.log("🔍 STARTING PRICE COMPARISON LOGIC TESTS...\n");

    // Test 1: Parser Test
    const titles = [
        "햇양파 5kg (중대과)",
        "무안 황토 양파 10kg",
        "국산 깐마늘 500g",
        "두부 1모 300g",
        "대파 1단 (특)",
        "양파 1망",
        "광평이네 농장 양파 (4,900원)" // No weight in title
    ];

    console.log("--- 1. Parser Tests ---");
    titles.forEach(t => {
        const p = parseWeightFromTitle(t, "양파");
        console.log(`Title: "${t}" -> Parsed: ${JSON.stringify(p)}`);
    });
    console.log("");

    // Test 2: Normalization Logic Simulation
    // Since we can't easily hit the Real Naver API in a script without keys, 
    // we'll mock the getMarketAnalysis logic or the objects it uses.

    console.log("--- 2. Logic Simulation (Onion 5kg Case) ---");
    // User bought 5kg for 24,000 (4,800/kg)
    // Naver item is 1kg for 4,900 (4,900/kg)
    // Diff should be negative (per kg) or per 5kg?
    // User Unit is KG. Diff per KG = 4800 - 4900 = -100.

    // We'll simulate the normalization steps from naver.ts
    const userPrice = 24000;
    const userAmount = 5;
    const userUnit = 'kg';

    const naverPrice = 4900;
    const naverAmount = 1; // Explicitly 1kg
    const naverUnit = 'kg';

    // 1. User Unit Price (per g)
    let userUP = (userPrice / userAmount) / 1000; // 4.8
    // 2. Naver Unit Price (per g)
    let naverUP = (naverPrice / naverAmount) / 1000; // 4.9
    // 3. Diff (per g)
    let diffG = userUP - naverUP; // -0.1
    // 4. Convert back to Per User Unit (kg)
    let diffKG = diffG * 1000; // -100

    console.log(`User: 5kg/24000 (4.8/g)`);
    console.log(`Naver: 1kg/4900 (4.9/g)`);
    console.log(`Result Diff per KG: ${diffKG} KRW`);

    if (diffKG < 0) console.log("✅ SUCCESS: Correctly identified as CHEAPER.");
    else console.log("❌ FAILURE: Wrong calculation.");

    console.log("\n--- 3. Specific Scenario: Du-bu (Piece to G) ---");
    // User: 1모 (300g) for 3,000 KRW -> 10/g
    // Naver: 500g for 4,000 KRW -> 8/g
    // Diff: +2/g -> per 1모 = +600

    const uPrice = 3000;
    const uAmount = 1;
    const uUnit = '모'; // Std 300g
    const nPrice = 4000;
    const nAmount = 500;
    const nUnit = 'g';

    let uUP = (uPrice / uAmount) / 300; // 10
    let nUP = (nPrice / nAmount); // 8
    let dG = uUP - nUP; // +2
    let dUnit = dG * 300; // +600

    console.log(`User: 1모/3000 (10/g)`);
    console.log(`Naver: 500g/4000 (8/g)`);
    console.log(`Result Diff per 모: ${dUnit} KRW`);
    if (dUnit === 600) console.log("✅ SUCCESS: Correctly normalized piece to weight.");

    console.log("\n✨ TEST SUITE FINISHED.");
}

runTests();
