import type { Food } from '../types';

export const SEED_FOODS: Food[] = [
  // Grains
  { id: 'f001', name: 'White Rice (cooked)', calories_per_100g: 130, protein: 2.7, carbs: 28.2, fat: 0.3, fiber: 0.4 },
  { id: 'f002', name: 'Brown Rice (cooked)', calories_per_100g: 123, protein: 2.7, carbs: 25.6, fat: 0.9, fiber: 1.8 },
  { id: 'f003', name: 'Rolled Oats (dry)', calories_per_100g: 389, protein: 17, carbs: 66, fat: 7, fiber: 10.6 },
  { id: 'f004', name: 'White Bread', calories_per_100g: 265, protein: 9, carbs: 49, fat: 3.2, fiber: 2.7 },
  { id: 'f005', name: 'Pasta (cooked)', calories_per_100g: 158, protein: 5.8, carbs: 31, fat: 0.9, fiber: 1.8 },
  { id: 'f006', name: 'Roti / Chapati', calories_per_100g: 297, protein: 9, carbs: 53, fat: 5, fiber: 4.6 },
  { id: 'f007', name: 'Naan Bread', calories_per_100g: 310, protein: 9, carbs: 54, fat: 7, fiber: 2 },
  { id: 'f008', name: 'Quinoa (cooked)', calories_per_100g: 120, protein: 4.4, carbs: 21, fat: 1.9, fiber: 2.8 },
  { id: 'f009', name: 'Sourdough Bread', calories_per_100g: 267, protein: 8.8, carbs: 51, fat: 1.2, fiber: 3 },
  // Proteins
  { id: 'f010', name: 'Chicken Breast (cooked)', calories_per_100g: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 },
  { id: 'f011', name: 'Chicken Thigh (cooked)', calories_per_100g: 209, protein: 26, carbs: 0, fat: 11, fiber: 0 },
  { id: 'f012', name: 'Eggs (whole)', calories_per_100g: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0 },
  { id: 'f013', name: 'Tuna (canned in water)', calories_per_100g: 116, protein: 26, carbs: 0, fat: 1, fiber: 0 },
  { id: 'f014', name: 'Salmon (cooked)', calories_per_100g: 208, protein: 20, carbs: 0, fat: 13, fiber: 0 },
  { id: 'f015', name: 'Red Lentils (cooked)', calories_per_100g: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 7.9 },
  { id: 'f016', name: 'Chickpeas (cooked)', calories_per_100g: 164, protein: 8.9, carbs: 27, fat: 2.6, fiber: 7.6 },
  { id: 'f017', name: 'Tofu (firm)', calories_per_100g: 76, protein: 8, carbs: 1.9, fat: 4.8, fiber: 0.3 },
  { id: 'f018', name: 'Paneer', calories_per_100g: 321, protein: 21, carbs: 3, fat: 25, fiber: 0 },
  { id: 'f019', name: 'Beef Mince (lean, cooked)', calories_per_100g: 218, protein: 26, carbs: 0, fat: 12, fiber: 0 },
  { id: 'f020', name: 'Beef Steak (cooked)', calories_per_100g: 271, protein: 26, carbs: 0, fat: 18, fiber: 0 },
  { id: 'f021', name: 'Shrimp/Prawns (cooked)', calories_per_100g: 99, protein: 24, carbs: 0.2, fat: 0.3, fiber: 0 },
  // Dairy
  { id: 'f022', name: 'Whole Milk', calories_per_100g: 61, protein: 3.2, carbs: 4.8, fat: 3.3, fiber: 0 },
  { id: 'f023', name: 'Greek Yogurt (full fat)', calories_per_100g: 97, protein: 9, carbs: 3.6, fat: 5, fiber: 0 },
  { id: 'f024', name: 'Cheddar Cheese', calories_per_100g: 403, protein: 25, carbs: 1.3, fat: 33, fiber: 0 },
  { id: 'f025', name: 'Butter', calories_per_100g: 717, protein: 0.9, carbs: 0.1, fat: 81, fiber: 0 },
  { id: 'f026', name: 'Cream Cheese', calories_per_100g: 342, protein: 6, carbs: 4, fat: 34, fiber: 0 },
  // Vegetables
  { id: 'f027', name: 'Broccoli', calories_per_100g: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6 },
  { id: 'f028', name: 'Spinach (raw)', calories_per_100g: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2 },
  { id: 'f029', name: 'Carrot (raw)', calories_per_100g: 41, protein: 0.9, carbs: 10, fat: 0.2, fiber: 2.8 },
  { id: 'f030', name: 'Tomato', calories_per_100g: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2 },
  { id: 'f031', name: 'Onion', calories_per_100g: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fiber: 1.7 },
  { id: 'f032', name: 'Potato (boiled)', calories_per_100g: 87, protein: 1.9, carbs: 20, fat: 0.1, fiber: 1.8 },
  { id: 'f033', name: 'Sweet Potato (baked)', calories_per_100g: 90, protein: 2, carbs: 21, fat: 0.1, fiber: 3.3 },
  { id: 'f034', name: 'Cauliflower', calories_per_100g: 25, protein: 1.9, carbs: 5, fat: 0.3, fiber: 2 },
  { id: 'f035', name: 'Green Peas', calories_per_100g: 81, protein: 5.4, carbs: 14, fat: 0.4, fiber: 5.1 },
  { id: 'f036', name: 'Cucumber', calories_per_100g: 16, protein: 0.7, carbs: 3.6, fat: 0.1, fiber: 0.5 },
  { id: 'f037', name: 'Bell Pepper', calories_per_100g: 31, protein: 1, carbs: 6, fat: 0.3, fiber: 2.1 },
  { id: 'f038', name: 'Mushrooms', calories_per_100g: 22, protein: 3.1, carbs: 3.3, fat: 0.3, fiber: 1 },
  // Fats & Oils
  { id: 'f039', name: 'Olive Oil', calories_per_100g: 884, protein: 0, carbs: 0, fat: 100, fiber: 0 },
  { id: 'f040', name: 'Coconut Oil', calories_per_100g: 862, protein: 0, carbs: 0, fat: 100, fiber: 0 },
  { id: 'f041', name: 'Peanut Butter', calories_per_100g: 588, protein: 25, carbs: 20, fat: 50, fiber: 6 },
  { id: 'f042', name: 'Ghee', calories_per_100g: 900, protein: 0, carbs: 0, fat: 100, fiber: 0 },
  { id: 'f043', name: 'Avocado', calories_per_100g: 160, protein: 2, carbs: 9, fat: 15, fiber: 6.7 },
  // Fruits
  { id: 'f044', name: 'Banana', calories_per_100g: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6 },
  { id: 'f045', name: 'Apple', calories_per_100g: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4 },
  { id: 'f046', name: 'Mango', calories_per_100g: 60, protein: 0.8, carbs: 15, fat: 0.4, fiber: 1.6 },
  { id: 'f047', name: 'Orange', calories_per_100g: 47, protein: 0.9, carbs: 12, fat: 0.1, fiber: 2.4 },
  { id: 'f048', name: 'Blueberries', calories_per_100g: 57, protein: 0.7, carbs: 14, fat: 0.3, fiber: 2.4 },
  { id: 'f049', name: 'Strawberries', calories_per_100g: 32, protein: 0.7, carbs: 7.7, fat: 0.3, fiber: 2 },
  // Snacks & Nuts
  { id: 'f050', name: 'Almonds', calories_per_100g: 579, protein: 21, carbs: 22, fat: 50, fiber: 12.5 },
  { id: 'f051', name: 'Cashews', calories_per_100g: 553, protein: 18, carbs: 30, fat: 44, fiber: 3.3 },
  { id: 'f052', name: 'Walnuts', calories_per_100g: 654, protein: 15, carbs: 14, fat: 65, fiber: 6.7 },
  { id: 'f053', name: 'Dark Chocolate (70%)', calories_per_100g: 600, protein: 8, carbs: 46, fat: 43, fiber: 11 },
  { id: 'f054', name: 'Rice Crackers', calories_per_100g: 382, protein: 7, carbs: 82, fat: 2, fiber: 1.8 },
  { id: 'f055', name: 'Protein Bar (generic)', calories_per_100g: 380, protein: 30, carbs: 40, fat: 10, fiber: 5 },
  { id: 'f056', name: 'Hummus', calories_per_100g: 166, protein: 8, carbs: 14, fat: 10, fiber: 6 },
  // Additional proteins
  { id: 'f057', name: 'Whey Protein Powder', calories_per_100g: 400, protein: 80, carbs: 8, fat: 5, fiber: 0 },
  { id: 'f058', name: 'Black Beans (cooked)', calories_per_100g: 132, protein: 8.9, carbs: 24, fat: 0.5, fiber: 8.7 },
  { id: 'f059', name: 'Sardines (canned)', calories_per_100g: 208, protein: 25, carbs: 0, fat: 11, fiber: 0 },
];

export interface EatingOutPreset {
  id: string;
  name: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  serving_desc: string;
}

export const EATING_OUT_PRESETS: EatingOutPreset[] = [
  // Fast Food
  { id: 'e001', name: "Big Mac", category: "Fast Food", calories: 550, protein: 27, carbs: 45, fat: 30, fiber: 3, serving_desc: "1 burger" },
  { id: 'e002', name: "McChicken", category: "Fast Food", calories: 400, protein: 21, carbs: 40, fat: 17, fiber: 2, serving_desc: "1 burger" },
  { id: 'e003', name: "Large Fries (McD)", category: "Fast Food", calories: 490, protein: 6, carbs: 66, fat: 23, fiber: 6, serving_desc: "1 serve" },
  { id: 'e004', name: "KFC Original Piece", category: "Fast Food", calories: 320, protein: 28, carbs: 11, fat: 19, fiber: 0.5, serving_desc: "1 piece" },
  { id: 'e005', name: "Subway 6\" Chicken", category: "Fast Food", calories: 310, protein: 27, carbs: 40, fat: 5, fiber: 3, serving_desc: "6 inch sub" },
  { id: 'e006', name: "Whopper (Burger King)", category: "Fast Food", calories: 657, protein: 28, carbs: 49, fat: 40, fiber: 2, serving_desc: "1 burger" },
  // Asian
  { id: 'e007', name: "Ramen Bowl", category: "Asian", calories: 550, protein: 22, carbs: 66, fat: 20, fiber: 3, serving_desc: "1 bowl" },
  { id: 'e008', name: "Pad Thai", category: "Asian", calories: 400, protein: 17, carbs: 50, fat: 14, fiber: 2, serving_desc: "1 plate" },
  { id: 'e009', name: "Fried Rice (takeaway)", category: "Asian", calories: 400, protein: 10, carbs: 60, fat: 14, fiber: 2, serving_desc: "1 serve" },
  { id: 'e010', name: "Sushi Roll (8 pcs)", category: "Asian", calories: 200, protein: 8, carbs: 38, fat: 2, fiber: 1, serving_desc: "8 pieces" },
  { id: 'e011', name: "Laksa Bowl", category: "Asian", calories: 650, protein: 25, carbs: 70, fat: 30, fiber: 3, serving_desc: "1 bowl" },
  { id: 'e012', name: "Char Kway Teow", category: "Asian", calories: 740, protein: 20, carbs: 75, fat: 40, fiber: 2, serving_desc: "1 plate" },
  { id: 'e013', name: "Pho Bowl", category: "Asian", calories: 400, protein: 28, carbs: 50, fat: 8, fiber: 2, serving_desc: "1 bowl" },
  { id: 'e014', name: "Banh Mi", category: "Asian", calories: 430, protein: 20, carbs: 55, fat: 15, fiber: 3, serving_desc: "1 roll" },
  { id: 'e015', name: "Dumplings (6 pcs, steamed)", category: "Asian", calories: 280, protein: 14, carbs: 35, fat: 9, fiber: 2, serving_desc: "6 pieces" },
  // South Asian
  { id: 'e016', name: "Dal Bhat Set", category: "South Asian", calories: 600, protein: 22, carbs: 95, fat: 12, fiber: 8, serving_desc: "1 set" },
  { id: 'e017', name: "Butter Chicken (1 serve)", category: "South Asian", calories: 380, protein: 28, carbs: 14, fat: 22, fiber: 2, serving_desc: "1 serve" },
  { id: 'e018', name: "Samosa (1 pc)", category: "South Asian", calories: 200, protein: 4, carbs: 24, fat: 10, fiber: 2, serving_desc: "1 piece" },
  { id: 'e019', name: "Biryani (chicken)", category: "South Asian", calories: 500, protein: 26, carbs: 60, fat: 16, fiber: 3, serving_desc: "1 serve" },
  { id: 'e020', name: "Palak Paneer (1 serve)", category: "South Asian", calories: 320, protein: 14, carbs: 14, fat: 23, fiber: 4, serving_desc: "1 serve" },
  // Cafe
  { id: 'e021', name: "Flat White (full cream)", category: "Cafe", calories: 120, protein: 6, carbs: 10, fat: 6, fiber: 0, serving_desc: "1 cup" },
  { id: 'e022', name: "Banana Bread Slice", category: "Cafe", calories: 320, protein: 5, carbs: 55, fat: 10, fiber: 2, serving_desc: "1 slice" },
  { id: 'e023', name: "Avocado Toast", category: "Cafe", calories: 380, protein: 10, carbs: 42, fat: 20, fiber: 7, serving_desc: "1 serve" },
  { id: 'e024', name: "Eggs Benedict", category: "Cafe", calories: 450, protein: 22, carbs: 30, fat: 27, fiber: 1, serving_desc: "1 serve" },
  { id: 'e025', name: "Acai Bowl", category: "Cafe", calories: 450, protein: 7, carbs: 75, fat: 14, fiber: 8, serving_desc: "1 bowl" },
  // Other
  { id: 'e026', name: "Meat Pie", category: "Other", calories: 480, protein: 16, carbs: 40, fat: 28, fiber: 2, serving_desc: "1 pie" },
  { id: 'e027', name: "Sausage Roll", category: "Other", calories: 310, protein: 10, carbs: 28, fat: 18, fiber: 1, serving_desc: "1 roll" },
  { id: 'e028', name: "Fish & Chips", category: "Other", calories: 800, protein: 30, carbs: 80, fat: 40, fiber: 5, serving_desc: "1 serve" },
  { id: 'e029', name: "Caesar Salad", category: "Other", calories: 350, protein: 12, carbs: 18, fat: 26, fiber: 3, serving_desc: "1 serve" },
  { id: 'e030', name: "Pizza Margherita (2 slices)", category: "Other", calories: 500, protein: 20, carbs: 62, fat: 18, fiber: 4, serving_desc: "2 slices" },
];
