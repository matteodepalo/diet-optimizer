# Diet Optimization Algorithm - Summary

## Overview

This algorithm creates optimized diets for peak performance and longevity by intelligently selecting foods to meet both macronutrient and micronutrient targets. The algorithm prioritizes nutrient density and ensures at least 100% of Nutrient Reference Values (NRVs) are met for all vitamins and minerals.

## Key Features

### 1. Dynamic Data Loading
- Ingredients and nutrients are loaded from JSON files
- No hardcoded assumptions about specific ingredients
- Easy to extend with new foods or supplements
- Supports both whole foods and supplements

### 2. Personalized Calculations
- **TDEE Calculation**: Uses Katch-McArdle formula with lean body mass
- **Goal-Based Adjustments**:
  - Build muscle: +15% caloric surplus
  - Lose fat: -20% deficit (with safety limits)
  - Maintain: No adjustment
- Considers sex, age, body weight, body fat percentage, and activity level

### 3. Intelligent Food Selection Algorithm
The algorithm uses a greedy approach with sophisticated scoring:

```
Score = Nutrient Density Score + Macro Balance Score
```

- **Nutrient Density Score**: Prioritizes foods rich in deficient nutrients
- **Macro Balance Score**: Selects foods that help achieve target macro ratios
- **Practical Limits**:
  - Foods: 5-500g per serving
  - Supplements: 1-10g per serving

### 4. Supplement Handling
- Supplements are identified by name and treated specially
- Conservative limits prevent unrealistic doses
- Supplements fill nutrient gaps that whole foods can't meet efficiently

### 5. Meal Distribution
- Distributes selected foods across meals based on calorie percentages
- Considers typical meal timing (breakfast vs dinner foods)
- Ensures meaningful portion sizes

## Algorithm Performance

Example outputs show the algorithm successfully:
- Meets or exceeds 100% NRV for most nutrients
- Stays within target calorie ranges
- Respects macro targets while prioritizing micronutrients
- Produces realistic serving sizes

## Technical Implementation

### Core Components
1. **dietOptimizer.ts**: Main algorithm implementation
2. **loadData.ts**: JSON data loading and transformation
3. **sample-data.json**: Example nutrient and ingredient database

### Data Structure
```typescript
interface GetDietInput {
  sex: Sex
  age: number
  bodyWeight: number
  bodyFatPercentage: number
  activityLevel: ActivityLevel
  goal: Goal
  targetMacros: TargetMacros
  ingredients: Ingredient[]
  nutrients: Nutrient[]
  meals: Meal[]
}
```

## Usage Example

```typescript
import { getDiet } from './dietOptimizer';
import { loadDataFromJson } from './loadData';

const { nutrients, ingredients, meals } = loadDataFromJson('./sample-data.json');

const diet = getDiet({
  sex: "male",
  age: 30,
  bodyWeight: 75,
  bodyFatPercentage: 15,
  activityLevel: "moderate",
  goal: { type: "build-muscle" },
  targetMacros: {
    proteinPercentage: 30,
    carbsPercentage: 45,
    fatPercentage: 25
  },
  ingredients,
  nutrients,
  meals
});
```

## Strengths

1. **Nutrient Completeness**: Ensures all micronutrient needs are met
2. **Flexibility**: Works with any set of ingredients/nutrients
3. **Realistic**: Produces practical serving sizes
4. **Personalized**: Adapts to individual needs and goals

## Linear Programming Refactoring

The project now includes both approaches:

### 1. Original Greedy Algorithm (`dietOptimizer.ts`)
- **Pros**: Fast, produces varied diets, good nutrient coverage
- **Cons**: May not find globally optimal solution
- **Best for**: Users who want variety and quick results

### 2. Linear Programming (`dietOptimizerLPSimple.ts`)
- **Pros**: Globally optimal solution, guaranteed to meet constraints if feasible
- **Cons**: May produce less varied diets, requires constraint relaxation
- **Best for**: When optimality is more important than variety

### Implementation Details
- Uses `javascript-lp-solver` library
- Minimizes total "cost" (preferring whole foods over supplements)
- Constraints include calories, macros, and critical nutrients
- Falls back to reasonable defaults if no feasible solution exists

## Areas for Future Enhancement

1. **Advanced LP Models**: More sophisticated objective functions and constraints
2. **Multi-Objective Optimization**: Balance between cost, variety, and nutrition
3. **User Preferences**: Support for dietary restrictions, allergies, preferences
4. **Real-World Constraints**: Availability, seasonality, budget limits
5. **Nutrient Timing**: Optimize nutrient distribution throughout the day
6. **Phytonutrients**: Include antioxidants and other beneficial compounds

## Conclusion

This algorithm provides two approaches for creating nutritionally complete diets:
- The greedy algorithm offers speed and variety
- The linear programming approach ensures global optimality

Users can choose the approach that best fits their needs, whether they prioritize dietary variety or mathematical optimality.
