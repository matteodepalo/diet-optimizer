// Helper functions to load and transform data from JSON
import { readFileSync } from "fs";
import {
  Nutrient,
  Ingredient,
  IngredientNutrient,
  Meal,
} from "./dietOptimizer";

interface JsonNutrient {
  name: string;
  nrv: number;
  unit: string;
}

interface JsonIngredient {
  name: string;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  nutrientsPercentages: { [key: string]: number };
}

interface JsonMeal {
  name: string;
  kcalPercentage: number;
}

interface JsonData {
  nutrients: JsonNutrient[];
  ingredients: JsonIngredient[];
  meals: JsonMeal[];
}

/**
 * Load data from JSON file and transform it to the format expected by the diet optimizer
 * @param filePath Path to the JSON file
 * @returns Object containing nutrients, ingredients, and meals in the correct format
 */
export function loadDataFromJson(filePath: string): {
  nutrients: Nutrient[];
  ingredients: Ingredient[];
  meals: Meal[];
} {
  // Read and parse JSON file
  const jsonContent = readFileSync(filePath, "utf-8");
  const data: JsonData = JSON.parse(jsonContent);

  // Transform nutrients (already in correct format)
  const nutrients: Nutrient[] = data.nutrients;

  // Create a map for quick nutrient lookup
  const nutrientMap = new Map<string, Nutrient>();
  nutrients.forEach((nutrient) => {
    nutrientMap.set(nutrient.name, nutrient);
  });

  // Transform ingredients
  const ingredients: Ingredient[] = data.ingredients.map((jsonIngredient) => {
    // Convert nutrient percentages to actual amounts
    const ingredientNutrients: IngredientNutrient[] = [];

    for (const [nutrientName, percentage] of Object.entries(
      jsonIngredient.nutrientsPercentages
    )) {
      const nutrient = nutrientMap.get(nutrientName);
      if (nutrient) {
        // Convert percentage of NRV to actual amount per 100g
        const amount = (percentage / 100) * nutrient.nrv;
        ingredientNutrients.push({
          nutrient,
          amount,
        });
      }
    }

    return {
      name: jsonIngredient.name,
      macros: jsonIngredient.macros,
      nutrients: ingredientNutrients,
    };
  });

  // Transform meals (already in correct format)
  const meals: Meal[] = data.meals;

  return {
    nutrients,
    ingredients,
    meals,
  };
}

/**
 * Example of how to load supplemental ingredients if needed
 * Note: Supplements are defined per serving (e.g., 1 tablet = 1g)
 * The algorithm will determine optimal amounts
 */
export function createSupplementIngredients(
  nutrients: Nutrient[]
): Ingredient[] {
  const supplements: Ingredient[] = [];

  // Example: Multivitamin supplement (per 1g serving/tablet)
  // Provides 50% of NRV for most vitamins to avoid over-supplementation
  const multivitamin: Ingredient = {
    name: "Multivitamin Supplement",
    macros: { protein: 0, carbs: 0.5, fat: 0 }, // Small amount of carbs from tablet fillers
    nutrients: [
      { nutrient: nutrients.find((n) => n.name === "Vitamin A")!, amount: 400 }, // 50% NRV
      { nutrient: nutrients.find((n) => n.name === "Vitamin C")!, amount: 40 }, // 50% NRV
      { nutrient: nutrients.find((n) => n.name === "Vitamin D")!, amount: 2.5 }, // 50% NRV
      { nutrient: nutrients.find((n) => n.name === "Vitamin E")!, amount: 6 }, // 50% NRV
      {
        nutrient: nutrients.find((n) => n.name === "Thiamine (B1)")!,
        amount: 0.55, // 50% NRV
      },
      {
        nutrient: nutrients.find((n) => n.name === "Riboflavin (B2)")!,
        amount: 0.7, // 50% NRV
      },
      {
        nutrient: nutrients.find((n) => n.name === "Niacin (B3)")!,
        amount: 8, // 50% NRV
      },
      {
        nutrient: nutrients.find((n) => n.name === "Vitamin B6")!,
        amount: 0.7, // 50% NRV
      },
      { nutrient: nutrients.find((n) => n.name === "Folate")!, amount: 100 }, // 50% NRV
      {
        nutrient: nutrients.find((n) => n.name === "Vitamin B12")!,
        amount: 1.25, // 50% NRV
      },
      { nutrient: nutrients.find((n) => n.name === "Zinc")!, amount: 5 }, // 50% NRV
      { nutrient: nutrients.find((n) => n.name === "Iodine")!, amount: 75 }, // 50% NRV
    ].filter((n) => n.nutrient), // Filter out any undefined nutrients
  };

  // Example: Omega-3 supplement (per 1g capsule)
  // Typical fish oil capsule provides 300mg EPA+DHA
  const omega3: Ingredient = {
    name: "Omega-3 Supplement (Fish Oil)",
    macros: { protein: 0, carbs: 0, fat: 1 }, // 1g fat per capsule
    nutrients: [
      {
        nutrient: nutrients.find((n) => n.name === "Omega-3 fatty acids")!,
        amount: 300, // 300mg omega-3 per 1g capsule (120% NRV)
      },
    ].filter((n) => n.nutrient),
  };

  // Example: Vitamin D supplement (for winter months or low sun exposure)
  // High-dose vitamin D3 supplement
  const vitaminD: Ingredient = {
    name: "Vitamin D3 Supplement",
    macros: { protein: 0, carbs: 0.1, fat: 0 }, // Tiny amount from tablet
    nutrients: [
      { nutrient: nutrients.find((n) => n.name === "Vitamin D")!, amount: 25 }, // 25μg = 1000 IU (500% NRV)
    ].filter((n) => n.nutrient),
  };

  supplements.push(multivitamin, omega3, vitaminD);

  return supplements.filter((s) => s.nutrients.length > 0);
}

/**
 * Example usage
 */
if (require.main === module) {
  // Load data from JSON
  const { nutrients, ingredients, meals } =
    loadDataFromJson("./sample-data.json");

  console.log(`Loaded ${nutrients.length} nutrients`);
  console.log(`Loaded ${ingredients.length} ingredients`);
  console.log(`Loaded ${meals.length} meals`);

  // Optionally add supplements
  const supplements = createSupplementIngredients(nutrients);
  const allIngredients = [...ingredients, ...supplements];

  console.log(`Added ${supplements.length} supplement options`);
  console.log(`Total ingredients available: ${allIngredients.length}`);

  // Show sample ingredient details
  console.log("\nSample ingredient (Salmon):");
  const salmon = ingredients.find((i) => i.name.includes("Salmon"));
  if (salmon) {
    console.log(`Name: ${salmon.name}`);
    console.log(`Macros: ${JSON.stringify(salmon.macros)}`);
    console.log("Nutrients:");
    salmon.nutrients.forEach((n) => {
      console.log(
        `  - ${n.nutrient.name}: ${n.amount.toFixed(2)}${n.nutrient.unit}`
      );
    });
  }
}
