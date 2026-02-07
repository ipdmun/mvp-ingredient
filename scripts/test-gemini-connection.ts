
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

// Load env vars
dotenv.config();

async function testGemini() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        console.error("❌ GOOGLE_API_KEY is missing from environment variables.");
        console.log("Usage: $env:GOOGLE_API_KEY='AIza...'; npx tsx scripts/test-gemini-connection.ts");
        process.exit(1);
    }

    console.log(`🔑 Testing API Key: ${apiKey.substring(0, 5)}...****** (Length: ${apiKey.length})`);

    // Explicitly trim
    const genAI = new GoogleGenerativeAI(apiKey.trim());

    const modelsToTest = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];

    console.log("\n📡 Testing Model Connectivity...");

    for (const modelName of modelsToTest) {
        try {
            console.log(`\nTesting ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello, are you working?");
            console.log(`✅ [${modelName}] Success! Response: ${result.response.text()}`);
        } catch (error: any) {
            console.error(`❌ [${modelName}] Failed: ${error.message}`);
        }
    }
}

testGemini();
