// Diet Optimizer Algorithm
// This algorithm creates optimized diets for peak performance and longevity

export interface Nutrient {
  name: string;
  nrv: number;
  unit: string;
}

export interface IngredientNutrient {
  amount: number;
  nutrient: Nutrient;
}

export interface Macros {
  protein: number;
  carbs: number;
  fat: number;
}

export interface Ingredient {
  nutrients: IngredientNutrient[];
  macros: Macros;
  name: string;
}

export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "very";

export interface BuildMuscleGoal {
  type: "build-muscle";
}

export interface LoseFatGoal {
  type: "lose-fat";
  targetBodyFatPercentage: number;
  targetDate: Date;
}

export interface MaintainGoal {
  type: "maintain";
}

export type Goal = BuildMuscleGoal | LoseFatGoal | MaintainGoal;

export interface TargetMacros {
  proteinPercentage: number;
  carbsPercentage: number;
  fatPercentage: number;
}

export interface Meal {
  name: string;
  kcalPercentage: number;
}

export interface DietMealIngredient {
  ingredient: Ingredient;
  amount: number; // in grams
}

export interface DietMeal {
  meal: Meal;
  ingredients: DietMealIngredient[];
}

export interface Diet {
  meals: DietMeal[];
}

export interface GetDietInput {
  sex: Sex;
  age: number;
  bodyWeight: number; // in kg
  bodyFatPercentage: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  targetMacros: TargetMacros;
  ingredients: Ingredient[];
  nutrients: Nutrient[];
  meals: Meal[];
}

// Helper types for tracking
interface NutrientTracking {
  nutrient: Nutrient;
  consumed: number;
  percentage: number;
}

interface MacroTracking {
  protein: number;
  carbs: number;
  fat: number;
}

interface IngredientSelection {
  ingredient: Ingredient;
  amount: number;
}

// Main diet optimization function
export const getDiet: GetDietFunction = (input: GetDietInput): Diet => {
  // Step 1: Calculate TDEE (Total Daily Energy Expenditure)
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

  // Step 4: Select ingredients to meet nutritional requirements
  const selectedIngredients = selectOptimalIngredients(
    input.ingredients,
    input.nutrients,
    targetMacrosInGrams,
    targetCalories
  );

  // Step 5: Distribute ingredients across meals
  const diet = distributeToMeals(
    selectedIngredients,
    input.meals,
    targetCalories
  );

  return diet;
};

// Calculate TDEE using Katch-McArdle formula (more accurate when body fat % is known)
function calculateTDEE(
  sex: Sex,
  age: number,
  bodyWeight: number,
  bodyFatPercentage: number,
  activityLevel: ActivityLevel
): number {
  // Calculate lean body mass
  const leanBodyMass = bodyWeight * (1 - bodyFatPercentage / 100);

  // Katch-McArdle formula: BMR = 370 + (21.6 × LBM in kg)
  const bmr = 370 + 21.6 * leanBodyMass;

  // Activity multipliers
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    very: 1.725,
  };

  return bmr * activityMultipliers[activityLevel];
}

// Adjust calories based on goal
function adjustCaloriesForGoal(
  tdee: number,
  goal: Goal,
  bodyWeight: number
): number {
  switch (goal.type) {
    case "build-muscle":
      // 10-20% surplus for muscle building
      return tdee * 1.15;

    case "lose-fat":
      // Calculate deficit based on target date
      const daysToTarget = Math.ceil(
        (goal.targetDate.getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      );
      // Maximum safe deficit is 20-25% of TDEE
      const maxDeficit = tdee * 0.75;
      // Minimum safe intake is 1200 for women, 1500 for men (rough estimate)
      const minIntake = bodyWeight < 70 ? 1200 : 1500;
      return Math.max(tdee * 0.8, minIntake);

    case "maintain":
      return tdee;

    default:
      return tdee;
  }
}

// Calculate target macros in grams from percentages and calories
function calculateTargetMacros(
  calories: number,
  targetMacros: TargetMacros
): MacroTracking {
  // Calories per gram: protein = 4, carbs = 4, fat = 9
  const proteinCalories = (calories * targetMacros.proteinPercentage) / 100;
  const carbsCalories = (calories * targetMacros.carbsPercentage) / 100;
  const fatCalories = (calories * targetMacros.fatPercentage) / 100;

  return {
    protein: proteinCalories / 4,
    carbs: carbsCalories / 4,
    fat: fatCalories / 9,
  };
}

// Select optimal ingredients using a greedy algorithm with nutrient density scoring
function selectOptimalIngredients(
  ingredients: Ingredient[],
  nutrients: Nutrient[],
  targetMacros: MacroTracking,
  targetCalories: number
): IngredientSelection[] {
  const selectedIngredients: IngredientSelection[] = [];
  const nutrientTracking = initializeNutrientTracking(nutrients);
  let currentMacros: MacroTracking = { protein: 0, carbs: 0, fat: 0 };
  let currentCalories = 0;

  // Continue selecting ingredients until all NRVs are met or calories are reached
  while (
    !areAllNRVsMet(nutrientTracking) &&
    currentCalories < targetCalories * 0.95
  ) {
    // Find the best ingredient to add
    const bestIngredient = findBestIngredient(
      ingredients,
      nutrientTracking,
      currentMacros,
      targetMacros,
      targetCalories - currentCalories
    );

    if (!bestIngredient) break;

    // Calculate optimal amount of this ingredient
    const optimalAmount = calculateOptimalAmount(
      bestIngredient.ingredient,
      nutrientTracking,
      currentMacros,
      targetMacros,
      targetCalories - currentCalories
    );

    if (optimalAmount <= 0) continue;

    // Add to selected ingredients
    const existing = selectedIngredients.find(
      (s) => s.ingredient.name === bestIngredient.ingredient.name
    );

    if (existing) {
      existing.amount += optimalAmount;
    } else {
      selectedIngredients.push({
        ingredient: bestIngredient.ingredient,
        amount: optimalAmount,
      });
    }

    // Update tracking
    updateTracking(
      bestIngredient.ingredient,
      optimalAmount,
      nutrientTracking,
      currentMacros
    );

    currentCalories = calculateTotalCalories(currentMacros);
  }

  // Fine-tune amounts to better match macro targets
  optimizeMacroBalance(
    selectedIngredients,
    currentMacros,
    targetMacros,
    targetCalories
  );

  return selectedIngredients;
}

// Initialize nutrient tracking
function initializeNutrientTracking(nutrients: Nutrient[]): NutrientTracking[] {
  return nutrients.map((nutrient) => ({
    nutrient,
    consumed: 0,
    percentage: 0,
  }));
}

// Check if all NRVs are met
function areAllNRVsMet(tracking: NutrientTracking[]): boolean {
  return tracking.every((t) => t.percentage >= 100);
}

// Find the best ingredient based on nutrient density and current deficiencies
function findBestIngredient(
  ingredients: Ingredient[],
  nutrientTracking: NutrientTracking[],
  currentMacros: MacroTracking,
  targetMacros: MacroTracking,
  remainingCalories: number
): { ingredient: Ingredient; score: number } | null {
  let bestIngredient: Ingredient | null = null;
  let bestScore = -Infinity;

  for (const ingredient of ingredients) {
    const score = calculateIngredientScore(
      ingredient,
      nutrientTracking,
      currentMacros,
      targetMacros,
      remainingCalories
    );

    if (score > bestScore) {
      bestScore = score;
      bestIngredient = ingredient;
    }
  }

  return bestIngredient
    ? { ingredient: bestIngredient, score: bestScore }
    : null;
}

// Calculate ingredient score based on nutrient density and current needs
function calculateIngredientScore(
  ingredient: Ingredient,
  nutrientTracking: NutrientTracking[],
  currentMacros: MacroTracking,
  targetMacros: MacroTracking,
  remainingCalories: number
): number {
  let score = 0;

  // Calculate calories per 100g
  const caloriesPer100g = calculateCaloriesFromMacros(ingredient.macros);

  // Penalize if it would exceed calorie budget significantly
  if (caloriesPer100g > remainingCalories) {
    return -1000;
  }

  // Score based on nutrient density for deficient nutrients
  for (const ingredientNutrient of ingredient.nutrients) {
    const tracking = nutrientTracking.find(
      (t) => t.nutrient.name === ingredientNutrient.nutrient.name
    );

    if (tracking && tracking.percentage < 100) {
      // Higher score for nutrients we're deficient in
      const deficiency = 100 - tracking.percentage;
      const nutrientDensity = ingredientNutrient.amount / caloriesPer100g;
      score += nutrientDensity * deficiency * 10;
    }
  }

  // Score based on macro balance
  const macroScore = calculateMacroScore(
    ingredient.macros,
    currentMacros,
    targetMacros
  );
  score += macroScore * 5;

  // Bonus for variety (slight penalty if already selected in large amounts)
  // This would need access to selected ingredients, simplified here

  return score;
}

// Calculate optimal amount of an ingredient to add
function calculateOptimalAmount(
  ingredient: Ingredient,
  nutrientTracking: NutrientTracking[],
  currentMacros: MacroTracking,
  targetMacros: MacroTracking,
  remainingCalories: number
): number {
  const caloriesPer100g = calculateCaloriesFromMacros(ingredient.macros);

  // Start with amount that would provide 10-20% of remaining calories
  let optimalAmount = (remainingCalories * 0.15) / (caloriesPer100g / 100);

  // Adjust based on most limiting nutrient
  for (const ingredientNutrient of ingredient.nutrients) {
    const tracking = nutrientTracking.find(
      (t) => t.nutrient.name === ingredientNutrient.nutrient.name
    );

    if (tracking && tracking.percentage < 100) {
      const neededAmount = tracking.nutrient.nrv - tracking.consumed;
      const amountToMeetNeed = (neededAmount / ingredientNutrient.amount) * 100;
      optimalAmount = Math.min(optimalAmount, amountToMeetNeed * 1.2); // 20% buffer
    }
  }

  // Limit by macros
  const macroLimitedAmount = calculateMacroLimitedAmount(
    ingredient.macros,
    currentMacros,
    targetMacros
  );
  optimalAmount = Math.min(optimalAmount, macroLimitedAmount);

  // Practical limits
  // For supplements (identified by "Supplement" in name), limit to reasonable doses
  const maxAmount = ingredient.name.includes("Supplement") ? 10 : 500; // Max 10g for supplements, 500g for food
  const minAmount = ingredient.name.includes("Supplement") ? 1 : 5; // Min 1g for supplements, 5g for food

  return Math.max(minAmount, Math.min(maxAmount, Math.round(optimalAmount)));
}

// Calculate calories from macros
function calculateCaloriesFromMacros(macros: Macros): number {
  return macros.protein * 4 + macros.carbs * 4 + macros.fat * 9;
}

// Calculate total calories
function calculateTotalCalories(macros: MacroTracking): number {
  return macros.protein * 4 + macros.carbs * 4 + macros.fat * 9;
}

// Calculate macro score
function calculateMacroScore(
  ingredientMacros: Macros,
  currentMacros: MacroTracking,
  targetMacros: MacroTracking
): number {
  const currentTotal =
    currentMacros.protein + currentMacros.carbs + currentMacros.fat;
  const targetTotal =
    targetMacros.protein + targetMacros.carbs + targetMacros.fat;

  if (currentTotal === 0) return 1;

  const currentRatios = {
    protein: currentMacros.protein / currentTotal,
    carbs: currentMacros.carbs / currentTotal,
    fat: currentMacros.fat / currentTotal,
  };

  const targetRatios = {
    protein: targetMacros.protein / targetTotal,
    carbs: targetMacros.carbs / targetTotal,
    fat: targetMacros.fat / targetTotal,
  };

  const ingredientTotal =
    ingredientMacros.protein + ingredientMacros.carbs + ingredientMacros.fat;
  const ingredientRatios = {
    protein: ingredientMacros.protein / ingredientTotal,
    carbs: ingredientMacros.carbs / ingredientTotal,
    fat: ingredientMacros.fat / ingredientTotal,
  };

  // Score based on how well this ingredient helps achieve target ratios
  let score = 0;
  if (
    currentRatios.protein < targetRatios.protein &&
    ingredientRatios.protein > currentRatios.protein
  ) {
    score += (ingredientRatios.protein - currentRatios.protein) * 2;
  }
  if (
    currentRatios.carbs < targetRatios.carbs &&
    ingredientRatios.carbs > currentRatios.carbs
  ) {
    score += (ingredientRatios.carbs - currentRatios.carbs) * 2;
  }
  if (
    currentRatios.fat < targetRatios.fat &&
    ingredientRatios.fat > currentRatios.fat
  ) {
    score += (ingredientRatios.fat - currentRatios.fat) * 2;
  }

  return score;
}

// Calculate amount limited by macro targets
function calculateMacroLimitedAmount(
  ingredientMacros: Macros,
  currentMacros: MacroTracking,
  targetMacros: MacroTracking
): number {
  const limits: number[] = [];

  if (ingredientMacros.protein > 0) {
    const proteinLimit =
      ((targetMacros.protein - currentMacros.protein) /
        ingredientMacros.protein) *
      100;
    if (proteinLimit > 0) limits.push(proteinLimit);
  }

  if (ingredientMacros.carbs > 0) {
    const carbsLimit =
      ((targetMacros.carbs - currentMacros.carbs) / ingredientMacros.carbs) *
      100;
    if (carbsLimit > 0) limits.push(carbsLimit);
  }

  if (ingredientMacros.fat > 0) {
    const fatLimit =
      ((targetMacros.fat - currentMacros.fat) / ingredientMacros.fat) * 100;
    if (fatLimit > 0) limits.push(fatLimit);
  }

  return limits.length > 0 ? Math.min(...limits) * 1.1 : 500; // 10% buffer
}

// Update tracking after adding an ingredient
function updateTracking(
  ingredient: Ingredient,
  amount: number,
  nutrientTracking: NutrientTracking[],
  macros: MacroTracking
): void {
  const factor = amount / 100; // Convert to per 100g basis

  // Update nutrients
  for (const ingredientNutrient of ingredient.nutrients) {
    const tracking = nutrientTracking.find(
      (t) => t.nutrient.name === ingredientNutrient.nutrient.name
    );

    if (tracking) {
      tracking.consumed += ingredientNutrient.amount * factor;
      tracking.percentage = (tracking.consumed / tracking.nutrient.nrv) * 100;
    }
  }

  // Update macros
  macros.protein += ingredient.macros.protein * factor;
  macros.carbs += ingredient.macros.carbs * factor;
  macros.fat += ingredient.macros.fat * factor;
}

// Optimize macro balance by fine-tuning amounts
function optimizeMacroBalance(
  selectedIngredients: IngredientSelection[],
  currentMacros: MacroTracking,
  targetMacros: MacroTracking,
  targetCalories: number
): void {
  // Calculate current deviations
  const currentCalories = calculateTotalCalories(currentMacros);
  const calorieDiff = targetCalories - currentCalories;

  // If significantly under calories, scale up proportionally
  if (calorieDiff > targetCalories * 0.05) {
    const scaleFactor = targetCalories / currentCalories;
    for (const selection of selectedIngredients) {
      // Apply different scaling for supplements vs regular foods
      if (selection.ingredient.name.includes("Supplement")) {
        // For supplements, increase conservatively with maximum limits
        const currentAmount = selection.amount;
        const maxSupplementAmount = 10; // Maximum 10g for supplements
        selection.amount = Math.min(
          maxSupplementAmount,
          currentAmount * Math.min(scaleFactor, 1.5) // Max 50% increase for supplements
        );
      } else {
        // For regular foods, scale normally but with reasonable limits
        selection.amount = Math.min(
          500, // Max 500g per food item
          selection.amount * scaleFactor
        );
      }
    }
    return;
  }

  // Fine-tune individual ingredients to better match macro ratios
  // This is a simplified version - a more sophisticated approach would use
  // linear programming or gradient descent
  for (let i = 0; i < 10; i++) {
    // Maximum 10 iterations
    const proteinDiff = targetMacros.protein - currentMacros.protein;
    const carbsDiff = targetMacros.carbs - currentMacros.carbs;
    const fatDiff = targetMacros.fat - currentMacros.fat;

    // Find ingredients that can help balance
    for (const selection of selectedIngredients) {
      const ingredient = selection.ingredient;
      const factor = 0.05; // Adjust by 5% at a time

      if (
        proteinDiff > 5 &&
        ingredient.macros.protein > ingredient.macros.carbs &&
        ingredient.macros.protein > ingredient.macros.fat
      ) {
        const newAmount = selection.amount * (1 + factor);
        const maxAmount = ingredient.name.includes("Supplement") ? 10 : 500;
        selection.amount = Math.min(maxAmount, newAmount);
      } else if (
        carbsDiff > 5 &&
        ingredient.macros.carbs > ingredient.macros.protein &&
        ingredient.macros.carbs > ingredient.macros.fat
      ) {
        const newAmount = selection.amount * (1 + factor);
        const maxAmount = ingredient.name.includes("Supplement") ? 10 : 500;
        selection.amount = Math.min(maxAmount, newAmount);
      } else if (
        fatDiff > 5 &&
        ingredient.macros.fat > ingredient.macros.protein &&
        ingredient.macros.fat > ingredient.macros.carbs
      ) {
        const newAmount = selection.amount * (1 + factor);
        const maxAmount = ingredient.name.includes("Supplement") ? 10 : 500;
        selection.amount = Math.min(maxAmount, newAmount);
      }
    }

    // Recalculate macros
    currentMacros.protein = 0;
    currentMacros.carbs = 0;
    currentMacros.fat = 0;

    for (const selection of selectedIngredients) {
      const factor = selection.amount / 100;
      currentMacros.protein += selection.ingredient.macros.protein * factor;
      currentMacros.carbs += selection.ingredient.macros.carbs * factor;
      currentMacros.fat += selection.ingredient.macros.fat * factor;
    }

    // Check if close enough
    if (
      Math.abs(proteinDiff) < 5 &&
      Math.abs(carbsDiff) < 5 &&
      Math.abs(fatDiff) < 5
    ) {
      break;
    }
  }
}

// Distribute ingredients across meals
function distributeToMeals(
  selectedIngredients: IngredientSelection[],
  meals: Meal[],
  targetCalories: number
): Diet {
  const dietMeals: DietMeal[] = [];

  // Sort ingredients by typical meal timing (simplified logic)
  const sortedIngredients = [...selectedIngredients].sort((a, b) => {
    // This is a simplified heuristic - in reality, you'd want more sophisticated categorization
    const aName = a.ingredient.name.toLowerCase();
    const bName = b.ingredient.name.toLowerCase();

    // Breakfast foods
    if (
      aName.includes("oat") ||
      aName.includes("egg") ||
      aName.includes("milk")
    )
      return -1;
    if (
      bName.includes("oat") ||
      bName.includes("egg") ||
      bName.includes("milk")
    )
      return 1;

    // Dinner foods
    if (
      aName.includes("rice") ||
      aName.includes("meat") ||
      aName.includes("fish")
    )
      return 1;
    if (
      bName.includes("rice") ||
      bName.includes("meat") ||
      bName.includes("fish")
    )
      return -1;

    return 0;
  });

  // Calculate calories for each meal
  for (const meal of meals) {
    const mealCalories = (targetCalories * meal.kcalPercentage) / 100;
    const mealIngredients: DietMealIngredient[] = [];
    let currentMealCalories = 0;

    // Distribute ingredients to meals
    for (const selection of sortedIngredients) {
      if (currentMealCalories >= mealCalories * 0.95) break;

      const ingredientCaloriesPer100g = calculateCaloriesFromMacros(
        selection.ingredient.macros
      );
      const totalIngredientCalories =
        (selection.amount / 100) * ingredientCaloriesPer100g;

      // Calculate portion for this meal
      const remainingMealCalories = mealCalories - currentMealCalories;
      const portionRatio = Math.min(
        1,
        remainingMealCalories / totalIngredientCalories
      );

      if (portionRatio > 0.1) {
        // Only add if it's a meaningful portion
        let mealAmount = selection.amount * portionRatio;

        // For supplements, limit the amount per meal
        if (selection.ingredient.name.includes("Supplement")) {
          mealAmount = Math.min(mealAmount, 5); // Max 5g of any supplement per meal
        }

        mealIngredients.push({
          ingredient: selection.ingredient,
          amount: Math.round(mealAmount),
        });

        currentMealCalories += (mealAmount / 100) * ingredientCaloriesPer100g;
        selection.amount -= mealAmount; // Reduce from available amount
      }
    }

    dietMeals.push({
      meal,
      ingredients: mealIngredients,
    });
  }

  // Distribute any remaining ingredients to the largest meal
  const largestMeal = meals.reduce((max, meal) =>
    meal.kcalPercentage > max.kcalPercentage ? meal : max
  );
  const largestMealIndex = meals.indexOf(largestMeal);

  for (const selection of sortedIngredients) {
    const isSupplement = selection.ingredient.name.includes("Supplement");
    const minAmount = isSupplement ? 1 : 5;

    if (selection.amount > minAmount) {
      // Only add if meaningful amount remains
      // For supplements, ensure we don't exceed reasonable amounts per meal
      const maxPerMeal = isSupplement ? 5 : selection.amount;
      const amountToAdd = Math.min(selection.amount, maxPerMeal);

      dietMeals[largestMealIndex].ingredients.push({
        ingredient: selection.ingredient,
        amount: Math.round(amountToAdd),
      });
    }
  }

  return { meals: dietMeals };
}

// Type definition for the function
type GetDietFunction = (input: GetDietInput) => Diet;
