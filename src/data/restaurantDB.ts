export interface RestaurantItem {
  name: string;
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface RestaurantBrand {
  brand: string;
  emoji: string;
  items: RestaurantItem[];
}

export const RESTAURANT_DB: RestaurantBrand[] = [
  {
    brand: "McDonald's",
    emoji: '🍟',
    items: [
      { name: 'Big Mac',                    cal: 508, protein: 27,   carbs: 42, fat: 25 },
      { name: 'Quarter Pounder',            cal: 520, protein: 30,   carbs: 40, fat: 26 },
      { name: 'Double Quarter Pounder',     cal: 740, protein: 48,   carbs: 41, fat: 42 },
      { name: 'McChicken',                  cal: 399, protein: 18,   carbs: 41, fat: 18 },
      { name: 'McCrispy',                   cal: 500, protein: 28,   carbs: 50, fat: 22 },
      { name: 'McSpicy',                    cal: 520, protein: 27,   carbs: 51, fat: 24 },
      { name: 'Cheeseburger',               cal: 303, protein: 15,   carbs: 32, fat: 13 },
      { name: 'Double Cheeseburger',        cal: 445, protein: 25,   carbs: 33, fat: 23 },
      { name: 'Filet-O-Fish',               cal: 329, protein: 15,   carbs: 36, fat: 14 },
      { name: 'Grand Big Mac',              cal: 741, protein: 41,   carbs: 54, fat: 40 },
      { name: 'Small Fries',                cal: 230, protein: 3,    carbs: 30, fat: 11 },
      { name: 'Medium Fries',               cal: 320, protein: 4,    carbs: 42, fat: 15 },
      { name: 'Large Fries',                cal: 430, protein: 5,    carbs: 56, fat: 20 },
      { name: '6 McNuggets',                cal: 259, protein: 14,   carbs: 16, fat: 15 },
      { name: '10 McNuggets',               cal: 431, protein: 24,   carbs: 26, fat: 25 },
      { name: 'Hash Brown',                 cal: 143, protein: 1.5,  carbs: 15, fat: 8  },
      { name: 'Bacon & Egg McMuffin',       cal: 310, protein: 17,   carbs: 29, fat: 14 },
      { name: 'Sausage McMuffin',           cal: 370, protein: 17,   carbs: 30, fat: 20 },
      { name: 'Hotcakes (3)',               cal: 430, protein: 9,    carbs: 73, fat: 12 },
      { name: 'Brekkie McWrap',             cal: 480, protein: 24,   carbs: 44, fat: 23 },
      { name: 'McFlurry Oreo (Regular)',    cal: 340, protein: 8,    carbs: 53, fat: 11 },
      { name: 'Soft Serve Cone',            cal: 130, protein: 3,    carbs: 20, fat: 4  },
      { name: 'Flat White (Medium)',        cal: 120, protein: 6,    carbs: 10, fat: 6  },
    ],
  },
  {
    brand: 'KFC',
    emoji: '🍗',
    items: [
      { name: 'Original Recipe Piece',       cal: 215, protein: 17,   carbs: 7,  fat: 13   },
      { name: 'Zinger Fillet',               cal: 209, protein: 20,   carbs: 14, fat: 8    },
      { name: '3 Wicked Wings',              cal: 396, protein: 28,   carbs: 10, fat: 28   },
      { name: '3 Original Tenders',          cal: 405, protein: 28,   carbs: 18, fat: 24   },
      { name: '6 Nuggets',                   cal: 319, protein: 17,   carbs: 22, fat: 18   },
      { name: 'Original Recipe Burger',      cal: 408, protein: 22,   carbs: 38, fat: 19   },
      { name: 'Zinger Burger',               cal: 435, protein: 22,   carbs: 41, fat: 21   },
      { name: 'Zinger Stacker',              cal: 620, protein: 34,   carbs: 46, fat: 32   },
      { name: 'Regular Chips',               cal: 290, protein: 4,    carbs: 38, fat: 14   },
      { name: 'Large Chips',                 cal: 430, protein: 6,    carbs: 56, fat: 20   },
      { name: 'Regular Coleslaw',            cal: 97,  protein: 1,    carbs: 10, fat: 6    },
      { name: 'Regular Potato & Gravy',      cal: 71,  protein: 1.5,  carbs: 11, fat: 2    },
      { name: 'Regular Popcorn Chicken',     cal: 412, protein: 20,   carbs: 30, fat: 23   },
      { name: 'Zinger Crunch Bowl',          cal: 399, protein: 24,   carbs: 25, fat: 22   },
      { name: '3 Piece Hot & Crispy',        cal: 387, protein: 25.5, carbs: 20.5, fat: 22.5 },
      { name: '3 Piece Box Meal',            cal: 850, protein: 42,   carbs: 75, fat: 42   },
    ],
  },
  {
    brand: 'Oporto',
    emoji: '🔥',
    items: [
      { name: 'Bondi Burger (Single)',       cal: 430, protein: 25, carbs: 38, fat: 18 },
      { name: 'Bondi Burger (Double)',       cal: 650, protein: 35, carbs: 50, fat: 30 },
      { name: 'Prego Burger (Single)',       cal: 430, protein: 25, carbs: 35, fat: 19 },
      { name: 'Grilled Chicken Rappa',       cal: 421, protein: 27, carbs: 34, fat: 19 },
      { name: '3 Crispy Tenders',            cal: 240, protein: 30, carbs: 14, fat: 6  },
      { name: 'Grilled Chicken Strips',      cal: 240, protein: 42, carbs: 2,  fat: 6  },
      { name: 'Pulled Chicken Bowl',         cal: 570, protein: 35, carbs: 65, fat: 14 },
      { name: 'Grilled Chicken Bowl',        cal: 450, protein: 38, carbs: 40, fat: 12 },
      { name: 'Regular Chips',               cal: 342, protein: 5,  carbs: 32, fat: 21 },
      { name: 'Large Chips',                 cal: 476, protein: 7,  carbs: 45, fat: 29 },
      { name: 'Regular Coleslaw',            cal: 120, protein: 1,  carbs: 12, fat: 7  },
    ],
  },
  {
    brand: 'Guzman y Gomez',
    emoji: '🌯',
    items: [
      { name: 'Chicken Burrito',             cal: 610, protein: 38, carbs: 70, fat: 16 },
      { name: 'Beef Burrito',                cal: 650, protein: 35, carbs: 72, fat: 20 },
      { name: 'Veggie Burrito',              cal: 530, protein: 18, carbs: 78, fat: 14 },
      { name: 'Chicken Cali Burrito',        cal: 780, protein: 38, carbs: 80, fat: 30 },
      { name: 'Beef Cali Burrito',           cal: 820, protein: 35, carbs: 82, fat: 34 },
      { name: 'Chicken Taco (each)',         cal: 195, protein: 13, carbs: 22, fat: 6  },
      { name: 'Beef Taco (each)',            cal: 210, protein: 12, carbs: 23, fat: 8  },
      { name: 'Chicken Naked Burrito Bowl',  cal: 450, protein: 38, carbs: 45, fat: 12 },
      { name: 'Beef Naked Burrito Bowl',     cal: 490, protein: 35, carbs: 47, fat: 16 },
      { name: 'Chicken Nachos (Regular)',    cal: 820, protein: 35, carbs: 80, fat: 38 },
      { name: 'Beef Nachos (Regular)',       cal: 860, protein: 32, carbs: 82, fat: 42 },
      { name: 'Chicken Quesadilla',          cal: 560, protein: 30, carbs: 48, fat: 26 },
      { name: 'Chicken Enchilada',           cal: 950, protein: 42, carbs: 95, fat: 38 },
      { name: 'Regular Salted Fries',        cal: 350, protein: 5,  carbs: 46, fat: 16 },
      { name: 'Large Salted Fries',          cal: 538, protein: 7,  carbs: 70, fat: 25 },
      { name: 'Corn Chips',                  cal: 480, protein: 7,  carbs: 57, fat: 28 },
      { name: 'Chicken Salad',               cal: 320, protein: 28, carbs: 18, fat: 14 },
    ],
  },
  {
    brand: 'Subway',
    emoji: '🥖',
    items: [
      { name: '6" Chicken Classic',          cal: 310, protein: 23, carbs: 40, fat: 5  },
      { name: 'Footlong Chicken Classic',    cal: 620, protein: 46, carbs: 80, fat: 10 },
      { name: '6" Steak & Cheese',           cal: 380, protein: 26, carbs: 42, fat: 11 },
      { name: '6" Italian BMT',              cal: 430, protein: 22, carbs: 41, fat: 18 },
      { name: '6" Veggie Delite',            cal: 230, protein: 9,  carbs: 40, fat: 3  },
      { name: '6" Meatball Marinara',        cal: 480, protein: 22, carbs: 58, fat: 18 },
      { name: '6" Tuna',                     cal: 390, protein: 19, carbs: 40, fat: 16 },
    ],
  },
  {
    brand: "Domino's",
    emoji: '🍕',
    items: [
      { name: 'Margherita (2 slices, Trad.)',    cal: 440, protein: 18, carbs: 58, fat: 16 },
      { name: 'Pepperoni (2 slices, Trad.)',     cal: 510, protein: 22, carbs: 57, fat: 22 },
      { name: 'BBQ Chicken (2 slices, Trad.)',   cal: 480, protein: 24, carbs: 58, fat: 18 },
      { name: 'Chicken & Bacon (2 slices, Trad.)', cal: 500, protein: 26, carbs: 57, fat: 20 },
      { name: 'Garlic Bread (4 pieces)',         cal: 380, protein: 8,  carbs: 52, fat: 16 },
      { name: 'Chicken Kicker (4 pieces)',       cal: 220, protein: 18, carbs: 10, fat: 12 },
    ],
  },
  {
    brand: "Hungry Jack's",
    emoji: '🍔',
    items: [
      { name: 'Whopper',                    cal: 680, protein: 34, carbs: 52, fat: 36 },
      { name: 'Whopper Jr',                 cal: 380, protein: 18, carbs: 32, fat: 20 },
      { name: 'Double Whopper',             cal: 900, protein: 54, carbs: 52, fat: 52 },
      { name: 'Chicken Royale',             cal: 480, protein: 24, carbs: 46, fat: 22 },
      { name: 'Grilled Chicken Burger',     cal: 380, protein: 28, carbs: 38, fat: 12 },
      { name: 'Small Onion Rings',          cal: 260, protein: 3,  carbs: 32, fat: 13 },
      { name: 'Medium Chips',               cal: 340, protein: 4,  carbs: 44, fat: 16 },
    ],
  },
  {
    brand: 'Zambrero',
    emoji: '🌮',
    items: [
      { name: 'Chicken Burrito',            cal: 590, protein: 36, carbs: 68, fat: 15 },
      { name: 'Beef Burrito',               cal: 630, protein: 33, carbs: 70, fat: 19 },
      { name: 'Chicken Bowl',               cal: 430, protein: 36, carbs: 44, fat: 10 },
      { name: 'Chicken Tacos (2)',           cal: 380, protein: 26, carbs: 42, fat: 10 },
      { name: 'Chicken Quesadilla',         cal: 540, protein: 30, carbs: 50, fat: 22 },
      { name: 'Chicken Nachos',             cal: 780, protein: 32, carbs: 76, fat: 36 },
    ],
  },
  {
    brand: "Nando's",
    emoji: '🐔',
    items: [
      { name: '1/4 Chicken (Flame Grilled)', cal: 290,  protein: 38,  carbs: 2,  fat: 14 },
      { name: '1/2 Chicken (Flame Grilled)', cal: 580,  protein: 76,  carbs: 4,  fat: 28 },
      { name: 'Whole Chicken',               cal: 1160, protein: 152, carbs: 8,  fat: 56 },
      { name: 'Chicken Burger',              cal: 490,  protein: 32,  carbs: 46, fat: 20 },
      { name: 'Chicken Wrap',                cal: 420,  protein: 28,  carbs: 40, fat: 16 },
      { name: 'Regular Chips',               cal: 320,  protein: 5,   carbs: 44, fat: 14 },
      { name: 'Regular Coleslaw',            cal: 130,  protein: 1.5, carbs: 14, fat: 8  },
      { name: 'Peri Chips (Regular)',        cal: 350,  protein: 5,   carbs: 46, fat: 16 },
    ],
  },
];
