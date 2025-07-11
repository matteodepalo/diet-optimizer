// Test file for Linear Programming diet optimizer
import { getDiet } from "./dietOptimizerLPSimple";
import { loadDataFromJson, createSupplementIngredients } from "./loadData";

// Helper function for assertions
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✓ ${message}`);
}

// Helper function to calculate total macros
function calculateTotalMacros(diet: any) {
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;

  diet.meals.forEach((meal: any) => {
    meal.ingredients.forEach((item: any) => {
      const factor = item.amount / 100;
      totalProtein += item.ingredient.macros.protein * factor;
      totalCarbs += item.ingredient.macros.carbs * factor;
      totalFat += item.ingredient.macros.fat * factor;
    });
  });

  const totalCalories = totalProtein * 4 + totalCarbs * 4 + totalFat * 9;

  return {
    protein: totalProtein,
    carbs: totalCarbs,
    fat: totalFat,
    calories: totalCalories,
    proteinPercentage: ((totalProtein * 4) / totalCalories) * 100,
    carbsPercentage: ((totalCarbs * 4) / totalCalories) * 100,
    fatPercentage: ((totalFat * 9) / totalCalories) * 100,
  };
}

// Run tests
async function runTests() {
  console.log("=== Running Linear Programming Diet Optimizer Tests ===\n");

  try {
    // Load test data
    const { nutrients, ingredients, meals } =
      loadDataFromJson("./sample-data.json");
    const supplements = createSupplementIngredients(nutrients);
    const allIngredients = [...ingredients, ...supplements];

    // Test 1: Basic LP functionality
    console.log("Test 1: Linear Programming Basic Functionality");
    const basicDiet = getDiet({
      sex: "male",
      age: 30,
      bodyWeight: 75,
      bodyFatPercentage: 15,
      activityLevel: "moderate",
      goal: { type: "maintain" },
      targetMacros: {
        proteinPercentage: 30,
        carbsPercentage: 45,
        fatPercentage: 25,
      },
      ingredients: allIngredients,
      nutrients: nutrients,
      meals: meals,
    });

    assert(basicDiet.meals.length === 4, "Diet should have 4 meals");
    assert(
      basicDiet.meals.every((m) => m.ingredients.length > 0),
      "Each meal should have ingredients"
    );

    // Test 2: Check optimization
    console.log("\nTest 2: Optimization Check");
    const macros = calculateTotalMacros(basicDiet);
    console.log(`  Total calories: ${macros.calories.toFixed(0)} kcal`);
    console.log(
      `  Protein: ${macros.protein.toFixed(
        0
      )}g (${macros.proteinPercentage.toFixed(1)}%)`
    );
    console.log(
      `  Carbs: ${macros.carbs.toFixed(0)}g (${macros.carbsPercentage.toFixed(
        1
      )}%)`
    );
    console.log(
      `  Fat: ${macros.fat.toFixed(0)}g (${macros.fatPercentage.toFixed(1)}%)`
    );

    assert(macros.calories > 1000, "Total calories should be reasonable");

    // Test 3: Compare different goals
    console.log("\nTest 3: Different Goals Comparison");

    const buildMuscleDiet = getDiet({
      sex: "male",
      age: 25,
      bodyWeight: 70,
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

    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + 3);

    const loseFatDiet = getDiet({
      sex: "female",
      age: 30,
      bodyWeight: 70,
      bodyFatPercentage: 30,
      activityLevel: "light",
      goal: {
        type: "lose-fat",
        targetBodyFatPercentage: 25,
        targetDate: targetDate,
      },
      targetMacros: {
        proteinPercentage: 35,
        carbsPercentage: 35,
        fatPercentage: 30,
      },
      ingredients: allIngredients,
      nutrients: nutrients,
      meals: meals,
    });

    const muscleMacros = calculateTotalMacros(buildMuscleDiet);
    const fatLossMacros = calculateTotalMacros(loseFatDiet);

    console.log(
      `  Build muscle calories: ${muscleMacros.calories.toFixed(0)} kcal`
    );
    console.log(
      `  Fat loss calories: ${fatLossMacros.calories.toFixed(0)} kcal`
    );

    assert(
      muscleMacros.calories > fatLossMacros.calories,
      "Build muscle diet should have more calories than fat loss"
    );

    // Test 4: Ingredient variety
    console.log("\nTest 4: Ingredient Variety");
    const uniqueIngredients = new Set<string>();
    basicDiet.meals.forEach((meal: any) => {
      meal.ingredients.forEach((item: any) => {
        uniqueIngredients.add(item.ingredient.name);
      });
    });

    console.log(`  Unique ingredients: ${uniqueIngredients.size}`);
    assert(
      uniqueIngredients.size >= 3,
      "Should have at least 3 different ingredients"
    );

    // Test 5: Supplement handling
    console.log("\nTest 5: Supplement Handling");
    let totalSupplementAmount = 0;
    let hasSupplements = false;

    basicDiet.meals.forEach((meal: any) => {
      meal.ingredients.forEach((item: any) => {
        if (item.ingredient.name.includes("Supplement")) {
          hasSupplements = true;
          totalSupplementAmount += item.amount;
        }
      });
    });

    console.log(`  Total supplement amount: ${totalSupplementAmount}g`);
    if (hasSupplements) {
      assert(
        totalSupplementAmount <= 20,
        "Total supplement amount should be reasonable"
      );
    }

    console.log("\n=== All LP Tests Passed! ===");

    // Display example diet
    console.log("\n--- Example LP-Optimized Diet ---");
    console.log("Meals:");
    basicDiet.meals.forEach((meal: any) => {
      console.log(`\n${meal.meal.name}:`);
      meal.ingredients.forEach((item: any) => {
        console.log(`  - ${item.ingredient.name}: ${item.amount}g`);
      });
    });
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

// Run the tests
runTests();
