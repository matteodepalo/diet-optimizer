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

## Areas for Future Enhancement

1. **Optimization Method**: Could use linear programming for globally optimal solutions
2. **Food Variety**: Add constraints to ensure dietary diversity
3. **User Preferences**: Support for dietary restrictions, allergies, preferences
4. **Cost Optimization**: Consider food costs in selection
5. **Nutrient Timing**: Optimize nutrient distribution throughout the day
6. **Phytonutrients**: Include antioxidants and other beneficial compounds

## Conclusion

This algorithm provides a solid foundation for creating nutritionally complete diets. By prioritizing nutrient density and using intelligent scoring mechanisms, it produces diets that meet both macro and micronutrient targets while maintaining practical serving sizes.
