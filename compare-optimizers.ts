// Compare Greedy vs Linear Programming Diet Optimizers
import { getDiet as getDietGreedy } from "./dietOptimizer";
import { getDiet as getDietLP } from "./dietOptimizerLPSimple";
import { loadDataFromJson, createSupplementIngredients } from "./loadData";

// Helper to calculate total macros and calories
function calculateDietStats(diet: any) {
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  const nutrientTotals = new Map<string, number>();

  diet.meals.forEach((meal: any) => {
    meal.ingredients.forEach((item: any) => {
      const factor = item.amount / 100;
      totalProtein += item.ingredient.macros.protein * factor;
      totalCarbs += item.ingredient.macros.carbs * factor;
      totalFat += item.ingredient.macros.fat * factor;

      // Track nutrients
      item.ingredient.nutrients.forEach((nutrientInfo: any) => {
        const current = nutrientTotals.get(nutrientInfo.nutrient.name) || 0;
        nutrientTotals.set(
          nutrientInfo.nutrient.name,
          current + nutrientInfo.amount * factor
        );
      });
    });
  });

  const totalCalories = totalProtein * 4 + totalCarbs * 4 + totalFat * 9;

  return {
    calories: totalCalories,
    protein: totalProtein,
    carbs: totalCarbs,
    fat: totalFat,
    proteinPercentage: ((totalProtein * 4) / totalCalories) * 100,
    carbsPercentage: ((totalCarbs * 4) / totalCalories) * 100,
    fatPercentage: ((totalFat * 9) / totalCalories) * 100,
    nutrientTotals,
  };
}

// Count ingredients and total amount
function countIngredients(diet: any) {
  const ingredientCounts = new Map<string, number>();
  let totalAmount = 0;

  diet.meals.forEach((meal: any) => {
    meal.ingredients.forEach((item: any) => {
      const current = ingredientCounts.get(item.ingredient.name) || 0;
      ingredientCounts.set(item.ingredient.name, current + item.amount);
      totalAmount += item.amount;
    });
  });

  return {
    uniqueIngredients: ingredientCounts.size,
    totalAmount,
    ingredients: Array.from(ingredientCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10),
  };
}

// Main comparison
async function compareOptimizers() {
  console.log(
    "=== Diet Optimizer Comparison: Greedy vs Linear Programming ===\n"
  );

  // Load data
  const { nutrients, ingredients, meals } =
    loadDataFromJson("./sample-data.json");
  const supplements = createSupplementIngredients(nutrients);
  const allIngredients = [...ingredients, ...supplements];

  // Test case: Build muscle for active male
  const testInput = {
    sex: "male" as const,
    age: 25,
    bodyWeight: 75,
    bodyFatPercentage: 15,
    activityLevel: "moderate" as const,
    goal: { type: "build-muscle" as const },
    targetMacros: {
      proteinPercentage: 30,
      carbsPercentage: 45,
      fatPercentage: 25,
    },
    ingredients: allIngredients,
    nutrients: nutrients,
    meals: meals,
  };

  console.log(
    "Test Case: 25-year-old male, 75kg, 15% body fat, moderate activity"
  );
  console.log("Goal: Build muscle");
  console.log("Target Macros: 30% protein, 45% carbs, 25% fat\n");

  // Run both optimizers
  console.log("Running greedy optimizer...");
  const startGreedy = Date.now();
  const dietGreedy = getDietGreedy(testInput);
  const timeGreedy = Date.now() - startGreedy;

  console.log("Running linear programming optimizer...");
  const startLP = Date.now();
  const dietLP = getDietLP(testInput);
  const timeLP = Date.now() - startLP;

  // Analyze results
  const statsGreedy = calculateDietStats(dietGreedy);
  const statsLP = calculateDietStats(dietLP);

  const ingredientsGreedy = countIngredients(dietGreedy);
  const ingredientsLP = countIngredients(dietLP);

  // Display comparison
  console.log("\n=== RESULTS COMPARISON ===\n");

  console.log("PERFORMANCE:");
  console.log(`Greedy Algorithm: ${timeGreedy}ms`);
  console.log(`Linear Programming: ${timeLP}ms`);
  console.log(`LP is ${(timeLP / timeGreedy).toFixed(1)}x slower\n`);

  console.log("CALORIES & MACROS:");
  console.log("                  Greedy        LP");
  console.log(
    `Calories:         ${statsGreedy.calories
      .toFixed(0)
      .padEnd(12)} ${statsLP.calories.toFixed(0)}`
  );
  console.log(
    `Protein (g):      ${statsGreedy.protein
      .toFixed(0)
      .padEnd(12)} ${statsLP.protein.toFixed(0)}`
  );
  console.log(
    `Carbs (g):        ${statsGreedy.carbs
      .toFixed(0)
      .padEnd(12)} ${statsLP.carbs.toFixed(0)}`
  );
  console.log(
    `Fat (g):          ${statsGreedy.fat
      .toFixed(0)
      .padEnd(12)} ${statsLP.fat.toFixed(0)}`
  );
  console.log(
    `Protein %:        ${statsGreedy.proteinPercentage
      .toFixed(1)
      .padEnd(12)} ${statsLP.proteinPercentage.toFixed(1)}`
  );
  console.log(
    `Carbs %:          ${statsGreedy.carbsPercentage
      .toFixed(1)
      .padEnd(12)} ${statsLP.carbsPercentage.toFixed(1)}`
  );
  console.log(
    `Fat %:            ${statsGreedy.fatPercentage
      .toFixed(1)
      .padEnd(12)} ${statsLP.fatPercentage.toFixed(1)}`
  );

  console.log("\nFOOD VARIETY:");
  console.log(`Unique foods (Greedy): ${ingredientsGreedy.uniqueIngredients}`);
  console.log(`Unique foods (LP): ${ingredientsLP.uniqueIngredients}`);
  console.log(`Total amount (Greedy): ${ingredientsGreedy.totalAmount}g`);
  console.log(`Total amount (LP): ${ingredientsLP.totalAmount}g`);

  // Check nutrient coverage
  console.log("\nNUTRIENT COVERAGE (% of nutrients meeting 100% NRV):");
  let greedyMet = 0,
    lpMet = 0;
  nutrients.forEach((nutrient) => {
    const greedyAmount = statsGreedy.nutrientTotals.get(nutrient.name) || 0;
    const lpAmount = statsLP.nutrientTotals.get(nutrient.name) || 0;
    if (greedyAmount >= nutrient.nrv) greedyMet++;
    if (lpAmount >= nutrient.nrv) lpMet++;
  });
  console.log(
    `Greedy: ${greedyMet}/${nutrients.length} (${(
      (greedyMet / nutrients.length) *
      100
    ).toFixed(0)}%)`
  );
  console.log(
    `LP: ${lpMet}/${nutrients.length} (${(
      (lpMet / nutrients.length) *
      100
    ).toFixed(0)}%)`
  );

  // Show top ingredients
  console.log("\nTOP INGREDIENTS (Greedy):");
  ingredientsGreedy.ingredients.slice(0, 5).forEach(([name, amount]) => {
    console.log(`  ${name}: ${amount}g`);
  });

  console.log("\nTOP INGREDIENTS (Linear Programming):");
  ingredientsLP.ingredients.slice(0, 5).forEach(([name, amount]) => {
    console.log(`  ${name}: ${amount}g`);
  });

  // Target achievement
  console.log("\n=== TARGET ACHIEVEMENT ===");
  const targetCalories = 2666; // Approximate for this profile
  console.log(`\nCalorie Target (~${targetCalories} kcal):`);
  console.log(
    `Greedy: ${(
      (Math.abs(statsGreedy.calories - targetCalories) / targetCalories) *
      100
    ).toFixed(1)}% deviation`
  );
  console.log(
    `LP: ${(
      (Math.abs(statsLP.calories - targetCalories) / targetCalories) *
      100
    ).toFixed(1)}% deviation`
  );

  console.log("\nMacro Target Achievement:");
  console.log(`Protein (target 30%):`);
  console.log(
    `  Greedy: ${Math.abs(statsGreedy.proteinPercentage - 30).toFixed(
      1
    )}% deviation`
  );
  console.log(
    `  LP: ${Math.abs(statsLP.proteinPercentage - 30).toFixed(1)}% deviation`
  );
  console.log(`Carbs (target 45%):`);
  console.log(
    `  Greedy: ${Math.abs(statsGreedy.carbsPercentage - 45).toFixed(
      1
    )}% deviation`
  );
  console.log(
    `  LP: ${Math.abs(statsLP.carbsPercentage - 45).toFixed(1)}% deviation`
  );
  console.log(`Fat (target 25%):`);
  console.log(
    `  Greedy: ${Math.abs(statsGreedy.fatPercentage - 25).toFixed(
      1
    )}% deviation`
  );
  console.log(
    `  LP: ${Math.abs(statsLP.fatPercentage - 25).toFixed(1)}% deviation`
  );

  // Summary
  console.log("\n=== SUMMARY ===");
  const lpAdvantages = [];
  const greedyAdvantages = [];

  if (lpMet > greedyMet) lpAdvantages.push("Better nutrient coverage");
  else if (greedyMet > lpMet) greedyAdvantages.push("Better nutrient coverage");

  if (
    Math.abs(statsLP.calories - targetCalories) <
    Math.abs(statsGreedy.calories - targetCalories)
  ) {
    lpAdvantages.push("Closer to calorie target");
  } else {
    greedyAdvantages.push("Closer to calorie target");
  }

  if (ingredientsLP.uniqueIngredients < ingredientsGreedy.uniqueIngredients) {
    lpAdvantages.push("Simpler diet (fewer ingredients)");
  } else {
    greedyAdvantages.push("More variety");
  }

  if (timeGreedy < timeLP) greedyAdvantages.push("Much faster execution");

  console.log("\nLinear Programming advantages:");
  lpAdvantages.forEach((adv) => console.log(`  ✓ ${adv}`));

  console.log("\nGreedy Algorithm advantages:");
  greedyAdvantages.forEach((adv) => console.log(`  ✓ ${adv}`));

  console.log("\nConclusion:");
  console.log(
    "Linear Programming provides a globally optimal solution that better meets"
  );
  console.log(
    "all constraints simultaneously, while the greedy algorithm is much faster"
  );
  console.log(
    "and produces more varied diets that may be more practical for users."
  );
}

// Run comparison
compareOptimizers().catch(console.error);
