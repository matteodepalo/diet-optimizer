// Example of using the diet optimizer with data loaded from JSON
import { getDiet } from "./dietOptimizer";
import { loadDataFromJson, createSupplementIngredients } from "./loadData";

// Load data from JSON file
const { nutrients, ingredients, meals } =
  loadDataFromJson("./sample-data.json");

// Optionally add supplements
const supplements = createSupplementIngredients(nutrients);
const allIngredients = [...ingredients, ...supplements];

console.log("Diet Optimizer - Dynamic Data Example");
console.log("=====================================");
console.log(`Loaded ${nutrients.length} nutrients`);
console.log(`Loaded ${ingredients.length} ingredients from food`);
console.log(`Added ${supplements.length} supplement options`);
console.log(`Total ingredients available: ${allIngredients.length}`);

// Example 1: Young athlete building muscle
console.log("\n\n=== Example 1: Young Athlete Building Muscle ===");
const athleteDiet = getDiet({
  sex: "male",
  age: 22,
  bodyWeight: 75,
  bodyFatPercentage: 12,
  activityLevel: "very",
  goal: { type: "build-muscle" },
  targetMacros: {
    proteinPercentage: 30,
    carbsPercentage: 45,
    fatPercentage: 25,
  },
  ingredients: allIngredients,
  nutrients: nutrients,
  meals: meals,
});

console.log("\nOptimized Diet Plan:");
let totalCalories = 0;
let totalProtein = 0;
let totalCarbs = 0;
let totalFat = 0;

athleteDiet.meals.forEach((meal) => {
  console.log(
    `\n${meal.meal.name} (${meal.meal.kcalPercentage}% of daily calories):`
  );
  meal.ingredients.forEach((item) => {
    console.log(`  - ${item.ingredient.name}: ${item.amount}g`);
    const factor = item.amount / 100;
    totalProtein += item.ingredient.macros.protein * factor;
    totalCarbs += item.ingredient.macros.carbs * factor;
    totalFat += item.ingredient.macros.fat * factor;
  });
});

totalCalories = totalProtein * 4 + totalCarbs * 4 + totalFat * 9;

console.log("\nDaily Totals:");
console.log(`  Calories: ${Math.round(totalCalories)} kcal`);
console.log(
  `  Protein: ${Math.round(totalProtein)}g (${Math.round(
    ((totalProtein * 4) / totalCalories) * 100
  )}%)`
);
console.log(
  `  Carbs: ${Math.round(totalCarbs)}g (${Math.round(
    ((totalCarbs * 4) / totalCalories) * 100
  )}%)`
);
console.log(
  `  Fat: ${Math.round(totalFat)}g (${Math.round(
    ((totalFat * 9) / totalCalories) * 100
  )}%)`
);

// Calculate nutrient coverage
const nutrientTotals = new Map<string, number>();
athleteDiet.meals.forEach((meal) => {
  meal.ingredients.forEach((item) => {
    const factor = item.amount / 100;
    item.ingredient.nutrients.forEach((nutrientInfo) => {
      const current = nutrientTotals.get(nutrientInfo.nutrient.name) || 0;
      nutrientTotals.set(
        nutrientInfo.nutrient.name,
        current + nutrientInfo.amount * factor
      );
    });
  });
});

console.log("\nNutrient Coverage (% of NRV):");
const sortedNutrients = [...nutrients].sort((a, b) => {
  const aPercentage = ((nutrientTotals.get(a.name) || 0) / a.nrv) * 100;
  const bPercentage = ((nutrientTotals.get(b.name) || 0) / b.nrv) * 100;
  return bPercentage - aPercentage;
});

sortedNutrients.forEach((nutrient) => {
  const consumed = nutrientTotals.get(nutrient.name) || 0;
  const percentage = (consumed / nutrient.nrv) * 100;
  const status = percentage >= 100 ? "✓" : percentage >= 80 ? "~" : "✗";
  console.log(`  ${status} ${nutrient.name}: ${percentage.toFixed(0)}%`);
});

// Example 2: Woman optimizing for longevity (maintenance)
console.log("\n\n=== Example 2: Woman Optimizing for Longevity ===");
const longevityDiet = getDiet({
  sex: "female",
  age: 35,
  bodyWeight: 60,
  bodyFatPercentage: 22,
  activityLevel: "moderate",
  goal: { type: "maintain" },
  targetMacros: {
    proteinPercentage: 25,
    carbsPercentage: 45,
    fatPercentage: 30,
  },
  ingredients: allIngredients,
  nutrients: nutrients,
  meals: meals,
});

console.log("\nOptimized Diet Plan for Longevity:");
longevityDiet.meals.forEach((meal) => {
  console.log(`\n${meal.meal.name}:`);
  meal.ingredients.forEach((item) => {
    console.log(`  - ${item.ingredient.name}: ${item.amount}g`);
  });
});

// Show which ingredients were selected most frequently
console.log("\n\n=== Ingredient Analysis ===");
const ingredientCounts = new Map<string, number>();
const ingredientAmounts = new Map<string, number>();

[athleteDiet, longevityDiet].forEach((diet) => {
  diet.meals.forEach((meal) => {
    meal.ingredients.forEach((item) => {
      ingredientCounts.set(
        item.ingredient.name,
        (ingredientCounts.get(item.ingredient.name) || 0) + 1
      );
      ingredientAmounts.set(
        item.ingredient.name,
        (ingredientAmounts.get(item.ingredient.name) || 0) + item.amount
      );
    });
  });
});

console.log("\nMost frequently selected ingredients:");
const sortedIngredients = Array.from(ingredientCounts.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

sortedIngredients.forEach(([name, count]) => {
  const avgAmount = Math.round(ingredientAmounts.get(name)! / count);
  console.log(
    `  ${name}: selected ${count} times (avg ${avgAmount}g per serving)`
  );
});

console.log(
  "\n\nNote: This algorithm prioritizes nutrient density and meeting 100% of NRVs."
);
console.log(
  "The selected foods are those that best fulfill nutritional requirements"
);
console.log("while matching the target macronutrient ratios.");
