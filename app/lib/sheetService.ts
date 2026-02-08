
const CSV_URL = "https://docs.google.com/spreadsheets/d/1h3D23gIZrB11MVEfPIN9ii-44EE19u0-IP51epRENpc/export?format=csv";

interface SheetIngredient {
    name: string;
    amount: number;
    unit: string; // Default 'g'
}

// In-memory cache
let recipeCache: Record<string, SheetIngredient[]> | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

// Simple CSV Parser handling quoted fields
function parseCSV(text: string): string[][] {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let insideQuote = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {
            if (insideQuote && nextChar === '"') {
                currentField += '"';
                i++; // Skip escaped quote
            } else {
                insideQuote = !insideQuote;
            }
        } else if (char === ',' && !insideQuote) {
            currentRow.push(currentField.trim());
            currentField = '';
        } else if ((char === '\r' || char === '\n') && !insideQuote) {
            if (char === '\r' && nextChar === '\n') i++;
            currentRow.push(currentField.trim());
            rows.push(currentRow);
            currentRow = [];
            currentField = '';
        } else {
            currentField += char;
        }
    }
    if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
    }
    return rows;
}

export async function fetchSheetData(): Promise<Record<string, SheetIngredient[]>> {
    const now = Date.now();
    if (recipeCache && (now - lastFetchTime < CACHE_TTL)) {
        return recipeCache;
    }

    console.log("[SheetService] Fetching CSV...");
    try {
        const response = await fetch(CSV_URL, { next: { revalidate: 3600 } }); // Next.js caching
        if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);

        // Handle redirects if fetch doesn't automatically (native fetch usually does)
        // If Google Sheets returns 307, fetch follows automatically.

        const csvText = await response.text();
        const rows = parseCSV(csvText);

        const recipes: Record<string, SheetIngredient[]> = {};

        // Indexes based on observation:
        // Col 1: Dish Name
        // Col 3: Ingredient Name
        // Col 5: Amount

        for (const row of rows) {
            if (row.length < 6) continue; // Skip malformed

            const dishName = row[1];
            const ingName = row[3];
            const amountStr = row[5];

            if (!dishName || !ingName || !amountStr) continue;
            if (dishName === 'Dish Name' || dishName === 'MENU_NM') continue; // Skip header if strictly text

            // Cleanup quotes if parser didn't
            const cleanDish = dishName.replace(/^"|"$/g, '').trim();
            const cleanIng = ingName.replace(/^"|"$/g, '').trim();
            const amount = parseFloat(amountStr);

            if (isNaN(amount) || amount <= 0) continue;

            if (!recipes[cleanDish]) {
                recipes[cleanDish] = [];
            }

            recipes[cleanDish].push({
                name: cleanIng,
                amount: amount,
                unit: 'g' // Default unit for this sheet
            });
        }

        console.log(`[SheetService] Parsed ${Object.keys(recipes).length} recipes.`);
        recipeCache = recipes;
        lastFetchTime = now;
        return recipes;
    } catch (error) {
        console.error("[SheetService] Error:", error);
        return recipeCache || {}; // Fallback to cache or empty
    }
}

export async function findRecipeInSheet(queryName: string): Promise<{ name: string, ingredients: SheetIngredient[] } | null> {
    const recipes = await fetchSheetData();
    const query = queryName.replace(/\s+/g, "").toLowerCase();

    // 1. Exact Match
    if (recipes[queryName]) return { name: queryName, ingredients: recipes[queryName] };

    // 2. Fuzzy Match
    const recipeNames = Object.keys(recipes);
    // Find shortest name that contains query or is contained by query
    // Prefer "exact word" match if possible?
    // Given "회냉면", match "회냉면(홍어)"? Yes. Must contain.

    // Check if query is contained in key (e.g. query "Bibimbap" in "Jeonju Bibimbap")
    let bestMatch = recipeNames.find(k => {
        const kClean = k.replace(/\s+/g, "").toLowerCase();
        return kClean === query;
    });

    if (!bestMatch) {
        bestMatch = recipeNames.find(k => {
            const kClean = k.replace(/\s+/g, "").toLowerCase();
            return kClean.includes(query) || query.includes(kClean);
        });
    }

    if (bestMatch) {
        return { name: bestMatch, ingredients: recipes[bestMatch] };
    }

    return null;
}
