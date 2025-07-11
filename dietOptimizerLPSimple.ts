// Simplified Diet Optimizer using Linear Programming
// This version uses more relaxed constraints for better feasibility

const solver = require("javascript-lp-solver");

import {
  Nutrient,
  Ingredient,
  Sex,
  ActivityLevel,
  Goal,
  TargetMacros,
  Meal,
  DietMealIngredient,
  DietMeal,
  Diet,
  GetDietInput,
  MacroTracking,
} from "./dietOptimizer";

// Re-export types for compatibility
export * from "./dietOptimizer";

// Helper types
interface IngredientSelection {
  ingredient: Ingredient;
  amount: number;
}

// Main diet optimization function using LP
export const getDiet: GetDietFunction = (input: GetDietInput): Diet => {
  // Step 1: Calculate TDEE
  const tdee = calculateTDEE(
    input.sex,
    input.age,
    input.bodyWeight,
    input.bodyFatPercentage,
    input.activityLevel
  );

  // Step 2: Adjust calories based on goal
  const targetCalories = adjustCaloriesForGoal(
    tdee,
    input.goal,
    input.bodyWeight
  );

  // Step 3: Calculate target macros in grams
  const targetMacrosInGrams = calculateTargetMacros(
    targetCalories,
    input.targetMacros
  );

  // Step 4: Create simplified LP model
  const model: any = {
    optimize: "totalCost",
    opType: "min",
    constraints: {},
    variables: {},
  };

  // Single calorie constraint with wider tolerance
  model.constraints["calories"] = {
    min: targetCalories * 0.9,
    max: targetCalories * 1.1,
  };

  // Add macro constraints as soft constraints (wider tolerance)
  model.constraints["protein"] = { min: targetMacrosInGrams.protein * 0.7 };
  model.constraints["carbs"] = { min: targetMacrosInGrams.carbs * 0.7 };
  model.constraints["fat"] = { min: targetMacrosInGrams.fat * 0.7 };

  // Only add constraints for critical nutrients
  const criticalNutrients = [
    "Vitamin D",
    "Vitamin B12",
    "Iron",
    "Calcium",
    "Omega-3 fatty acids",
  ];

  input.nutrients.forEach((nutrient) => {
    if (criticalNutrients.includes(nutrient.name)) {
      const safeName = nutrient.name.replace(/[^a-zA-Z0-9]/g, "_");
      model.constraints[`n_${safeName}`] = { min: nutrient.nrv * 0.5 }; // 50% minimum for critical nutrients
    }
  });

  // Variables for each ingredient
  input.ingredients.forEach((ingredient, index) => {
    const varName = `x${index}`;
    const variable: any = {};

    // Simple cost function
    const isSupplement = ingredient.name.includes("Supplement");
    variable["totalCost"] = isSupplement ? 5 : 1;

    // Calorie contribution
    const caloriesPer100g =
      ingredient.macros.protein * 4 +
      ingredient.macros.carbs * 4 +
      ingredient.macros.fat * 9;
    variable["calories"] = caloriesPer100g / 100;

    // Macro contributions
    variable["protein"] = ingredient.macros.protein / 100;
    variable["carbs"] = ingredient.macros.carbs / 100;
    variable["fat"] = ingredient.macros.fat / 100;

    // Nutrient contributions for critical nutrients only
    ingredient.nutrients.forEach((nutrientInfo) => {
      if (criticalNutrients.includes(nutrientInfo.nutrient.name)) {
        const safeName = nutrientInfo.nutrient.name.replace(
          /[^a-zA-Z0-9]/g,
          "_"
        );
        variable[`n_${safeName}`] = nutrientInfo.amount / 100;
      }
    });

    // Practical limits
    const maxAmount = isSupplement ? 10 : 300;
    model.constraints[varName] = { max: maxAmount };

    model.variables[varName] = variable;
  });

  // Solve
  console.log("Solving LP model...");
  const solution = solver.Solve(model);
  console.log(
    "Solution found:",
    solution.feasible ? "feasible" : "not feasible"
  );

  // Convert solution
  const selectedIngredients: IngredientSelection[] = [];

  if (solution && solution.feasible) {
    input.ingredients.forEach((ingredient, index) => {
      const amount = solution[`x${index}`] || 0;
      if (amount > 1) {
        selectedIngredients.push({
          ingredient,
          amount: Math.round(amount),
        });
      }
    });
  }

  // If no feasible solution or too few ingredients, use fallback
  if (selectedIngredients.length < 5) {
    console.log("Using fallback selection...");
    return createFallbackDiet(input);
  }

  // Distribute to meals
  const diet = distributeToMeals(
    selectedIngredients,
    input.meals,
    targetCalories
  );
  return diet;
};

// Create a reasonable fallback diet
function createFallbackDiet(input: GetDietInput): Diet {
  // Select a variety of foods
  const selections: IngredientSelection[] = [];

  // Proteins
  const proteins = input.ingredients.filter(
    (i) => i.macros.protein > 20 && !i.name.includes("Supplement")
  );
  if (proteins.length > 0) {
    selections.push({ ingredient: proteins[0], amount: 200 });
  }

  // Carbs
  const carbs = input.ingredients.filter(
    (i) => i.macros.carbs > 20 && !i.name.includes("Supplement")
  );
  if (carbs.length > 0) {
    selections.push({ ingredient: carbs[0], amount: 150 });
  }

  // Vegetables
  const veggies = input.ingredients.filter(
    (i) =>
      i.name.toLowerCase().includes("spinach") ||
      i.name.toLowerCase().includes("broccoli") ||
      i.name.toLowerCase().includes("kale")
  );
  if (veggies.length > 0) {
    selections.push({ ingredient: veggies[0], amount: 200 });
  }

  // Healthy fats
  const fats = input.ingredients.filter(
    (i) => i.macros.fat > 40 && !i.name.includes("Supplement")
  );
  if (fats.length > 0) {
    selections.push({ ingredient: fats[0], amount: 30 });
  }

  // Add a multivitamin if available
  const multivitamin = input.ingredients.find((i) =>
    i.name.includes("Multivitamin")
  );
  if (multivitamin) {
    selections.push({ ingredient: multivitamin, amount: 2 });
  }

  // Calculate target calories
  const tdee = calculateTDEE(
    input.sex,
    input.age,
    input.bodyWeight,
    input.bodyFatPercentage,
    input.activityLevel
  );
  const targetCalories = adjustCaloriesForGoal(
    tdee,
    input.goal,
    input.bodyWeight
  );

  return distributeToMeals(selections, input.meals, targetCalories);
}

// Helper functions (same as before)
function calculateTDEE(
  sex: Sex,
  age: number,
  bodyWeight: number,
  bodyFatPercentage: number,
  activityLevel: ActivityLevel
): number {
  const leanBodyMass = bodyWeight * (1 - bodyFatPercentage / 100);
  const bmr = 370 + 21.6 * leanBodyMass;

  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    very: 1.725,
  };

  return bmr * activityMultipliers[activityLevel];
}

function adjustCaloriesForGoal(
  tdee: number,
  goal: Goal,
  bodyWeight: number
): number {
  switch (goal.type) {
    case "build-muscle":
      return tdee * 1.15;
    case "lose-fat":
      const minIntake = bodyWeight < 70 ? 1200 : 1500;
      return Math.max(tdee * 0.8, minIntake);
    case "maintain":
      return tdee;
    default:
      return tdee;
  }
}

function calculateTargetMacros(
  calories: number,
  targetMacros: TargetMacros
): MacroTracking {
  const proteinCalories = (calories * targetMacros.proteinPercentage) / 100;
  const carbsCalories = (calories * targetMacros.carbsPercentage) / 100;
  const fatCalories = (calories * targetMacros.fatPercentage) / 100;

  return {
    protein: proteinCalories / 4,
    carbs: carbsCalories / 4,
    fat: fatCalories / 9,
  };
}

function distributeToMeals(
  selectedIngredients: IngredientSelection[],
  meals: Meal[],
  targetCalories: number
): Diet {
  const dietMeals: DietMeal[] = [];

  // Calculate total calories
  let totalCalories = 0;
  selectedIngredients.forEach((sel) => {
    const cal =
      ((sel.ingredient.macros.protein * 4 +
        sel.ingredient.macros.carbs * 4 +
        sel.ingredient.macros.fat * 9) *
        sel.amount) /
      100;
    totalCalories += cal;
  });

  // Distribute to meals
  for (const meal of meals) {
    const mealProportion = meal.kcalPercentage / 100;
    const mealIngredients: DietMealIngredient[] = [];

    selectedIngredients.forEach((sel) => {
      let amount = sel.amount * mealProportion;

      // Put supplements in breakfast only
      if (sel.ingredient.name.includes("Supplement")) {
        amount = meal.name === "Breakfast" ? sel.amount : 0;
      }

      if (amount >= 1) {
        mealIngredients.push({
          ingredient: sel.ingredient,
          amount: Math.round(amount),
        });
      }
    });

    dietMeals.push({ meal, ingredients: mealIngredients });
  }

  return { meals: dietMeals };
}

// Type definition
type GetDietFunction = (input: GetDietInput) => Diet;
