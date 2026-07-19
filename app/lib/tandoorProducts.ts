import type { Product } from "./types";

/**
 * Full menu for The Tandoor Company (second restaurant/brand).
 * These are seeded alongside the Eat to go catalogue.
 */
export const TANDOOR_PRODUCTS: Product[] = [
  // ---------------------------------------------------------------- Soft Drinks
  { id: "tdc-cola", brand: "tandoor", category: "Soft Drinks", name: "Cola", description: "Soft drink Cola", price: 4 },
  { id: "tdc-cola-zero", brand: "tandoor", category: "Soft Drinks", name: "Cola Zero", description: "Soft drink Cola Zero", price: 4 },
  { id: "tdc-fanta-orange", brand: "tandoor", category: "Soft Drinks", name: "Fanta Orange", description: "Soft drink Fanta Orange", price: 4 },
  { id: "tdc-fernandes-blauw", brand: "tandoor", category: "Soft Drinks", name: "Fernandes blauw", description: "Soft drink Fernandes blauw", price: 5 },
  { id: "tdc-fernandes-groen", brand: "tandoor", category: "Soft Drinks", name: "Fernandes Groen", description: "Soft drink Fernandes Groen", price: 4 },
  { id: "tdc-fernandes-rood", brand: "tandoor", category: "Soft Drinks", name: "Fernandes Rood", description: "Soft drink Fernandes Rood", price: 4 },
  { id: "tdc-gingerale", brand: "tandoor", category: "Soft Drinks", name: "Gingerale", description: "Soft drink Gingerale", price: 4 },
  { id: "tdc-ice-tea-green", brand: "tandoor", category: "Soft Drinks", name: "Ice Tea Green", description: "Soft drink Ice Tea Green", price: 4 },
  { id: "tdc-ice-tea-lemon", brand: "tandoor", category: "Soft Drinks", name: "Ice Tea Lemon", description: "Soft drink Ice Tea Lemon", price: 4 },
  { id: "tdc-ice-tea-peach", brand: "tandoor", category: "Soft Drinks", name: "Ice Tea Peach", description: "Soft drink Ice Tea Peach", price: 4 },
  { id: "tdc-sprite", brand: "tandoor", category: "Soft Drinks", name: "Sprite", description: "Soft drink Sprite", price: 4 },

  // ---------------------------------------------------------------- Lassi
  { id: "tdc-lassi-coconut", brand: "tandoor", category: "Lassi", name: "Lassi Coconut", description: "Coconut lassi", price: 5 },
  { id: "tdc-lassi-mango", brand: "tandoor", category: "Lassi", name: "Lassi Mango", description: "Mango lassi", price: 5 },

  // ---------------------------------------------------------------- Wine Bottles
  { id: "tdc-fles-champagne", brand: "tandoor", category: "Wine Bottles", name: "Fles Champagne", description: "Bottle Champagne", price: 59 },
  { id: "tdc-fles-witte-wijn", brand: "tandoor", category: "Wine Bottles", name: "Fles droge witte wijn", description: "Bottle dry white wine", price: 28 },
  { id: "tdc-fles-huiswijn-rood", brand: "tandoor", category: "Wine Bottles", name: "Fles huiswijn rood", description: "Bottle house red wine", price: 28 },
  { id: "tdc-fles-huiswijn-rose", brand: "tandoor", category: "Wine Bottles", name: "Fles huiswijn rosé", description: "Bottle house rosé wine", price: 28 },
  { id: "tdc-fles-prosecco", brand: "tandoor", category: "Wine Bottles", name: "Fles Prosecco", description: "Bottle Prosecco", price: 59 },

  // ---------------------------------------------------------------- Soups
  { id: "tdc-chicken-soup", brand: "tandoor", category: "Soups", name: "Chicken Soup", description: "Homemade chicken soup with egg and spices", price: 9 },
  { id: "tdc-golden-lentil-essence", brand: "tandoor", category: "Soups", name: "Golden Lentil Essence", description: "Yellow lentil soup with turmeric and coriander", price: 7 },

  // ---------------------------------------------------------------- Vegetarian Starters
  { id: "tdc-baingan-pakora", brand: "tandoor", category: "Vegetarian Starters", name: "Baingan Pakora", description: "Brinjal pakora fritters", price: 10 },
  { id: "tdc-onion-bhaji", brand: "tandoor", category: "Vegetarian Starters", name: "Onion Bhaji", description: "Crispy onion fritters with tamarind dip", price: 9 },
  { id: "tdc-paneer-tikka-starter", brand: "tandoor", category: "Vegetarian Starters", name: "Paneer Tikka", description: "Paneer tikka from the tandoor", price: 10 },
  { id: "tdc-samosa-2", brand: "tandoor", category: "Vegetarian Starters", name: "Samosa (2 stuks)", description: "Vegetable samosas (2 pcs) with tamarind sauce", price: 9 },
  { id: "tdc-samosa-chaat", brand: "tandoor", category: "Vegetarian Starters", name: "Samosa Chaat", description: "Samosa chaat with chickpeas and yogurt sauces", price: 10 },

  // ---------------------------------------------------------------- Tandoori Starters
  { id: "tdc-chicken-tikka-starter", brand: "tandoor", category: "Tandoori Starters", name: "Chicken Tikka", description: "Chicken tikka from the tandoor", price: 11 },
  { id: "tdc-king-prawn-butterfly", brand: "tandoor", category: "Tandoori Starters", name: "King Prawn Butterfly", description: "Butterflied prawns in light batter", price: 12 },
  { id: "tdc-royal-wings", brand: "tandoor", category: "Tandoori Starters", name: "Royal Wings", description: "Tandoori grilled chicken wings", price: 11 },
  { id: "tdc-seekh-kebab-chicken-starter", brand: "tandoor", category: "Tandoori Starters", name: "Seekh Kebab Chicken", description: "Chicken seekh kebab skewer", price: 11 },
  { id: "tdc-seekh-kebab-lamb-starter", brand: "tandoor", category: "Tandoori Starters", name: "Seekh Kebab Lamb", description: "Lamb seekh kebab skewer", price: 12 },

  // ---------------------------------------------------------------- Starters for Two
  { id: "tdc-mixed-starter-2p", brand: "tandoor", category: "Starters for Two", name: "Mixed Starter (2p)", description: "Mixed non-veg starter for 2 persons", price: 25 },
  { id: "tdc-veg-mixed-starter-2p", brand: "tandoor", category: "Starters for Two", name: "Veg Mixed Starter (2p)", description: "Mixed vegetarian starter for 2 persons", price: 23 },

  // ---------------------------------------------------------------- Tandoori Mains
  { id: "tdc-tandoori-chicken-tikka", brand: "tandoor", category: "Tandoori Mains", name: "Tandoori Chicken Tikka", description: "Tandoori chicken tikka main", price: 25 },
  { id: "tdc-tandoori-fish", brand: "tandoor", category: "Tandoori Mains", name: "Tandoori Fish", description: "Tandoori seasonal fish", price: 29 },
  { id: "tdc-tandoori-garlic-chicken-tikka", brand: "tandoor", category: "Tandoori Mains", name: "Tandoori Garlic Chicken Tikka", description: "Garlic chicken tikka from tandoor", price: 26 },
  { id: "tdc-tandoori-garlic-king-prawns", brand: "tandoor", category: "Tandoori Mains", name: "Tandoori Garlic King Prawns", description: "Garlic king prawns from tandoor", price: 31 },
  { id: "tdc-tandoori-king-prawns", brand: "tandoor", category: "Tandoori Mains", name: "Tandoori King Prawns", description: "Tandoori king prawns", price: 30 },
  { id: "tdc-tandoori-lamb-chops", brand: "tandoor", category: "Tandoori Mains", name: "Tandoori Lamb Chops", description: "Tandoori lamb chops", price: 31 },
  { id: "tdc-tandoori-royal-chicken-legs", brand: "tandoor", category: "Tandoori Mains", name: "Tandoori Royal Chicken Legs", description: "Tandoori royal chicken legs", price: 25 },
  { id: "tdc-tandoori-seekh-kebab-chicken", brand: "tandoor", category: "Tandoori Mains", name: "Tandoori Seekh Kebab Chicken", description: "Tandoori chicken seekh kebab", price: 26 },
  { id: "tdc-tandoori-seekh-kebab-lamb", brand: "tandoor", category: "Tandoori Mains", name: "Tandoori Seekh Kebab Lamb", description: "Tandoori lamb seekh kebab", price: 29 },

  // ---------------------------------------------------------------- Tandoori Platters
  { id: "tdc-tandoori-mixed-grill", brand: "tandoor", category: "Tandoori Platters", name: "Tandoori Mixed Grill", description: "Tandoori mixed grill platter", price: 32 },

  // ---------------------------------------------------------------- Curries
  { id: "tdc-butter-chicken", brand: "tandoor", category: "Curries", name: "Butter Chicken", description: "Butter chicken curry", price: 26 },
  { id: "tdc-jalfrezi-chicken", brand: "tandoor", category: "Curries", name: "Jalfrezi Chicken", description: "Jalfrezi with chicken", price: 25 },
  { id: "tdc-jalfrezi-fish", brand: "tandoor", category: "Curries", name: "Jalfrezi Fish", description: "Jalfrezi with fish", price: 26 },
  { id: "tdc-jalfrezi-lamb", brand: "tandoor", category: "Curries", name: "Jalfrezi Lamb", description: "Jalfrezi with lamb", price: 27 },
  { id: "tdc-jalfrezi-prawn", brand: "tandoor", category: "Curries", name: "Jalfrezi Prawn", description: "Jalfrezi with prawns", price: 28 },
  { id: "tdc-karahi-chicken", brand: "tandoor", category: "Curries", name: "Karahi Chicken", description: "Karahi curry with chicken", price: 25 },
  { id: "tdc-karahi-fish", brand: "tandoor", category: "Curries", name: "Karahi Fish", description: "Karahi curry with fish", price: 26 },
  { id: "tdc-karahi-lamb", brand: "tandoor", category: "Curries", name: "Karahi Lamb", description: "Karahi curry with lamb", price: 27 },
  { id: "tdc-karahi-prawn", brand: "tandoor", category: "Curries", name: "Karahi Prawn", description: "Karahi curry with prawns", price: 28 },
  { id: "tdc-korma-chicken", brand: "tandoor", category: "Curries", name: "Korma Chicken", description: "Korma curry with chicken", price: 25 },
  { id: "tdc-korma-lamb", brand: "tandoor", category: "Curries", name: "Korma Lamb", description: "Korma curry with lamb", price: 27 },
  { id: "tdc-korma-prawn", brand: "tandoor", category: "Curries", name: "Korma Prawn", description: "Korma curry with prawns", price: 28 },
  { id: "tdc-lemon-curry-chicken", brand: "tandoor", category: "Curries", name: "Lemon Curry Chicken", description: "Lemon curry with chicken", price: 25 },
  { id: "tdc-lemon-curry-fish", brand: "tandoor", category: "Curries", name: "Lemon Curry Fish", description: "Lemon curry with fish", price: 26 },
  { id: "tdc-lemon-curry-lamb", brand: "tandoor", category: "Curries", name: "Lemon Curry Lamb", description: "Lemon curry with lamb", price: 27 },
  { id: "tdc-lemon-curry-prawn", brand: "tandoor", category: "Curries", name: "Lemon Curry Prawn", description: "Lemon curry with prawns", price: 28 },
  { id: "tdc-madras-chicken", brand: "tandoor", category: "Curries", name: "Madras Chicken", description: "Madras curry with chicken", price: 25 },
  { id: "tdc-madras-fish", brand: "tandoor", category: "Curries", name: "Madras Fish", description: "Madras curry with fish", price: 26 },
  { id: "tdc-madras-lamb", brand: "tandoor", category: "Curries", name: "Madras Lamb", description: "Madras curry with lamb", price: 27 },
  { id: "tdc-madras-prawn", brand: "tandoor", category: "Curries", name: "Madras Prawn", description: "Madras curry with prawns", price: 28 },
  { id: "tdc-saag-curry-chicken", brand: "tandoor", category: "Curries", name: "Saag Curry Chicken", description: "Saag curry with chicken", price: 25 },
  { id: "tdc-saag-curry-fish", brand: "tandoor", category: "Curries", name: "Saag Curry Fish", description: "Saag curry with fish", price: 26 },
  { id: "tdc-saag-curry-lamb", brand: "tandoor", category: "Curries", name: "Saag Curry Lamb", description: "Saag curry with lamb", price: 27 },
  { id: "tdc-saag-curry-prawn", brand: "tandoor", category: "Curries", name: "Saag Curry Prawn", description: "Saag curry with prawns", price: 28 },
  { id: "tdc-shah-special-chicken", brand: "tandoor", category: "Curries", name: "Shah Special Curry Chicken", description: "Shah special curry with chicken", price: 27 },
  { id: "tdc-tikka-masala-chicken", brand: "tandoor", category: "Curries", name: "Tikka Masala Chicken", description: "Tikka masala with chicken", price: 25 },
  { id: "tdc-tikka-masala-fish", brand: "tandoor", category: "Curries", name: "Tikka Masala Fish", description: "Tikka masala with fish", price: 26 },
  { id: "tdc-tikka-masala-lamb", brand: "tandoor", category: "Curries", name: "Tikka Masala Lamb", description: "Tikka masala with lamb", price: 27 },
  { id: "tdc-tikka-masala-prawn", brand: "tandoor", category: "Curries", name: "Tikka Masala Prawn", description: "Tikka masala with prawns", price: 28 },
  { id: "tdc-vindaloo-chicken", brand: "tandoor", category: "Curries", name: "Vindaloo Chicken", description: "Vindaloo curry with chicken", price: 25 },
  { id: "tdc-vindaloo-fish", brand: "tandoor", category: "Curries", name: "Vindaloo Fish", description: "Vindaloo curry with fish", price: 26 },
  { id: "tdc-vindaloo-lamb", brand: "tandoor", category: "Curries", name: "Vindaloo Lamb", description: "Vindaloo curry with lamb", price: 27 },
  { id: "tdc-vindaloo-prawn", brand: "tandoor", category: "Curries", name: "Vindaloo Prawn", description: "Vindaloo curry with prawns", price: 28 },

  // ---------------------------------------------------------------- Vegetarian Mains
  { id: "tdc-alu-gobi", brand: "tandoor", category: "Vegetarian Mains", name: "Alu Gobi", description: "Potato and cauliflower curry", price: 19 },
  { id: "tdc-bharta", brand: "tandoor", category: "Vegetarian Mains", name: "Bharta", description: "Smoky roasted aubergine curry", price: 21 },
  { id: "tdc-chana-masala", brand: "tandoor", category: "Vegetarian Mains", name: "Chana Masala", description: "Chickpea chana masala", price: 20 },
  { id: "tdc-dal-makhni", brand: "tandoor", category: "Vegetarian Mains", name: "Dal Makhni", description: "Black lentil dal makhni", price: 20 },
  { id: "tdc-dal-tarka", brand: "tandoor", category: "Vegetarian Mains", name: "Dal Tarka", description: "Yellow lentil dal tarka", price: 19 },
  { id: "tdc-paneer-jalfrezi", brand: "tandoor", category: "Vegetarian Mains", name: "Paneer Jalfrezi", description: "Paneer jalfrezi stir-fry", price: 23 },
  { id: "tdc-paneer-makhni", brand: "tandoor", category: "Vegetarian Mains", name: "Paneer Makhni", description: "Paneer in makhni sauce", price: 24 },
  { id: "tdc-saag-alu", brand: "tandoor", category: "Vegetarian Mains", name: "Saag Alu", description: "Spinach curry with potatoes", price: 19 },
  { id: "tdc-saag-paneer-main", brand: "tandoor", category: "Vegetarian Mains", name: "Saag Paneer", description: "Spinach curry with paneer", price: 21 },
  { id: "tdc-vegetable-korma", brand: "tandoor", category: "Vegetarian Mains", name: "Vegetable Korma", description: "Mixed vegetable korma", price: 20.5 },

  // ---------------------------------------------------------------- Biryani
  { id: "tdc-biryani-chicken", brand: "tandoor", category: "Biryani", name: "Biryani Chicken", description: "Chicken biryani", price: 24 },
  { id: "tdc-biryani-king-prawn", brand: "tandoor", category: "Biryani", name: "Biryani King Prawn", description: "King prawn biryani", price: 27 },
  { id: "tdc-biryani-lamb", brand: "tandoor", category: "Biryani", name: "Biryani Lamb", description: "Lamb biryani", price: 26 },
  { id: "tdc-biryani-mixed-veg", brand: "tandoor", category: "Biryani", name: "Biryani Mixed Vegetables", description: "Mixed vegetable biryani", price: 23 },

  // ---------------------------------------------------------------- Sides
  { id: "tdc-achar", brand: "tandoor", category: "Sides", name: "Achar", description: "Mango and lemon pickle", price: 4 },
  { id: "tdc-green-chutney", brand: "tandoor", category: "Sides", name: "Green Chutney", description: "Green chutney dip", price: 2 },
  { id: "tdc-mango-chutney", brand: "tandoor", category: "Sides", name: "Mango Chutney", description: "Mango chutney", price: 6 },
  { id: "tdc-papadam-2", brand: "tandoor", category: "Sides", name: "Papadam (2 stuks)", description: "Papadam (2 pieces)", price: 3 },
  { id: "tdc-raita", brand: "tandoor", category: "Sides", name: "Raita", description: "Raita with cucumber and herbs", price: 6 },
  { id: "tdc-red-onion-salad", brand: "tandoor", category: "Sides", name: "Red Onion Salad", description: "Red onion salad", price: 6 },
  { id: "tdc-yoghurt-sauce", brand: "tandoor", category: "Sides", name: "Yoghurt Sauce", description: "Yoghurt sauce with mint", price: 2 },

  // ---------------------------------------------------------------- Bread
  { id: "tdc-butter-naan", brand: "tandoor", category: "Bread", name: "Butter Naan", description: "Butter naan bread", price: 4 },
  { id: "tdc-cheese-garlic-naan", brand: "tandoor", category: "Bread", name: "Cheese Garlic Naan", description: "Cheese garlic naan bread", price: 6 },
  { id: "tdc-cheese-naan", brand: "tandoor", category: "Bread", name: "Cheese Naan", description: "Cheese naan bread", price: 5 },
  { id: "tdc-garlic-naan", brand: "tandoor", category: "Bread", name: "Garlic Naan", description: "Garlic naan bread", price: 5 },
  { id: "tdc-keema-naan", brand: "tandoor", category: "Bread", name: "Keema Naan", description: "Keema stuffed naan bread", price: 8 },
  { id: "tdc-peshwari-naan", brand: "tandoor", category: "Bread", name: "Peshwari Naan", description: "Peshwari naan bread", price: 6 },

  // ---------------------------------------------------------------- Desserts
  { id: "tdc-gulab-jamun", brand: "tandoor", category: "Desserts", name: "Gulab Jamun", description: "Gulab jamun dessert", price: 9 },
  { id: "tdc-ladoo", brand: "tandoor", category: "Desserts", name: "Ladoo", description: "Indian sweet ladoo", price: 9 },
];

/** Ordered list of The Tandoor Company categories for the menu sidebar. */
export const TANDOOR_CATEGORY_ORDER: string[] = [
  "Soups",
  "Vegetarian Starters",
  "Tandoori Starters",
  "Starters for Two",
  "Tandoori Mains",
  "Tandoori Platters",
  "Curries",
  "Vegetarian Mains",
  "Biryani",
  "Sides",
  "Bread",
  "Desserts",
  "Drinks",
];
