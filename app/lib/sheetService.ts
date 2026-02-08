
const CSV_URL = "https://docs.google.com/spreadsheets/d/1h3D23gIZrB11MVEfPIN9ii-44EE19u0-IP51epRENpc/export?format=csv";

interface SheetIngredient {
    name: string;
    amount: number;
    unit: string; // Default 'g'
}

interface SheetRecipe {
    id: string;
    name: string;
    ingredients: SheetIngredient[];
}

// In-memory cache: ID -> Recipe
let recipeCache: Record<string, SheetRecipe> | null = null;
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

export async function fetchSheetData(): Promise<Record<string, SheetRecipe>> {
    const now = Date.now();
    if (recipeCache && (now - lastFetchTime < CACHE_TTL)) {
        return recipeCache;
    }

    console.log("[SheetService] Fetching CSV...");
    try {
        const response = await fetch(CSV_URL, { next: { revalidate: 3600 } });
        if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);

        const csvText = await response.text();
        const rows = parseCSV(csvText);

        const recipes: Record<string, SheetRecipe> = {};

        // Col 0: Dish ID
        // Col 1: Dish Name
        // Col 3: Ingredient Name
        // Col 5: Amount

        for (const row of rows) {
            if (row.length < 6) continue;

            const dishId = row[0];
            const dishName = row[1];
            const ingName = row[3];
            const amountStr = row[5];

            if (!dishId || !dishName || !ingName || !amountStr) continue;
            if (dishId === 'Dish Name' || dishName === 'MENU_NM') continue;

            const cleanId = dishId.trim();
            const cleanDish = dishName.replace(/^"|"$/g, '').trim();
            const cleanIng = ingName.replace(/^"|"$/g, '').trim();
            const amount = parseFloat(amountStr);

            if (isNaN(amount) || amount <= 0) continue;

            if (!recipes[cleanId]) {
                recipes[cleanId] = {
                    id: cleanId,
                    name: cleanDish,
                    ingredients: []
                };
            }

            // Sync name if changed (sometimes same ID has varying names? Unlikely, but use latest)
            // recipes[cleanId].name = cleanDish; 

            recipes[cleanId].ingredients.push({
                name: cleanIng,
                amount: amount,
                unit: 'g'
            });
        }

        console.log(`[SheetService] Parsed ${Object.keys(recipes).length} unique recipes (by ID).`);
        recipeCache = recipes;
        lastFetchTime = now;
        return recipes;
    } catch (error) {
        console.error("[SheetService] Error:", error);
        return recipeCache || {};
    }
}

export async function findRecipeInSheet(queryName: string): Promise<{ name: string, ingredients: SheetIngredient[] } | null> {
    const recipesMap = await fetchSheetData();
    const recipes = Object.values(recipesMap);
    const query = queryName.replace(/\s+/g, "").toLowerCase();

    // Strategy:
    // 1. Find all recipes matching the name (Exact or Fuzzy).
    // 2. Sort candidates by ingredient count (Descending).
    // 3. Return the one with most ingredients.

    // Filter candidates
    const candidates = recipes.filter(r => {
        const rName = r.name.replace(/\s+/g, "").toLowerCase();
        return rName === query || rName.includes(query) || query.includes(rName);
    });

    if (candidates.length === 0) return null;

    // Sort by ingredient count desc
    candidates.sort((a, b) => b.ingredients.length - a.ingredients.length);

    const best = candidates[0];
    console.log(`[SheetService] Query "${queryName}" matched ${candidates.length} recipes. Selected "${best.name}" (ID: ${best.id}) with ${best.ingredients.length} ingredients.`);

    return { name: best.name, ingredients: best.ingredients };
}
