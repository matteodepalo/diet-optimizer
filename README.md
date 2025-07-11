# Diet Optimization Algorithm

This algorithm creates optimized diets for peak performance and longevity by selecting nutrient-dense foods that meet both macronutrient and micronutrient targets.

## Key Features

1. **Nutrient-First Approach**: Prioritizes meeting 100% of Nutrient Reference Values (NRVs) for all vitamins and minerals
2. **Dynamic Food Selection**: Uses a greedy algorithm with nutrient density scoring to select optimal ingredients
3. **Personalized Calculations**: Considers sex, age, body weight, body fat percentage, and activity level
4. **Goal-Based Optimization**: Supports three goals:
   - Build muscle (caloric surplus)
   - Lose fat (calculated deficit based on target date)
   - Maintain weight
5. **Macro Balance**: Respects user-defined macronutrient ratios while prioritizing micronutrients
6. **Meal Distribution**: Automatically distributes ingredients across meals based on calorie percentages

## Algorithm Flow

```
1. Calculate TDEE (Total Daily Energy Expenditure)
   └─> Uses Katch-McArdle formula with lean body mass

2. Adjust Calories for Goal
   ├─> Build Muscle: +15% surplus
   ├─> Lose Fat: -20% deficit (with safety limits)
   └─> Maintain: No adjustment

3. Calculate Target Macros
   └─> Convert percentage targets to grams

4. Select Optimal Ingredients
   ├─> Initialize nutrient tracking
   ├─> Score ingredients based on:
   │   ├─> Nutrient density for deficient nutrients
   │   ├─> Macro balance contribution
   │   └─> Calorie fit
   ├─> Add best ingredient in optimal amount
   ├─> Update tracking
   └─> Repeat until NRVs met or calories reached

5. Optimize Macro Balance
   └─> Fine-tune amounts to match target ratios

6. Distribute to Meals
   └─> Allocate ingredients based on meal calorie percentages
```

## Scoring System

The algorithm scores each ingredient based on:

### Nutrient Density Score
- Higher score for nutrients below 100% NRV
- Score = (nutrient_density × deficiency × 10)
- Ensures deficient nutrients are prioritized

### Macro Balance Score
- Evaluates how well the ingredient helps achieve target macro ratios
- Rewards ingredients that move current ratios toward targets

### Calorie Fit
- Penalizes ingredients that would exceed calorie budget
- Ensures portions remain practical (5g - 500g range)

## Key Algorithms

### TDEE Calculation
Uses the Katch-McArdle formula for accuracy when body fat percentage is known:
```
BMR = 370 + (21.6 × Lean Body Mass in kg)
TDEE = BMR × Activity Multiplier
```

### Optimal Amount Calculation
Determines the best serving size by considering:
1. Calorie constraints (10-20% of remaining calories)
2. Nutrient gaps (amount needed to meet deficient NRVs)
3. Macro limits (avoiding macro imbalances)
4. Practical limits (5g minimum, 500g maximum)

### Meal Distribution
- Sorts ingredients by typical meal timing
- Distributes based on meal calorie percentages
- Ensures meaningful portions (>10% of ingredient calories)
- Allocates remaining ingredients to largest meal

## Usage

```typescript
const diet = getDiet({
  sex: "male",
  age: 30,
  bodyWeight: 75, // kg
  bodyFatPercentage: 15,
  activityLevel: "moderate",
  goal: { type: "build-muscle" },
  targetMacros: {
    proteinPercentage: 30,
    carbsPercentage: 45,
    fatPercentage: 25
  },
  ingredients: [...], // Array of ingredients with nutrients
  nutrients: [...],    // Array of nutrients with NRVs
  meals: [...]        // Array of meals with calorie percentages
});
```

## Optimization Strategies

1. **Greedy Selection**: Selects the single best ingredient at each step
2. **Dynamic Scoring**: Adjusts priorities based on current deficiencies
3. **Iterative Refinement**: Fine-tunes amounts after initial selection
4. **Practical Constraints**: Ensures realistic serving sizes

## Future Enhancements

- Linear programming for globally optimal solutions
- Food group constraints and variety requirements
- User preferences and restrictions
- Seasonal availability considerations
- Cost optimization
- Glycemic index considerations
- Anti-nutrient interactions
- Meal timing optimization for performance
