export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export interface Food {
  id: string;
  name: string;
  calories_per_100g: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface RecipeIngredient {
  food_id: string;
  food_name: string;
  quantity_g: number;
}

export interface Recipe {
  id: string;
  name: string;
  servings: number;
  ingredients: RecipeIngredient[];
  created_at: string;
}

export interface FoodLogEntry {
  id: string;
  date: string; // YYYY-MM-DD
  meal_type: MealType;
  entry_type: 'food' | 'recipe' | 'quick' | 'ai';
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  quantity?: number;
  notes?: string;
}

export type Sex = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very_active' | 'extra_active';

export interface Settings {
  name: string;
  sex: Sex;
  age: number;
  weight_kg: number;
  height_cm: number;
  activity_level: ActivityLevel;
  calorie_goal: number;
  protein_goal: number;
  carbs_goal: number;
  fat_goal: number;
  fiber_goal: number;
  onboarded: boolean;
}

export interface DayTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface AIFoodItem {
  name: string;
  quantity_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
}
