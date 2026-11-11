import type { BrandConfig } from "./types";

/** Built-in category icon keys are data; rendering imports belong to the icon registry. */
export const DEFAULT_BRAND_CONFIGS: BrandConfig[] = [
  {
    "id": "eattogo",
    "name": "Eat to go",
    "logo": "/eattogo.png",
    "categories": [
      {
        "name": "Wraps",
        "icon": "bowl-food"
      },
      {
        "name": "Burgers",
        "icon": "burger"
      },
      {
        "name": "Pizzas",
        "icon": "pizza",
        "subcategories": [
          {
            "name": "Indian fusion pizzas",
            "icon": "pizza"
          },
          {
            "name": "Classic pizzas",
            "icon": "pizza"
          }
        ]
      },
      {
        "name": "Drinks",
        "icon": "glass-water",
        "subcategories": [
          {
            "name": "Soft Drinks",
            "icon": "glass-water"
          },
          {
            "name": "Indian Lassi",
            "icon": "mug-hot"
          },
          {
            "name": "Matcha's",
            "icon": "leaf"
          },
          {
            "name": "Smoothies",
            "icon": "glass-water"
          },
          {
            "name": "Bubble Tea's",
            "icon": "mug-hot"
          },
          {
            "name": "Wine Bottles",
            "icon": "wine-bottle"
          }
        ]
      }
    ]
  },
  {
    "id": "tandoor",
    "name": "The Tandoor Company",
    "logo": "/tandoorcompany.png",
    "categories": [
      {
        "name": "Soups",
        "icon": "mug-hot"
      },
      {
        "name": "Vegetarian Starters",
        "icon": "leaf"
      },
      {
        "name": "Tandoori Starters",
        "icon": "drumstick"
      },
      {
        "name": "Starters for Two",
        "icon": "utensils"
      },
      {
        "name": "Tandoori Mains",
        "icon": "fire"
      },
      {
        "name": "Tandoori Platters",
        "icon": "utensils"
      },
      {
        "name": "Curries",
        "icon": "bowl-rice"
      },
      {
        "name": "Vegetarian Mains",
        "icon": "carrot"
      },
      {
        "name": "Biryani",
        "icon": "bowl-rice"
      },
      {
        "name": "Sides",
        "icon": "plate-wheat"
      },
      {
        "name": "Bread",
        "icon": "bread"
      },
      {
        "name": "Desserts",
        "icon": "ice-cream"
      },
      {
        "name": "Drinks",
        "icon": "glass-water",
        "subcategories": [
          {
            "name": "Soft Drinks",
            "icon": "glass-water"
          },
          {
            "name": "Indian Lassi",
            "icon": "mug-hot"
          },
          {
            "name": "Matcha's",
            "icon": "leaf"
          },
          {
            "name": "Smoothies",
            "icon": "glass-water"
          },
          {
            "name": "Bubble Tea's",
            "icon": "mug-hot"
          },
          {
            "name": "Wine Bottles",
            "icon": "wine-bottle"
          }
        ]
      }
    ]
  }
];

