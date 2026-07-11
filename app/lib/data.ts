import type { IconType } from "react-icons";
import {
  FaBowlFood,
  FaBowlRice,
  FaBreadSlice,
  FaBurger,
  FaCarrot,
  FaDrumstickBite,
  FaFire,
  FaFish,
  FaGlassWater,
  FaIceCream,
  FaLeaf,
  FaMugHot,
  FaPizzaSlice,
  FaPlateWheat,
  FaUtensils,
  FaWineBottle,
} from "react-icons/fa6";
import type { Brand, BrandConfig, Category, Product } from "./types";
import { TANDOOR_CATEGORY_ORDER, TANDOOR_PRODUCTS } from "./tandoorProducts";

export const CATEGORY_ORDER: Category[] = ["Wraps", "Burgers", "Pizzas", "Drinks"];

/**
 * Which website this deployment is. The database is shared across the whole
 * restaurant group (eattogo / themaison / future sites), so rows created here
 * are tagged with this id - e.g. reviews are shown only on the site they were
 * written on. Each sister site sets its own value.
 */
export const SITE_ID = "themaison";

/** Ordered fulfilment lifecycle used to advance and display order status. */
export const ORDER_STATUS_FLOW = ["new", "preparing", "delivery", "delivered"] as const;

/** Order numbers start counting up from this base (first order becomes 1001). */
export const ORDER_NUMBER_START = 1000;

/** Format a sequential order number for display, e.g. 1042 -> "ETG-1042". */
export function formatOrderNumber(n: number): string {
  return `ETG-${n}`;
}

/** Restaurant/brand metadata used to render the menu switcher and group orders. */
export interface BrandInfo {
  id: Brand;
  name: string;
  logo: string;
  categories: Category[];
}

export const BRANDS: BrandInfo[] = [
  { id: "eattogo", name: "Eat to go", logo: "/eattogo.png", categories: ["Wraps", "Burgers", "Pizzas", "Drinks"] },
  { id: "tandoor", name: "The Tandoor Company", logo: "/tandoorcompany.png", categories: TANDOOR_CATEGORY_ORDER },
];

export function brandInfo(id: Brand): BrandInfo {
  return BRANDS.find((b) => b.id === id) ?? BRANDS[0];
}

/** Drink categories (across all brands) never receive loyalty/company discounts. */
export const DRINK_CATEGORIES: Category[] = ["Drinks", "Soft Drinks", "Lassi", "Wine Bottles"];

export function isDrinkCategory(category: Category): boolean {
  return DRINK_CATEGORIES.includes(category);
}

/** Icon shown for a menu category, with a sensible fallback. */
const CATEGORY_ICONS: Record<string, IconType> = {
  // Eat to go
  Wraps: FaBowlFood,
  Burgers: FaBurger,
  Pizzas: FaPizzaSlice,
  Drinks: FaGlassWater,
  // The Tandoor Company
  Soups: FaMugHot,
  "Vegetarian Starters": FaLeaf,
  "Tandoori Starters": FaDrumstickBite,
  "Starters for Two": FaUtensils,
  "Tandoori Mains": FaFire,
  "Tandoori Platters": FaUtensils,
  Curries: FaBowlRice,
  "Vegetarian Mains": FaCarrot,
  Biryani: FaBowlRice,
  Sides: FaPlateWheat,
  Bread: FaBreadSlice,
  Desserts: FaIceCream,
  Lassi: FaMugHot,
  "Soft Drinks": FaGlassWater,
  "Wine Bottles": FaWineBottle,
  Fish: FaFish,
};

export function getCategoryIcon(category: Category): IconType {
  return CATEGORY_ICONS[category] ?? FaUtensils;
}

/* ------------------------------------------------------------------ dynamic brands & category icons */

/** Icons an admin can pick for a category (stored by `id` in the database). */
export const CATEGORY_ICON_CHOICES: { id: string; Icon: IconType }[] = [
  { id: "utensils", Icon: FaUtensils },
  { id: "bowl-food", Icon: FaBowlFood },
  { id: "burger", Icon: FaBurger },
  { id: "pizza", Icon: FaPizzaSlice },
  { id: "glass-water", Icon: FaGlassWater },
  { id: "mug-hot", Icon: FaMugHot },
  { id: "leaf", Icon: FaLeaf },
  { id: "drumstick", Icon: FaDrumstickBite },
  { id: "fire", Icon: FaFire },
  { id: "bowl-rice", Icon: FaBowlRice },
  { id: "carrot", Icon: FaCarrot },
  { id: "plate-wheat", Icon: FaPlateWheat },
  { id: "bread", Icon: FaBreadSlice },
  { id: "ice-cream", Icon: FaIceCream },
  { id: "wine-bottle", Icon: FaWineBottle },
  { id: "fish", Icon: FaFish },
];

/** Resolve an icon key (e.g. "burger") to its component, or undefined. */
export function iconByKey(key?: string): IconType | undefined {
  return CATEGORY_ICON_CHOICES.find((c) => c.id === key)?.Icon;
}

/** Icon key used when seeding the built-in category names. */
function defaultIconKey(category: string): string {
  const icon = CATEGORY_ICONS[category];
  return CATEGORY_ICON_CHOICES.find((c) => c.Icon === icon)?.id ?? "utensils";
}

/** Built-in restaurants used to seed the `brands` table on first run. */
export const DEFAULT_BRAND_CONFIGS: BrandConfig[] = BRANDS.map((b) => ({
  id: b.id,
  name: b.name,
  logo: b.logo,
  categories: b.categories.map((name) => ({ name, icon: defaultIconKey(name) })),
}));

/** Find a brand in the dynamic (admin-managed) list, with a safe fallback. */
export function brandById(brands: BrandConfig[], id: string): BrandConfig | undefined {
  return brands.find((b) => b.id === id);
}

/** Icon for a category using the dynamic brand config, falling back to built-ins. */
export function categoryIconFor(brands: BrandConfig[], category: string): IconType {
  for (const b of brands) {
    const cat = b.categories.find((c) => c.name === category);
    if (cat) {
      const Icon = iconByKey(cat.icon);
      if (Icon) return Icon;
    }
  }
  return getCategoryIcon(category);
}

/**
 * Default catalogue seeded into local storage on first load.
 * Admins can add or remove items afterwards.
 */
const EATTOGO_PRODUCTS: Omit<Product, "brand">[] = [
  // Wraps
  { 
    id: "saag-paneer-wrap", 
    category: "Wraps", 
    name: "Saag Paneer Wrap", 
    description: "Creamy spinach filling with spiced paneer.", 
    price: 8,
    image: "/food/wrap.png",
    detailedDescription: {
      en: "Our Saag Paneer Wrap brings the authentic taste of India to Amsterdam. Tender cubes of paneer cheese are delicately simmered in a creamy spinach sauce infused with aromatic spices like cumin, coriander, and ginger. Wrapped in a soft flour tortilla with fresh lettuce, tomato, and onion, this vegetarian delight offers a perfect balance of creamy texture and vibrant flavors. A must-try for vegetarian enthusiasts.",
      nl: "Onze Saag Paneer Wrap brengt de authentieke smaak van India naar Amsterdam. Zachte paneerblokjes worden voorzichtig gestoofd in een romige spinaziesaus met aromatische kruiden zoals komijn, koriander en gember. Gewikkeld in een zacht tortillabrood met vers sla, tomaat en ui, biedt dit vegetarische gerecht een perfecte balans tussen romige textuur en levendige smaken. Een must-try voor vegetarische liefhebbers."
    },
    ingredients: ["Paneer cheese", "Spinach", "Cream", "Cumin", "Coriander", "Ginger", "Garlic", "Tortilla", "Lettuce", "Tomato", "Onion"],
    allergens: ["Dairy", "Gluten"]
  },
  { 
    id: "butter-chicken-wrap", 
    category: "Wraps", 
    name: "Butter Chicken Wrap", 
    description: "Tender butter chicken wrapped with fresh toppings.", 
    price: 9,
    image: "/food/wrap.png",
    detailedDescription: {
      en: "Experience the silky richness of our signature Butter Chicken Wrap. Succulent chicken pieces are cooked in a velvety tomato-based sauce enriched with butter and cream, creating a dish that's both indulgent and perfectly balanced. Wrapped in a warm tortilla with crisp vegetables and our special sauce, this wrap has become a customer favorite. The combination of tender chicken and the iconic butter sauce makes every bite memorable.",
      nl: "Ervaar de zijdeachtige rijkdom van onze handtekeninggerecht Butter Chicken Wrap. Sappige kipstukken worden gekookt in een fluweelachtige tomatensaus verrijkt met boter en room, wat een gerecht creëert dat zowel weelderig als perfect uitgebalanceerd is. Gewikkeld in een warm tortillabrood met knapperige groenten en onze speciale saus, is deze wrap een favoriete geworden onder klanten. De combinatie van gaar kip en de iconische botersaus maakt elke hap onvergetelijk."
    },
    ingredients: ["Chicken breast", "Butter", "Cream", "Tomato sauce", "Ginger", "Garlic", "Spices", "Tortilla", "Lettuce", "Onion"],
    allergens: ["Dairy", "Gluten"]
  },
  { 
    id: "chicken-tikka-wrap", 
    category: "Wraps", 
    name: "Chicken Tikka Masala Wrap", 
    description: "Rich tikka masala flavor in a soft wrap.", 
    price: 9,
    image: "/food/wrap.png",
    detailedDescription: {
      en: "Our Chicken Tikka Masala Wrap delivers restaurant-quality Indian cuisine in a convenient handheld format. Chicken is marinated in yogurt and spices, then cooked until perfectly tender and wrapped in a masala sauce made from tomatoes, cream, and carefully selected spices. The result is a complex, satisfying dish with layers of flavor that slowly unfold as you enjoy each bite. Perfect for lunch or dinner.",
      nl: "Onze Chicken Tikka Masala Wrap biedt Indiase cuisine op restaurantniveau in een handig handhoudbaar formaat. Kip wordt gemarineerd in yoghurt en kruiden, en vervolgens gekookt totdat deze perfect mals is en verpakt in een masalasaus gemaakt van tomaten, room en zorgvuldig geselecteerde kruiden. Het resultaat is een complex, bevredigend gerecht met lagen van smaak die langzaam ontvouwen terwijl je elke hap geniet. Perfect voor lunch of diner."
    },
    ingredients: ["Chicken breast", "Yogurt", "Tomato sauce", "Cream", "Spices", "Ginger", "Garlic", "Tortilla", "Cilantro"],
    allergens: ["Dairy", "Gluten"]
  },
  { 
    id: "sweet-chili-chicken-wrap", 
    category: "Wraps", 
    name: "Sweet Chili Chicken Wrap", 
    description: "Sweet chili glazed chicken with crunch.", 
    price: 9,
    image: "/food/wrap.png",
    detailedDescription: {
      en: "For those who love the perfect balance of sweet and spicy, our Sweet Chili Chicken Wrap is an absolute winner. Tender chicken is glazed with our homemade sweet chili sauce, creating a tangy, slightly spicy coating that's irresistibly delicious. Combined with crispy vegetables and fresh greens wrapped in a soft tortilla, this wrap offers a delightful contrast of textures and flavors that keeps you coming back for more.",
      nl: "Voor degenen die van de perfecte balans tussen zoet en pittig houden, is onze Sweet Chili Chicken Wrap absoluut een winnaar. Gaar kip wordt geglazuurd met onze zelfgemaakte sweet chili-saus, waardoor een scherpe, licht pittige coating ontstaat die onweerstaanbaar heerlijk is. Gecombineerd met knapperige groenten en vers groen gewikkeld in een zacht tortillabrood, biedt deze wrap een aangename textuurcontrast en smaken die je steeds terugkomen."
    },
    ingredients: ["Chicken breast", "Sweet chili sauce", "Soy sauce", "Garlic", "Ginger", "Lime", "Tortilla", "Lettuce", "Cucumber", "Carrot"],
    allergens: ["Soy", "Gluten"]
  },
  { 
    id: "chicken-madras-wrap", 
    category: "Wraps", 
    name: "Chicken Madras Wrap", 
    description: "Bold and spicy chicken madras filling.", 
    price: 9,
    image: "/food/wrap.png",
    detailedDescription: {
      en: "Dare to be bold with our fiery Chicken Madras Wrap. This is not for the faint of heart-it's a powerfully flavored dish that delivers authentic Indian spice. Chicken is cooked in a rich, intense curry sauce made with traditional Madras spices, creating a dish that's hot, aromatic, and deeply satisfying. Wrapped with fresh vegetables in a soft tortilla, every bite is an adventure. Perfect for spice lovers.",
      nl: "Wees dapper met onze vurige Chicken Madras Wrap. Dit is niet voor de zwakkelingen - het is een krachtig gearomatiseerd gerecht dat authentieke Indiase kruiden aflevert. Kip wordt gekookt in een rijke, intense curry-saus gemaakt met traditionele Madras-kruiden, wat een gerecht creëert dat heet, aromatisch en diep bevredigend is. Gewikkeld met vers groenten in een zacht tortillabrood, elke hap is een avontuur. Perfect voor kruidenminnende liefhebbers."
    },
    ingredients: ["Chicken breast", "Madras spices", "Tomato sauce", "Chili peppers", "Garlic", "Ginger", "Tortilla", "Onion", "Cilantro"],
    allergens: ["Gluten"]
  },
  { 
    id: "lamb-madras-wrap", 
    category: "Wraps", 
    name: "Lamb Madras Wrap", 
    description: "Slow-cooked lamb with aromatic spices.", 
    price: 9.5,
    image: "/food/wrap.png",
    detailedDescription: {
      en: "Our Lamb Madras Wrap showcases premium slow-cooked lamb that has been marinated and cooked for hours with aromatic spices. The tender, melt-in-your-mouth lamb is combined with a bold Madras sauce, creating a sophisticated flavor profile that's both complex and deeply satisfying. Wrapped with fresh vegetables and herbs, this is comfort food elevated to gourmet status. A true delicacy for lamb enthusiasts.",
      nl: "Onze Lamb Madras Wrap toont premium langzaam gestoofd lam dat uren is gemarineerd en gekookt met aromatische kruiden. Het gare, in-je-mond smeltende lam wordt gecombineerd met een krachtige Madras-saus, waardoor een verfijnd smakenprofiel ontstaat dat zowel complex als diep bevredigend is. Gewikkeld met vers groenten en kruiden, is dit comfort food tot gourmetstatus verheven. Een ware delicatesse voor lam-liefhebbers."
    },
    ingredients: ["Lamb meat", "Madras spices", "Tomato sauce", "Chili peppers", "Ginger", "Garlic", "Cumin", "Tortilla", "Cilantro"],
    allergens: ["Gluten"]
  },
  // Burgers
  { 
    id: "chicken-rosti-burger", 
    category: "Burgers", 
    name: "Chicken Rosti Burger", 
    description: "Crispy rosti, chicken patty, fresh toppings.", 
    price: 8.5,
    image: "/food/burger.png",
    detailedDescription: {
      en: "Our Chicken Rosti Burger is a unique Dutch-Indian fusion that's absolutely delightful. A crispy rosti patty (shredded potato cake) replaces the traditional bun, creating a crunchy, golden exterior that contrasts perfectly with a juicy chicken patty inside. Topped with fresh vegetables, our special sauce, and a hint of Indian spices, this burger offers an exciting twist on a classic. A favorite among those seeking something different.",
      nl: "Onze Chicken Rosti Burger is een unieke Nederlands-Indiase fusie die absoluut heerlijk is. Een knapperige rosti-patty (geraspte aardappelkoekje) vervangt het traditionele broodje, wat een knapperig, gouden uiterlijk creëert dat perfect contrasteert met een sappige kippatty erin. Afgewerkt met vers groenten, onze speciale saus en een vleugje Indiase kruiden, biedt deze hamburger een opwindende draai op een klassieker. Een favoriet onder degenen die iets anders zoeken."
    },
    ingredients: ["Chicken patty", "Rosti potato cake", "Lettuce", "Tomato", "Onion", "Special sauce", "Spices"],
    allergens: ["Gluten", "Dairy"]
  },
  { 
    id: "chicken-burger", 
    category: "Burgers", 
    name: "Chicken Burger", 
    description: "Classic chicken burger with a juicy bite.", 
    price: 7.99,
    image: "/food/burger.png",
    detailedDescription: {
      en: "Simple, satisfying, and delicious-our Classic Chicken Burger is perfect for those who appreciate the basics done right. A juicy, grilled chicken breast sits between toasted buns with crisp lettuce, fresh tomato, and our signature sauce. No fuss, no unnecessary complexity, just good quality ingredients coming together to create a burger that never disappoints. Ideal for a quick, wholesome meal.",
      nl: "Eenvoudig, bevredigend en heerlijk - onze Classic Chicken Burger is perfect voor degenen die de basis op de juiste manier waarderen. Een sappige, gegrilde kipfilet zit tussen geroosterd brood met knapperige sla, verse tomaat en onze handtekeningssaus. Geen gedoe, geen onnodig complex, gewoon goede kwaliteitsingrediënten die samen komen om een hamburger te creëren die nooit tegenvalt. Ideaal voor een snelle, gezonde maaltijd."
    },
    ingredients: ["Chicken breast", "Burger bun", "Lettuce", "Tomato", "Onion", "Sauce"],
    allergens: ["Gluten", "Dairy"]
  },
  { 
    id: "vega-burger", 
    category: "Burgers", 
    name: "Vega Burger", 
    description: "Plant-based burger with flavor-packed toppings.", 
    price: 6.99,
    image: "/food/burger.png",
    detailedDescription: {
      en: "Our Vega Burger proves that plant-based doesn't mean boring. A hearty, flavorful vegetable patty made from chickpeas, lentils, and aromatic spices provides a satisfying base, while fresh toppings like crisp lettuce, juicy tomato, creamy avocado, and our special vegan sauce elevate it to gourmet status. Perfect for vegetarians and vegans, and absolutely delicious enough to impress meat-eaters too.",
      nl: "Onze Vega Burger bewijst dat plantaardig niet saai betekent. Een voedzame, smaakvolle groentepatty gemaakt van kikkererwten, linzen en aromatische kruiden biedt een bevredigende basis, terwijl verse toppings zoals knapperige sla, sappige tomaat, romige avocado en onze speciale veganistische saus het tot gourmetstatus verheffen. Perfect voor vegetariërs en veganisten, en absoluut lekker genoeg om ook vleesliefhebbers onder de indruk te maken."
    },
    ingredients: ["Chickpea patty", "Lentils", "Spices", "Burger bun", "Lettuce", "Tomato", "Avocado", "Vegan mayo"],
    allergens: ["Gluten"]
  },
  { 
    id: "spicy-chicken-tender-burger", 
    category: "Burgers", 
    name: "Spicy Chicken Tender Burger", 
    description: "Crispy chicken tender with spice and crunch.", 
    price: 7.5,
    image: "/food/burger.png",
    detailedDescription: {
      en: "For those who crave heat and crunch, our Spicy Chicken Tender Burger is a must-try. A golden, crispy chicken tender is coated in our fiery spice blend, delivering a satisfying crunch with every bite. Nestled between toasted buns with cooling lettuce, fresh tomato, and a spicy mayo, this burger creates an exciting flavor balance. The contrast between the hot, crispy chicken and the cool toppings makes it absolutely addictive.",
      nl: "Voor degenen die naar hitte en knapperigheid verlangen, is onze Spicy Chicken Tender Burger een must-try. Een goudkleurig, knapperig kipstukje is gecoat met onze vurige kruidenmix, wat een bevredigende knapperigheid bij elke hap levert. Genesteld tussen geroosterd brood met verkoelende sla, verse tomaat en pittige mayonaise, creëert deze hamburger een opwindende smaakvergelijking. Het contrast tussen de hete, knapperige kip en de koele toppings maakt het absoluut verslavend."
    },
    ingredients: ["Chicken tender", "Spice coating", "Burger bun", "Lettuce", "Tomato", "Spicy mayo"],
    allergens: ["Gluten", "Dairy", "Soy"]
  },
  { 
    id: "cheese-burger", 
    category: "Burgers", 
    name: "Cheese Burger", 
    description: "Classic burger with melted cheese.", 
    price: 7.5,
    image: "/food/burger.png",
    detailedDescription: {
      en: "Our Cheese Burger is a timeless classic that never goes out of style. A succulent beef patty topped with melted cheese creates a rich, savory bite that satisfies cravings every time. Served on a toasted bun with crisp lettuce, fresh tomato, onion, and our signature sauce, this burger combines simplicity with quality. Perfect as a standalone meal or paired with your favorite sides.",
      nl: "Onze Cheese Burger is een tijdloos klassiek dat nooit uit de gratie raakt. Een sappige runderpatty afgewerkt met gesmolten kaas creëert een rijke, hartige hap die telkens weer voldoet. Geserveerd op een geroosterd brood met knapperige sla, verse tomaat, ui en onze handtekeningssaus, combineert deze hamburger eenvoud met kwaliteit. Perfect als zelfstandige maaltijd of in combinatie met uw favoriete bijgerechten."
    },
    ingredients: ["Beef patty", "Cheddar cheese", "Burger bun", "Lettuce", "Tomato", "Onion", "Sauce"],
    allergens: ["Gluten", "Dairy"]
  },
  // Pizzas
  { 
    id: "saag-paneer-pizza", 
    category: "Pizzas", 
    name: "Saag Paneer Pizza", 
    description: "Spiced paneer pizza with vibrant toppings.", 
    price: 10,
    image: "/food/pizza.png",
    detailedDescription: {
      en: "Experience Indian-Italian fusion with our Saag Paneer Pizza. A thin, crispy crust is topped with creamy spinach sauce, tender paneer cubes, and a blend of mozzarella and Indian spices. Fresh cilantro and a drizzle of garlic oil complete this innovative pizza. The result is a sophisticated dish that honors both cuisines while creating something entirely unique. A vegetarian masterpiece.",
      nl: "Ervaar Indiase-Italiaanse fusie met onze Saag Paneer Pizza. Een dun, knapperig deeg wordt afgewerkt met romige spinaziesaus, gare paneerblokjes en een mix van mozzarella en Indiase kruiden. Vers cilantro en een druppel knoflookolie completeren deze innovatieve pizza. Het resultaat is een verfijnd gerecht dat beide cuisines eert en tegelijkertijd iets totaal unieks creëert. Een vegetarisch meesterwerk."
    },
    ingredients: ["Pizza dough", "Spinach sauce", "Paneer cheese", "Mozzarella", "Spices", "Cilantro", "Garlic oil"],
    allergens: ["Gluten", "Dairy"]
  },
  { 
    id: "butter-chicken-pizza", 
    category: "Pizzas", 
    name: "Butter Chicken Pizza", 
    description: "Buttery chicken pizza with rich flavor.", 
    price: 11,
    image: "/food/pizza.png",
    detailedDescription: {
      en: "Our Butter Chicken Pizza brings the richness of our signature sauce to a crispy pizza base. Tender chicken pieces are combined with our iconic butter sauce, mozzarella cheese, and fresh herbs, creating a pizza that's both indulgent and perfectly balanced. The creamy sauce mingles with the crispy crust, and fresh basil adds an aromatic finish. A pizza that satisfies even the most discerning palate.",
      nl: "Onze Butter Chicken Pizza brengt de rijkdom van onze handtekeningssaus naar een knapperig pizzadeeg. Gare kipstukken worden gecombineerd met onze iconische botersaus, mozzarellakaas en verse kruiden, wat een pizza creëert die zowel weelderig als perfect uitgebalanceerd is. De romige saus mengt zich met het knapperige deeg, en vers basilicum voegt een aromatische afwerking toe. Een pizza die zelfs de meest veeleisende smaak bevredigend."
    },
    ingredients: ["Pizza dough", "Butter chicken sauce", "Chicken breast", "Mozzarella", "Basil", "Garlic"],
    allergens: ["Gluten", "Dairy"]
  },
  { 
    id: "chicken-tikka-masala-pizza", 
    category: "Pizzas", 
    name: "Chicken Tikka Masala Pizza", 
    description: "Classic tikka masala taste on a crispy base.", 
    price: 11,
    image: "/food/pizza.png",
    detailedDescription: {
      en: "Our Chicken Tikka Masala Pizza translates the beloved curry into pizza form with remarkable success. Crispy dough is topped with creamy tikka masala sauce, tender marinated chicken, mozzarella cheese, and garnished with fresh cilantro and mint. Each slice delivers the complex flavors of the classic curry in an exciting new format. Perfect for those who love tikka masala and want to experience it in a different way.",
      nl: "Onze Chicken Tikka Masala Pizza vertaalt de geliefde curry met opmerkelijk succes in pizzavorm. Knapperig deeg wordt afgewerkt met romige tikka masala-saus, gaar gemarineerd kip, mozzarellakaas en afgewerkt met vers cilantro en munt. Elk stuk levert de complexe smaken van de klassieke curry in een opwindend nieuw formaat. Perfect voor degenen die van tikka masala houden en dit op een ander manier willen ervaren."
    },
    ingredients: ["Pizza dough", "Tikka masala sauce", "Marinated chicken", "Mozzarella", "Cilantro", "Mint"],
    allergens: ["Gluten", "Dairy"]
  },
  { 
    id: "sweet-chili-chicken-pizza", 
    category: "Pizzas", 
    name: "Sweet Chili Chicken Pizza", 
    description: "Sweet chili chicken with a savory finish.", 
    price: 11,
    image: "/food/pizza.png",
    detailedDescription: {
      en: "A perfect balance of sweet and spicy defines our Sweet Chili Chicken Pizza. The crispy crust is topped with our homemade sweet chili sauce, tender chicken pieces, bell peppers, onions, and mozzarella cheese. Finished with a sprinkle of sesame seeds and fresh green onions, this pizza offers layers of complementary flavors. The initial sweetness gives way to a gentle heat, creating a harmonious taste experience.",
      nl: "Een perfecte balans tussen zoet en pittig definieert onze Sweet Chili Chicken Pizza. Het knapperige deeg wordt afgewerkt met onze zelfgemaakte sweet chili-saus, gare kipstukken, paprika, ui en mozzarellakaas. Afgewerkt met een sprinkeltje sesamzaad en vers groen, biedt deze pizza lagen van complementaire smaken. De aanvankelijke zoetheid wijkt voor voorzichtige hitte, wat een harmonieuze smaakervaring creëert."
    },
    ingredients: ["Pizza dough", "Sweet chili sauce", "Chicken breast", "Bell peppers", "Onion", "Mozzarella", "Sesame seeds"],
    allergens: ["Gluten", "Dairy", "Soy"]
  },
  { 
    id: "chicken-madras-pizza", 
    category: "Pizzas", 
    name: "Chicken Madras Pizza", 
    description: "Spicy chicken pizza with bold seasoning.", 
    price: 11,
    image: "/food/pizza.png",
    detailedDescription: {
      en: "For the true spice lover, our Chicken Madras Pizza delivers authentic Indian heat on a pizza base. A thin, crispy crust is topped with a bold Madras sauce, fiery chicken pieces, red onions, and a generous layer of mozzarella. Fresh cilantro and red chili flakes add extra punch. This is not a pizza for the faint-hearted, but rather a bold statement of flavor that commands respect.",
      nl: "Voor de echte kruidenminnaar biedt onze Chicken Madras Pizza authentieke Indiase hitte op een pizzadeeg. Een dun, knapperig deeg wordt afgewerkt met een krachtige Madras-saus, vurige kipstukken, rode uien en een ruime laag mozzarella. Vers cilantro en rode chili-vlokken voegen extra pit toe. Dit is geen pizza voor zwakkelingen, maar eerder een krachtige verklaring van smaak die respect eist."
    },
    ingredients: ["Pizza dough", "Madras sauce", "Chicken breast", "Red onion", "Mozzarella", "Cilantro", "Red chili flakes"],
    allergens: ["Gluten", "Dairy"]
  },
  { 
    id: "lamb-madras-pizza", 
    category: "Pizzas", 
    name: "Lamb Madras Pizza", 
    description: "Flavorful lamb pizza with aromatic spices.", 
    price: 12,
    image: "/food/pizza.png",
    detailedDescription: {
      en: "Our Lamb Madras Pizza elevates pizza night to gourmet status. Tender, slow-cooked lamb is combined with a bold Madras sauce on a perfectly crispy crust. Topped with mozzarella cheese, red onions, and fresh herbs, this pizza delivers sophisticated, complex flavors with every bite. The richness of the lamb paired with the heat of the Madras spice creates an unforgettable taste experience. A true delicacy.",
      nl: "Onze Lamb Madras Pizza verheft pizzaavond tot gourmetstatus. Gaar, langzaam gestoofd lam wordt gecombineerd met een krachtige Madras-saus op een perfect knapperig deeg. Afgewerkt met mozzarellakaas, rode uien en verse kruiden, biedt deze pizza verfijnde, complexe smaken met elke hap. De rijkheid van het lam, gecombineerd met de hitte van de Madras-kruiden, creëert een onvergetelijke smaakervaring. Een ware delicatesse."
    },
    ingredients: ["Pizza dough", "Madras sauce", "Lamb meat", "Mozzarella", "Red onion", "Herbs", "Garlic"],
    allergens: ["Gluten", "Dairy"]
  },
  // Drinks
  { 
    id: "mango-lassi", 
    category: "Drinks", 
    name: "Mango Lassi", 
    description: "Sweet mango yogurt drink.", 
    price: 5,
    image: "/food/coffee.png",
    detailedDescription: {
      en: "Our Mango Lassi is a refreshing Indian yogurt drink that's perfect for cooling down after a spicy meal. Made with fresh mango puree, creamy yogurt, and a touch of cardamom, this traditional beverage offers natural sweetness and a smooth, velvety texture. Every sip transports you to India with its authentic taste. A perfect complement to any meal.",
      nl: "Onze Mango Lassi is een verfrissend Indisch yoghurtdrankje dat perfect is om af te koelen na een pittig gerecht. Gemaakt van verse mangopuree, romige yoghurt en een vleugje kardamom, biedt dit traditionele drankje natuurlijke zoetheid en een glad, fluweelachtige textuur. Elke slok voert je mee naar India met zijn authentieke smaak. Een perfect complement op elk gerecht."
    },
    ingredients: ["Yogurt", "Mango puree", "Milk", "Cardamom", "Honey"],
    allergens: ["Dairy"]
  },
  { 
    id: "salted-lassi", 
    category: "Drinks", 
    name: "Salted Lassi", 
    description: "Refreshing savory yogurt drink.", 
    price: 5,
    image: "/food/coffee.png",
    detailedDescription: {
      en: "Our Salted Lassi is a traditional Indian beverage that's both refreshing and savory. Made with fresh yogurt, a hint of salt, and aromatic spices like cumin, this drink is designed to aid digestion and provide a cooling sensation. Light, tangy, and deeply satisfying, it's the perfect drink to complement your meal and cleanse your palate.",
      nl: "Onze Salted Lassi is een traditioneel Indisch drankje dat zowel verfrissend als hartig is. Gemaakt van verse yoghurt, een vleugje zout en aromatische kruiden zoals komijn, is dit drankje ontworpen om spijsvertering te bevorderen en een verkoelend gevoel te geven. Licht, zuur en diep bevredigend, het is het perfecte drankje om uw maaltijd aan te vullen en uw gehemelte schoon te maken."
    },
    ingredients: ["Yogurt", "Salt", "Cumin", "Mint", "Water"],
    allergens: ["Dairy"]
  },
  { 
    id: "coconut-lassi", 
    category: "Drinks", 
    name: "Coconut Lassi", 
    description: "Creamy coconut yogurt drink.", 
    price: 5,
    image: "/food/coffee.png",
    detailedDescription: {
      en: "Tropical and creamy, our Coconut Lassi brings the flavors of the coconut palm to your table. Fresh yogurt is blended with rich coconut milk, creating a luxuriously smooth drink that's both nourishing and indulgent. With a subtle sweetness and aromatic vanilla undertone, this lassi offers an escape to paradise. Perfect for those seeking a taste of the tropics.",
      nl: "Tropisch en romig, onze Coconut Lassi brengt de smaken van de kokospalm naar uw tafel. Verse yoghurt wordt gemengd met rijke kokosnootmelk, wat een luxe glad drankje creëert dat zowel voedzaam als weelderig is. Met een subtiele zoetheid en aromatische vanilleondertoon, biedt deze lassi een ontsnapping naar het paradijs. Perfect voor degenen die op zoek zijn naar een smaak van de tropen."
    },
    ingredients: ["Yogurt", "Coconut milk", "Milk", "Honey", "Vanilla"],
    allergens: ["Dairy"]
  },
  { 
    id: "coffee", 
    category: "Drinks", 
    name: "Coffee", 
    description: "Freshly brewed coffee with rich aroma.", 
    price: 3.5,
    image: "/food/coffee.png",
    detailedDescription: {
      en: "Start your day or power through your afternoon with our freshly brewed coffee. We use premium single-origin beans that are roasted to perfection, delivering a rich, aromatic cup every time. Whether you prefer it black or with milk, our coffee provides the perfect balance of flavor and caffeine to keep you energized.",
      nl: "Begin uw dag of doorbreek uw namiddag met onze vers gebrouwen koffie. We gebruiken premium single-origin bonen die tot perfectie geroosterd zijn, wat elke keer een rijke, aromatische kopje oplevert. Of je het zwart of met melk prefereert, onze koffie biedt de perfecte balans tussen smaak en cafeïne om je energiek te houden."
    },
    ingredients: ["Coffee beans", "Water"],
    allergens: []
  },
  { 
    id: "smoothie", 
    category: "Drinks", 
    name: "Smoothie", 
    description: "Blend of fruit, yogurt, and fresh flavor.", 
    price: 5.5,
    image: "/food/coffee.png",
    detailedDescription: {
      en: "Our Smoothie is a nutritious blend of fresh, ripe fruits combined with creamy yogurt and a hint of honey. Packed with vitamins, minerals, and natural energy, this smoothie is perfect for a quick, wholesome breakfast or a refreshing snack. We use only the freshest seasonal fruits to ensure maximum flavor and nutritional value.",
      nl: "Onze Smoothie is een voedzame mix van vers, rijp fruit gecombineerd met romige yoghurt en een vleugje honing. Boordevol vitamines, mineralen en natuurlijke energie, deze smoothie is perfect voor een snelle, gezonde ontbijt of een verfrissende snack. We gebruiken alleen het fris Seizoensfruit om maximale smaak en voedingswaarde te garanderen."
    },
    ingredients: ["Fresh fruit", "Yogurt", "Milk", "Honey", "Vanilla"],
    allergens: ["Dairy"]
  },
  { 
    id: "matcha", 
    category: "Drinks", 
    name: "Matcha", 
    description: "Premium matcha drink with a smooth finish.", 
    price: 4.5,
    image: "/food/coffee.png",
    detailedDescription: {
      en: "Experience the zen of our Premium Matcha drink. Made from high-grade matcha powder whisked into hot water with a touch of milk and honey, this traditional Japanese beverage offers a smooth, earthy flavor with a natural energy boost. Rich in antioxidants and L-theanine, matcha provides a calm alertness that's perfect for any time of day.",
      nl: "Ervaar de zen van onze Premium Matcha-drank. Gemaakt van hoogwaardig matchapoeder met heet water en een vleugje melk en honing, biedt dit traditionele Japanse drankje een gladde, aardse smaak met een natuurlijke energieboost. Rijp met antioxidanten en L-theanine, matcha biedt een rustige alertheid die perfect is voor elk moment van de dag."
    },
    ingredients: ["Matcha powder", "Water", "Milk", "Honey"],
    allergens: ["Dairy"]
  },
  { 
    id: "bubble-tea", 
    category: "Drinks", 
    name: "Bubble Tea", 
    description: "Chewy pearls and a sweet, refreshing drink.", 
    price: 5.5,
    image: "/food/coffee.png",
    detailedDescription: {
      en: "Our Bubble Tea is a fun, refreshing beverage featuring chewy tapioca pearls suspended in a sweet tea base. Blended with milk and served over ice, each sip combines the smoothness of the creamy tea with the delightful chewiness of the pearls. Available in various flavors, bubble tea is an experience that engages all your senses.",
      nl: "Onze Bubble Tea is een leuk, verfrissend drankje met kauwbare tapiocaparels in een zoet theebasis. Met melk gemengd en over ijs geserveerd, combineert elke slok de gladheid van de romige thee met de aangename kauwerigheid van de parels. Beschikbaar in verschillende smaken, bubbeltea is een ervaring die al uw zintuigen omvat."
    },
    ingredients: ["Tea", "Tapioca pearls", "Milk", "Sugar", "Ice"],
    allergens: []
  },
];

/**
 * Combined catalogue for both restaurants, seeded on first load.
 * Eat to go products are tagged with their brand here; Tandoor products already carry it.
 */
export const SEED_PRODUCTS: Product[] = [
  ...EATTOGO_PRODUCTS.map((p): Product => ({ ...p, brand: "eattogo" })),
  ...TANDOOR_PRODUCTS,
];

/** Secret code required to create an admin account during registration. */
export const ADMIN_CODE = "EATTOGO-ADMIN";

/** Flat delivery fee in euros. */
export const DELIVERY_FEE = 2.5;

/** Orders above this amount (after discounts) get free delivery. */
export const FREE_DELIVERY_FROM = 30;

/** Minimum order value (subtotal before discounts and points). */
export const MIN_ORDER = 20;

/**
 * Delivery area - we only deliver within Amsterdam-Noord.
 * Amsterdam-Noord uses Dutch postcodes with a 4-digit prefix in the 1020–1039 range.
 */
export const DELIVERY_AREA_MIN = 1020;
export const DELIVERY_AREA_MAX = 1039;
export const DELIVERY_AREA_NAME = "Amsterdam-Noord";

/** Normalise a Dutch postcode: strip spaces, uppercase (e.g. "1032 kl" -> "1032KL"). */
export function normalizePostcode(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

/** True when the input is a complete, well-formed Dutch postcode (e.g. "1032 KL"). */
export function isValidDutchPostcode(raw: string): boolean {
  return /^\d{4}\s?[A-Za-z]{2}$/.test(raw.trim());
}

/** Extract the 4-digit numeric prefix from a postcode, or null when unavailable. */
export function getPostcodePrefix(raw: string): number | null {
  const match = normalizePostcode(raw).match(/^(\d{4})/);
  return match ? parseInt(match[1], 10) : null;
}

/** True when the postcode falls inside our Amsterdam-Noord delivery area. */
export function isPostcodeInDeliveryArea(raw: string): boolean {
  const prefix = getPostcodePrefix(raw);
  return prefix !== null && prefix >= DELIVERY_AREA_MIN && prefix <= DELIVERY_AREA_MAX;
}

/** VIP membership: standard price and current sale price (in euros). */
export const VIP_PRICE = 100;
export const VIP_SALE_PRICE = 35;

/** VIP members always get this discount on food (not drinks). */
export const VIP_DISCOUNT_PCT = 10;

/** Company accounts always get this discount on food (not drinks). */
export const COMPANY_DISCOUNT_PCT = 20;

/** Minimum order value for company accounts (subtotal before discounts and points). */
export const COMPANY_MIN_ORDER = 100;

/** 1 loyalty point is worth €1 when redeemed. */
export const POINT_VALUE = 1;

/** Earn 1 point for every €10 spent. */
export const POINTS_EARN_EVERY = 10;

/** VIP price for a food product (drinks are never discounted). */
export function vipPrice(price: number, category: Category): number {
  if (isDrinkCategory(category)) return price;
  return +(price * (1 - VIP_DISCOUNT_PCT / 100)).toFixed(2);
}
