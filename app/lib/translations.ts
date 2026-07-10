import type { Lang } from "./types";

export interface Dictionary {
  nav: {
    home: string;
    order: string;
    account: string;
    admin: string;
    menu: string;
    about: string;
    contact: string;
  };
  common: {
    orderNow: string;
    viewMenu: string;
    addToCart: string;
    add: string;
    remove: string;
    total: string;
    subtotal: string;
    delivery: string;
    discount: string;
    checkout: string;
    placeOrder: string;
    yourOrder: string;
    emptyCart: string;
    items: string;
    each: string;
    signIn: string;
    signUp: string;
    signOut: string;
    lightMode: string;
    darkMode: string;
    backToHome: string;
    freshFast: string;
    edit: string;
    cancel: string;
    saveChanges: string;
  };
  home: {
    badge: string;
    heroTitle: string;
    heroSubtitle: string;
    heroCtaOrder: string;
    heroCtaMenu: string;
    statFlavors: string;
    statSpecialties: string;
    statDaily: string;
    statWait: string;
    featuresTitle: string;
    feature1Title: string;
    feature1Text: string;
    feature2Title: string;
    feature2Text: string;
    feature3Title: string;
    feature3Text: string;
    aboutTitle: string;
    aboutText: string;
    popularTitle: string;
    popularSubtitle: string;
    testimonialsTitle: string;
    testimonialsSubtitle: string;
    ctaTitle: string;
    ctaText: string;
    ctaButton: string;
  };
  order: {
    title: string;
    subtitle: string;
    categoryHint: string;
    deliveryDetails: string;
    name: string;
    phone: string;
    address: string;
    postcode: string;
    postcodeHint: string;
    deliveryAreaNote: string;
    inDeliveryArea: string;
    outsideArea: string;
    invalidPostcode: string;
    note: string;
    notePlaceholder: string;
    orderNumber: string;
    menuCategories: string;
    loyaltyApplied: string;
    orderPlaced: string;
    selectItem: string;
    signInForDiscount: string;
    minOrderNote: string;
    minOrderCompanyNote: string;
    freeDeliveryNote: string;
    usePoints: string;
    pointsAvailable: string;
    pointsHint: string;
    foodOnlyNote: string;
    vipPriceLabel: string;
    readMore: string;
    ingredients: string;
    allergens: string;
    contains: string;
    fulfillmentTitle: string;
    optionDelivery: string;
    optionDeliverySub: string;
    optionPickup: string;
    optionPickupSub: string;
    pickupInfo: string;
    methodDelivery: string;
    methodPickup: string;
  };
  auth: {
    loginTitle: string;
    registerTitle: string;
    name: string;
    email: string;
    password: string;
    phone: string;
    adminCode: string;
    adminCodeHint: string;
    haveAccount: string;
    noAccount: string;
    loginButton: string;
    registerButton: string;
    welcome: string;
    yourProfile: string;
    memberSince: string;
    loyaltyPoints: string;
    ordersPlaced: string;
    currentDiscount: string;
    loyaltyExplain: string;
    invalidLogin: string;
    emailTaken: string;
    wrongAdminCode: string;
    fillFields: string;
  };
  company: {
    registerAs: string;
    personal: string;
    company: string;
    btw: string;
    kvk: string;
    agreement: string;
    badge: string;
    active: string;
    activeDesc: string;
    fillCompanyFields: string;
    acceptAgreement: string;
    priceLabel: string;
  };
  schedule: {
    title: string;
    asap: string;
    once: string;
    workdays: string;
    date: string;
    time: string;
    workdaysNote: string;
    scheduledFor: string;
    everyWorkday: string;
    pickDateTime: string;
  };
  vip: {
    title: string;
    badge: string;
    desc: string;
    buy: string;
    saleTag: string;
    standardPrice: string;
    active: string;
    activeDesc: string;
    haveCard: string;
    haveCardDesc: string;
    uploadCard: string;
    requestPending: string;
    requestPendingDesc: string;
    or: string;
  };
  reviews: {
    leaveReview: string;
    yourRating: string;
    placeholder: string;
    submit: string;
    thanks: string;
    reviewed: string;
    basedOn: string;
    reviewsWord: string;
    verifiedOrder: string;
  };
  admin: {
    title: string;
    subtitle: string;
    accessDenied: string;
    accessDeniedText: string;
    totalRevenue: string;
    totalOrders: string;
    totalUsers: string;
    totalProducts: string;
    avgOrder: string;
    topProducts: string;
    recentOrders: string;
    manageProducts: string;
    addProduct: string;
    productName: string;
    productDesc: string;
    productPrice: string;
    productCategory: string;
    productImage: string;
    productDetail: string;
    productDetailHint: string;
    save: string;
    saving: string;
    productAdded: string;
    productUpdated: string;
    saveFailed: string;
    nameRequired: string;
    priceInvalid: string;
    priceHint: string;
    imageError: string;
    manageMenus: string;
    manageMenusSub: string;
    addRestaurant: string;
    restaurantName: string;
    addCategoryBtn: string;
    categoryName: string;
    pickIcon: string;
    brandExists: string;
    categoryExists: string;
    brandHasProducts: string;
    categoryHasProducts: string;
    lastBrand: string;
    lastCategory: string;
    filterAll: string;
    filterToday: string;
    filterWeek: string;
    filterMonth: string;
    filterPickDate: string;
    noOrders: string;
    ordersByCategory: string;
    customerInsights: string;
    customerInsightsSub: string;
    customer: string;
    favoriteProduct: string;
    favoriteCategory: string;
    ordersLabel: string;
    totalSpent: string;
    avgSpent: string;
    lastOrder: string;
    itemsOrdered: string;
    noCustomers: string;
    guest: string;
    deliveryArea: string;
    editProduct: string;
    changeCategory: string;
    restaurant: string;
    itemsToPrepare: string;
    deleteConfirmTitle: string;
    deleteConfirmText: string;
    vipRequests: string;
    vipRequestsSub: string;
    recentlyOnline: string;
    recentlyOnlineSub: string;
    justNow: string;
    minutesAgo: string;
    hoursAgo: string;
    daysAgo: string;
    socialTitle: string;
    socialSub: string;
    socialUrlPlaceholder: string;
    socialVisible: string;
    socialHidden: string;
    socialSaved: string;
    approve: string;
    reject: string;
    noVipRequests: string;
    vipCardApproved: string;
    vipCardRejected: string;
  };
  fulfillment: {
    paymentTitle: string;
    paid: string;
    unpaid: string;
    markPaid: string;
    markUnpaid: string;
    statusTitle: string;
    statusNew: string;
    statusPreparing: string;
    statusDelivery: string;
    statusDelivered: string;
    startPreparing: string;
    sendToCourier: string;
    markDelivered: string;
    completed: string;
    orderManagement: string;
    orderManagementSub: string;
    trackOrder: string;
    invoiced: string;
    noActiveOrders: string;
    customerOrders: string;
    companyOrders: string;
    customerNote: string;
    invoiceSent: string;
    invoiceNotSent: string;
    markInvoiceSent: string;
    markInvoiceNotSent: string;
    companyDetails: string;
    noCustomerOrders: string;
    noCompanyOrders: string;
    orderNumber: string;
    searchCustomers: string;
    searchCompanies: string;
    noMatches: string;
  };
  pay: {
    processing: string;
    processingDesc: string;
    success: string;
    orderConfirmed: string;
    vipActivated: string;
    failed: string;
    failedDesc: string;
    tryAgain: string;
    viewOrders: string;
    goToAccount: string;
    backToMenu: string;
    redirecting: string;
  };
  email: {
    verifyBanner: string;
    verifyBannerSub: string;
    resend: string;
    resendSent: string;
    verifyingTitle: string;
    verifySuccess: string;
    verifySuccessText: string;
    verifyFail: string;
    verifyFailText: string;
    forgotLink: string;
    forgotTitle: string;
    forgotText: string;
    emailLabel: string;
    forgotSubmit: string;
    forgotSent: string;
    resetTitle: string;
    resetText: string;
    newPassword: string;
    confirmPassword: string;
    resetSubmit: string;
    resetSuccess: string;
    resetSuccessText: string;
    resetInvalid: string;
    passwordMismatch: string;
    passwordWeak: string;
    backToSignIn: string;
    goToAccount: string;
  };
  footer: {
    tagline: string;
    contact: string;
    followUs: string;
    rights: string;
    address: string;
    ourRestaurants: string;
    theMaison: string;
    theTandoor: string;
    legal: string;
    privacy: string;
    terms: string;
  };
  hours: {
    title: string;
    tueSun: string;
    monday: string;
    closed: string;
    openNow: string;
    closedNow: string;
    closedNote: string;
    preOrderToday: string;
    preOrderDay: string;
    scheduleClosedNote: string;
  };
  cookies: {
    message: string;
    accept: string;
    decline: string;
    learnMore: string;
  };
}

const en: Dictionary = {
  nav: {
    home: "Home",
    order: "Order",
    account: "Account",
    admin: "Admin",
    menu: "Menu",
    about: "About",
    contact: "Contact",
  },
  common: {
    orderNow: "Order now",
    viewMenu: "View menu",
    addToCart: "Add to cart",
    add: "Add",
    remove: "Remove",
    total: "Total",
    subtotal: "Subtotal",
    delivery: "Delivery",
    discount: "Discount",
    checkout: "Checkout",
    placeOrder: "Place order",
    yourOrder: "Your order",
    emptyCart: "Your selected items will appear here. Pick a dish to build your order.",
    items: "items",
    each: "each",
    signIn: "Sign in",
    signUp: "Sign up",
    signOut: "Sign out",
    lightMode: "Light mode",
    darkMode: "Dark mode",
    backToHome: "Back to home",
    freshFast: "Fresh, fast and made for Amsterdam",
    edit: "Edit",
    cancel: "Cancel",
    saveChanges: "Save changes",
  },
  home: {
    badge: "Fresh, fast and made for Amsterdam",
    heroTitle: "Fresh. Fast. Delicious. Eat to go.",
    heroSubtitle:
      "Enjoy fresh wraps, burgers, pizzas and drinks - perfect on the go or as a treat. Always freshly prepared, always ready to take away in Amsterdam.",
    heroCtaOrder: "Order now",
    heroCtaMenu: "View menu",
    statFlavors: "Flavors & variations",
    statSpecialties: "Signature specialties",
    statDaily: "Fresh daily options",
    statWait: "Min average wait",
    featuresTitle: "Why guests choose Eat to go",
    feature1Title: "Always fresh & high quality",
    feature1Text: "We use only carefully selected ingredients for every wrap, burger and drink.",
    feature2Title: "Ready in a few minutes",
    feature2Text: "Eat to go stands for speed - your order is prepared fresh and fast, ideal on the go.",
    feature3Title: "Daily freshness & care",
    feature3Text: "Our kitchen works to strict hygiene standards for a safe and consistent taste experience.",
    aboutTitle: "About Eat to go",
    aboutText:
      "Eat to go is the place in Amsterdam for fast, fresh and delicious to-go food. From wraps and burgers to pizzas and drinks - quality and speed come first. Everything is freshly prepared and ready to take away, perfect on the go or as a light snack.",
    popularTitle: "Our popular to-go flavors",
    popularSubtitle:
      "Whether you crave something savory, warm or refreshing - at Eat to go you always find a favorite. Here are our bestsellers per category.",
    testimonialsTitle: "What customers say about us",
    testimonialsSubtitle: "Our guests love to share their experience with our fresh to-go food.",
    ctaTitle: "Always hungry? Order fast & easy at Eat to go",
    ctaText:
      "Place your order for pickup or on the go. Choose your favorite wrap, burger, pizza or drink and we prepare it fresh for you.",
    ctaButton: "Start your order",
  },
  order: {
    title: "Build your order",
    subtitle: "Pick your meals, see prices instantly and check out - all on one page.",
    categoryHint: "Clear pricing. Fast selection.",
    deliveryDetails: "Delivery details",
    name: "Full name",
    phone: "Phone",
    address: "Street name and house number",
    postcode: "Postcode",
    postcodeHint: "e.g. 1032 KL",
    deliveryAreaNote: "We currently deliver only within Amsterdam-Noord.",
    inDeliveryArea: "Great news — we deliver to your address!",
    outsideArea: "Sorry, we only deliver within Amsterdam-Noord. Your postcode is outside our delivery area.",
    invalidPostcode: "Please enter a valid Dutch postcode (e.g. 1032 KL).",
    note: "Order note",
    notePlaceholder: "Delivery instructions or requests — e.g. don't ring the bell, use back door, no coriander (optional)",
    orderNumber: "Order no.",
    menuCategories: "categories",
    loyaltyApplied: "Loyalty discount applied",
    orderPlaced: "Order placed! We are preparing your food.",
    selectItem: "Select an item to start your order.",
    signInForDiscount: "Sign in to earn loyalty points and unlock discounts.",
    minOrderNote: "Minimum order is €20 (before discounts and points).",
    minOrderCompanyNote: "Minimum order for company accounts is €100 (before discounts and points).",
    freeDeliveryNote: "Free delivery on orders over €30 (always free for company accounts).",
    usePoints: "Use loyalty points",
    pointsAvailable: "points available",
    pointsHint: "1 point = €1. Redeem points to pay for your food.",
    foodOnlyNote: "Discounts apply to food only - not drinks.",
    vipPriceLabel: "VIP",
    readMore: "Read more",
    ingredients: "Ingredients",
    allergens: "Allergens",
    contains: "Contains:",
    fulfillmentTitle: "How would you like to receive your order?",
    optionDelivery: "Delivery",
    optionDeliverySub: "We bring it to your address",
    optionPickup: "Pickup",
    optionPickupSub: "Collect it yourself in-store",
    pickupInfo: "Pick up your order at Klaprozenweg 36a, 1032 KL Amsterdam.",
    methodDelivery: "Delivery",
    methodPickup: "Pickup",
  },
  auth: {
    loginTitle: "Welcome back",
    registerTitle: "Create your account",
    name: "Full name",
    email: "Email",
    password: "Password",
    phone: "Phone (optional)",
    adminCode: "Admin code (optional)",
    adminCodeHint: "Enter the admin code to create a manager account.",
    haveAccount: "Already have an account?",
    noAccount: "New here?",
    loginButton: "Sign in",
    registerButton: "Create account",
    welcome: "Welcome",
    yourProfile: "Your profile",
    memberSince: "Member since",
    loyaltyPoints: "Loyalty points",
    ordersPlaced: "Orders placed",
    currentDiscount: "Current discount",
    loyaltyExplain: "Earn 1 point for every €10 spent - 1 point is worth €1. Redeem points for free food on your next order.",
    invalidLogin: "Invalid email or password.",
    emailTaken: "That email is already registered.",
    wrongAdminCode: "The admin code is incorrect.",
    fillFields: "Please fill in all required fields.",
  },
  company: {
    registerAs: "Register as",
    personal: "Personal",
    company: "Company",
    btw: "BTW (VAT) number",
    kvk: "KVK number",
    agreement:
      "I agree that once the food is received, the invoice must be paid within 7 days. Invoice details will be sent automatically to the registered email address.",
    badge: "Company account",
    active: "Company account - 20% food discount",
    activeDesc:
      "Your company always receives an automatic 20% discount on all food (drinks excluded). Invoices are sent to your registered email and must be paid within 7 days of receiving your order.",
    fillCompanyFields: "Please fill in your BTW and KVK numbers.",
    acceptAgreement: "You must accept the payment agreement to register as a company.",
    priceLabel: "B2B",
  },
  schedule: {
    title: "Delivery planning",
    asap: "As soon as possible",
    once: "Pick date & time",
    workdays: "Every working day",
    date: "Delivery date",
    time: "Delivery time",
    workdaysNote: "Your order will be delivered every working day (Mon–Fri) at the chosen time. Perfect for planning team lunches.",
    scheduledFor: "Scheduled for",
    everyWorkday: "Every working day at",
    pickDateTime: "Please pick a delivery date and time.",
  },
  vip: {
    title: "VIP membership",
    badge: "VIP member",
    desc: "Get a permanent 10% discount on all food (drinks excluded) - forever.",
    buy: "Become VIP now",
    saleTag: "Limited offer",
    standardPrice: "Standard price",
    active: "You are a VIP member",
    activeDesc: "You enjoy a permanent 10% discount on all food. Thank you for being a VIP!",
    haveCard: "Already have a VIP card?",
    haveCardDesc: "Upload a photo of your physical VIP card. Once our team approves it, your VIP will be activated automatically.",
    uploadCard: "Upload VIP card photo",
    requestPending: "VIP card under review",
    requestPendingDesc: "We've received your VIP card. Our team will review it shortly and activate your VIP membership.",
    or: "or",
  },
  reviews: {
    leaveReview: "Leave a review",
    yourRating: "Your rating",
    placeholder: "How was your order? Share your experience…",
    submit: "Submit review",
    thanks: "Thank you for your review!",
    reviewed: "Your review",
    basedOn: "Based on",
    reviewsWord: "reviews",
    verifiedOrder: "Verified order",
  },
  admin: {
    title: "Admin dashboard",
    subtitle: "Track performance and manage your menu.",
    accessDenied: "Admins only",
    accessDeniedText: "You need an admin account to view this page.",
    totalRevenue: "Total revenue",
    totalOrders: "Total orders",
    totalUsers: "Registered users",
    totalProducts: "Products",
    avgOrder: "Average order",
    topProducts: "Top products",
    recentOrders: "Recent orders",
    manageProducts: "Manage products",
    addProduct: "Add product",
    productName: "Name",
    productDesc: "Description",
    productPrice: "Price (€)",
    productCategory: "Category",
    productImage: "Image",
    productDetail: "Read more text",
    productDetailHint: "Detailed description shown in the product's 'Read more' popup (optional)",
    save: "Save product",
    saving: "Saving…",
    productAdded: "Product added successfully!",
    productUpdated: "Product updated successfully!",
    saveFailed: "Saving failed",
    nameRequired: "Enter a product name.",
    priceInvalid: "Enter a valid price, e.g. 8.73",
    priceHint: "Use a dot for cents, e.g. 8.73 — a comma is converted automatically.",
    imageError: "This image could not be read. Please use a JPG or PNG photo.",
    manageMenus: "Restaurants & categories",
    manageMenusSub: "Add or remove restaurants and their menu categories.",
    addRestaurant: "Add restaurant",
    restaurantName: "Restaurant name",
    addCategoryBtn: "Add category",
    categoryName: "Category name",
    pickIcon: "Icon",
    brandExists: "A restaurant with this name already exists.",
    categoryExists: "This category already exists.",
    brandHasProducts: "This restaurant still has products — delete or move them first.",
    categoryHasProducts: "This category still has products — delete or move them first.",
    lastBrand: "At least one restaurant is required.",
    lastCategory: "A restaurant needs at least one category.",
    filterAll: "All time",
    filterToday: "Today",
    filterWeek: "Last 7 days",
    filterMonth: "Last 30 days",
    filterPickDate: "Pick a date",
    noOrders: "No orders yet.",
    ordersByCategory: "Sales by category",
    customerInsights: "Customer insights",
    customerInsightsSub: "How each customer orders — favourites, spend and activity.",
    customer: "Customer",
    favoriteProduct: "Favourite product",
    favoriteCategory: "Favourite category",
    ordersLabel: "Orders",
    totalSpent: "Total spent",
    avgSpent: "Avg order",
    lastOrder: "Last order",
    itemsOrdered: "Items ordered",
    noCustomers: "No customer data yet.",
    guest: "Guest",
    deliveryArea: "Delivery area",
    editProduct: "Edit product",
    changeCategory: "Category",
    restaurant: "Restaurant",
    itemsToPrepare: "Items to prepare",
    deleteConfirmTitle: "Delete product?",
    deleteConfirmText: "Are you sure you want to delete this product? This cannot be undone.",
    vipRequests: "VIP card requests",
    vipRequestsSub: "Approve customers who uploaded a photo of their physical VIP card.",
    recentlyOnline: "Recently online",
    recentlyOnlineSub: "The last 20 customers who visited the website while signed in.",
    justNow: "just now",
    minutesAgo: "{n} min ago",
    hoursAgo: "{n} h ago",
    daysAgo: "{n} d ago",
    socialTitle: "Social media links",
    socialSub: "Add your profile links and switch on the icons you want to show in the website footer.",
    socialUrlPlaceholder: "https://…",
    socialVisible: "Visible",
    socialHidden: "Hidden",
    socialSaved: "Saved",
    approve: "Approve",
    reject: "Reject",
    noVipRequests: "No pending VIP requests.",
    vipCardApproved: "Approved — VIP activated",
    vipCardRejected: "Rejected",
  },
  fulfillment: {
    paymentTitle: "Payment",
    paid: "Paid",
    unpaid: "Unpaid",
    markPaid: "Mark as paid",
    markUnpaid: "Mark as unpaid",
    statusTitle: "Status",
    statusNew: "Order received",
    statusPreparing: "Preparing",
    statusDelivery: "Out for delivery",
    statusDelivered: "Delivered",
    startPreparing: "Start preparing",
    sendToCourier: "Hand to courier",
    markDelivered: "Mark delivered",
    completed: "Completed",
    orderManagement: "Order management",
    orderManagementSub: "Confirm payments and move orders through delivery.",
    trackOrder: "Track your order",
    invoiced: "Invoiced — pay within 7 days",
    noActiveOrders: "No active orders right now.",
    customerOrders: "Customer orders",
    companyOrders: "Company orders",
    customerNote: "Customer note",
    invoiceSent: "Invoice sent",
    invoiceNotSent: "Invoice not sent",
    markInvoiceSent: "Mark invoice sent",
    markInvoiceNotSent: "Mark invoice not sent",
    companyDetails: "Company details",
    noCustomerOrders: "No customer orders yet.",
    noCompanyOrders: "No company orders yet.",
    orderNumber: "Order no.",
    searchCustomers: "Search by name or order number…",
    searchCompanies: "Search by company or order number…",
    noMatches: "No orders match your search.",
  },
  pay: {
    processing: "Confirming your payment…",
    processingDesc: "This only takes a moment. Please don't close this page.",
    success: "Payment successful!",
    orderConfirmed: "Thank you! Your order is confirmed and we're preparing your food.",
    vipActivated: "Welcome to VIP! Your 10% discount is now active.",
    failed: "Payment not completed",
    failedDesc: "Your payment was cancelled or didn't go through. You can try again.",
    tryAgain: "Try again",
    viewOrders: "View my orders",
    goToAccount: "Go to my account",
    backToMenu: "Back to menu",
    redirecting: "Redirecting to secure payment…",
  },
  email: {
    verifyBanner: "Please confirm your email address",
    verifyBannerSub: "We've sent a confirmation link to your inbox.",
    resend: "Resend email",
    resendSent: "Sent! Check your inbox.",
    verifyingTitle: "Confirming your email…",
    verifySuccess: "Email confirmed!",
    verifySuccessText: "Thank you — your email address is now verified.",
    verifyFail: "Link expired or invalid",
    verifyFailText: "This confirmation link is no longer valid. You can request a new one from your account.",
    forgotLink: "Forgot password?",
    forgotTitle: "Reset your password",
    forgotText: "Enter your email and we'll send you a link to reset your password.",
    emailLabel: "Email",
    forgotSubmit: "Send reset link",
    forgotSent: "If that email is registered, a reset link is on its way. Please check your inbox.",
    resetTitle: "Choose a new password",
    resetText: "Enter a new password for your account.",
    newPassword: "New password",
    confirmPassword: "Confirm password",
    resetSubmit: "Update password",
    resetSuccess: "Password updated!",
    resetSuccessText: "You can now sign in with your new password.",
    resetInvalid: "This reset link is invalid or has expired.",
    passwordMismatch: "Passwords don't match.",
    passwordWeak: "Password must be at least 6 characters.",
    backToSignIn: "Back to sign in",
    goToAccount: "Go to my account",
  },
  footer: {
    tagline:
      "Delicious wraps, burgers, pizzas and fresh drinks. Eat to go stands for taste, freshness and convenience - perfect on the go.",
    contact: "Contact",
    followUs: "Follow us",
    rights: "All rights reserved.",
    address: "Address",
    ourRestaurants: "Our Restaurants",
    theMaison: "The Maison",
    theTandoor: "The Tandoor Company",
    legal: "Legal",
    privacy: "Privacy Policy",
    terms: "Terms & Conditions",
  },
  hours: {
    title: "Opening Hours",
    tueSun: "Tue – Sun",
    monday: "Monday",
    closed: "Closed",
    openNow: "Open now",
    closedNow: "Closed now",
    closedNote: "We are currently closed. You can order Tuesday to Sunday between 14:00 and 20:00 (closed on Mondays).",
    preOrderToday: "We are closed right now, but you can already place your order — we will start preparing it today from 14:00.",
    preOrderDay: "We are closed right now, but you can already place your order — we will start preparing it on {day} from 14:00.",
    scheduleClosedNote: "Please pick a delivery slot within our opening hours: Tuesday to Sunday, 14:00–20:00 (closed on Mondays).",
  },
  cookies: {
    message:
      "We use only functional cookies that are necessary for the website to work (your session, cart and preferences). We do not use tracking or advertising cookies.",
    accept: "Accept",
    decline: "Only necessary",
    learnMore: "Learn more",
  },
};

const nl: Dictionary = {
  nav: {
    home: "Home",
    order: "Bestellen",
    account: "Account",
    admin: "Admin",
    menu: "Menu",
    about: "Over ons",
    contact: "Contact",
  },
  common: {
    orderNow: "Bestel nu",
    viewMenu: "Bekijk menu",
    addToCart: "In winkelmand",
    add: "Toevoegen",
    remove: "Verwijderen",
    total: "Totaal",
    subtotal: "Subtotaal",
    delivery: "Bezorging",
    discount: "Korting",
    checkout: "Afrekenen",
    placeOrder: "Bestelling plaatsen",
    yourOrder: "Jouw bestelling",
    emptyCart: "Je gekozen producten verschijnen hier. Kies een gerecht om te beginnen.",
    items: "producten",
    each: "per stuk",
    signIn: "Inloggen",
    signUp: "Registreren",
    signOut: "Uitloggen",
    lightMode: "Lichte modus",
    darkMode: "Donkere modus",
    backToHome: "Terug naar home",
    freshFast: "Vers, snel en gemaakt voor Amsterdam",
    edit: "Bewerken",
    cancel: "Annuleren",
    saveChanges: "Wijzigingen opslaan",
  },
  home: {
    badge: "Vers, snel en gemaakt voor Amsterdam",
    heroTitle: "Vers. Snel. Lekker. Eat to go.",
    heroSubtitle:
      "Geniet van verse wraps, burgers, pizza's en dranken - ideaal voor onderweg of als verwenmoment. Altijd vers bereid, altijd direct mee te nemen in Amsterdam.",
    heroCtaOrder: "Bestel nu",
    heroCtaMenu: "Bekijk menu",
    statFlavors: "Smaken & variaties",
    statSpecialties: "Specialiteiten",
    statDaily: "Dagelijks vers",
    statWait: "Min gemiddelde wachttijd",
    featuresTitle: "Waarom gasten voor Eat to go kiezen",
    feature1Title: "Altijd vers & hoogwaardig",
    feature1Text: "Wij gebruiken alleen zorgvuldig geselecteerde ingrediënten voor elke wrap, burger en drankje.",
    feature2Title: "Klaar binnen enkele minuten",
    feature2Text: "Eat to go staat voor snelheid - uw bestelling wordt vers en snel bereid, ideaal voor onderweg.",
    feature3Title: "Dagelijkse versheid & zorg",
    feature3Text: "Onze keuken werkt volgens strikte hygiënestandaarden voor een veilige en constante smaakervaring.",
    aboutTitle: "Over Eat to go",
    aboutText:
      "Eat to go is dé plek in Amsterdam voor snelle, verse en heerlijke to-go producten. Van wraps en burgers tot pizza's en dranken - kwaliteit en snelheid staan voorop. Alles wordt vers bereid en direct meegegeven, perfect voor onderweg of als lichte snack.",
    popularTitle: "Onze populaire to-go smaken",
    popularSubtitle:
      "Of u nu zin heeft in iets hartigs, iets warms of iets verfrissends - bij Eat to go vindt u altijd een favoriet. Hier zijn onze bestsellers per categorie.",
    testimonialsTitle: "Wat klanten over ons zeggen",
    testimonialsSubtitle: "Onze gasten delen graag hun ervaring met onze verse to-go producten.",
    ctaTitle: "Altijd trek? Bestel snel & makkelijk bij Eat to go",
    ctaText:
      "Plaats direct uw bestelling voor afhalen of onderweg. Kies uw favoriete wrap, burger, pizza of drankje en wij maken het vers voor u klaar.",
    ctaButton: "Start uw bestelling",
  },
  order: {
    title: "Stel je bestelling samen",
    subtitle: "Kies je gerechten, zie direct de prijzen en reken af - alles op één pagina.",
    categoryHint: "Duidelijke prijzen. Snelle keuze.",
    deliveryDetails: "Bezorggegevens",
    name: "Volledige naam",
    phone: "Telefoon",
    address: "Straatnaam en huisnummer",
    postcode: "Postcode",
    postcodeHint: "bijv. 1032 KL",
    deliveryAreaNote: "Wij bezorgen momenteel alleen binnen Amsterdam-Noord.",
    inDeliveryArea: "Goed nieuws — wij bezorgen op jouw adres!",
    outsideArea: "Sorry, wij bezorgen alleen binnen Amsterdam-Noord. Jouw postcode valt buiten ons bezorggebied.",
    invalidPostcode: "Voer een geldige Nederlandse postcode in (bijv. 1032 KL).",
    note: "Bestelnotitie",
    notePlaceholder: "Bezorginstructies of verzoeken — bijv. niet aanbellen, gebruik de achterdeur, geen koriander (optioneel)",
    orderNumber: "Bestelnr.",
    menuCategories: "categorieën",
    loyaltyApplied: "Loyaliteitskorting toegepast",
    orderPlaced: "Bestelling geplaatst! We bereiden uw eten.",
    selectItem: "Kies een product om te beginnen.",
    signInForDiscount: "Log in om punten te sparen en kortingen te ontgrendelen.",
    minOrderNote: "Minimale bestelling is €20 (vóór kortingen en punten).",
    minOrderCompanyNote: "Minimale bestelling voor bedrijfsaccounts is €100 (vóór kortingen en punten).",
    freeDeliveryNote: "Gratis bezorging bij bestellingen boven €30 (altijd gratis voor bedrijfsaccounts).",
    usePoints: "Loyaliteitspunten gebruiken",
    pointsAvailable: "punten beschikbaar",
    pointsHint: "1 punt = €1. Wissel punten in om je eten te betalen.",
    foodOnlyNote: "Kortingen gelden alleen voor eten - niet voor dranken.",
    vipPriceLabel: "VIP",
    readMore: "Meer informatie",
    ingredients: "Ingrediënten",
    allergens: "Allergenen",
    contains: "Bevat:",
    fulfillmentTitle: "Hoe wil je je bestelling ontvangen?",
    optionDelivery: "Bezorgen",
    optionDeliverySub: "Wij bezorgen op jouw adres",
    optionPickup: "Afhalen",
    optionPickupSub: "Zelf ophalen in de winkel",
    pickupInfo: "Haal je bestelling af op Klaprozenweg 36a, 1032 KL Amsterdam.",
    methodDelivery: "Bezorgen",
    methodPickup: "Afhalen",
  },
  auth: {
    loginTitle: "Welkom terug",
    registerTitle: "Maak je account",
    name: "Volledige naam",
    email: "E-mail",
    password: "Wachtwoord",
    phone: "Telefoon (optioneel)",
    adminCode: "Admincode (optioneel)",
    adminCodeHint: "Voer de admincode in om een beheerdersaccount te maken.",
    haveAccount: "Heb je al een account?",
    noAccount: "Nieuw hier?",
    loginButton: "Inloggen",
    registerButton: "Account maken",
    welcome: "Welkom",
    yourProfile: "Jouw profiel",
    memberSince: "Lid sinds",
    loyaltyPoints: "Loyaliteitspunten",
    ordersPlaced: "Bestellingen geplaatst",
    currentDiscount: "Huidige korting",
    loyaltyExplain: "Verdien 1 punt voor elke €10 die je uitgeeft - 1 punt is €1 waard. Wissel punten in voor gratis eten bij je volgende bestelling.",
    invalidLogin: "Ongeldige e-mail of wachtwoord.",
    emailTaken: "Dit e-mailadres is al geregistreerd.",
    wrongAdminCode: "De admincode is onjuist.",
    fillFields: "Vul alle verplichte velden in.",
  },
  company: {
    registerAs: "Registreren als",
    personal: "Particulier",
    company: "Bedrijf",
    btw: "BTW-nummer",
    kvk: "KVK-nummer",
    agreement:
      "Ik ga ermee akkoord dat zodra het eten is ontvangen, de factuur binnen 7 dagen moet worden betaald. Factuurgegevens worden automatisch naar het geregistreerde e-mailadres gestuurd.",
    badge: "Bedrijfsaccount",
    active: "Bedrijfsaccount - 20% korting op eten",
    activeDesc:
      "Uw bedrijf ontvangt altijd automatisch 20% korting op al het eten (dranken uitgezonderd). Facturen worden naar uw geregistreerde e-mail gestuurd en moeten binnen 7 dagen na ontvangst van uw bestelling worden betaald.",
    fillCompanyFields: "Vul uw BTW- en KVK-nummer in.",
    acceptAgreement: "U moet de betalingsovereenkomst accepteren om als bedrijf te registreren.",
    priceLabel: "B2B",
  },
  schedule: {
    title: "Bezorgplanning",
    asap: "Zo snel mogelijk",
    once: "Kies datum & tijd",
    workdays: "Elke werkdag",
    date: "Bezorgdatum",
    time: "Bezorgtijd",
    workdaysNote: "Uw bestelling wordt elke werkdag (ma–vr) op de gekozen tijd bezorgd. Ideaal voor het plannen van teamlunches.",
    scheduledFor: "Gepland voor",
    everyWorkday: "Elke werkdag om",
    pickDateTime: "Kies een bezorgdatum en -tijd.",
  },
  vip: {
    title: "VIP-lidmaatschap",
    badge: "VIP-lid",
    desc: "Krijg een permanente korting van 10% op al het eten (dranken uitgezonderd) - voor altijd.",
    buy: "Word nu VIP",
    saleTag: "Tijdelijke aanbieding",
    standardPrice: "Standaardprijs",
    active: "Je bent VIP-lid",
    activeDesc: "Je geniet van een permanente korting van 10% op al het eten. Bedankt dat je VIP bent!",
    haveCard: "Heb je al een VIP-kaart?",
    haveCardDesc: "Upload een foto van je fysieke VIP-kaart. Zodra ons team deze goedkeurt, wordt je VIP automatisch geactiveerd.",
    uploadCard: "VIP-kaart foto uploaden",
    requestPending: "VIP-kaart wordt beoordeeld",
    requestPendingDesc: "We hebben je VIP-kaart ontvangen. Ons team beoordeelt deze binnenkort en activeert je VIP-lidmaatschap.",
    or: "of",
  },
  reviews: {
    leaveReview: "Review schrijven",
    yourRating: "Jouw beoordeling",
    placeholder: "Hoe was je bestelling? Deel je ervaring…",
    submit: "Review plaatsen",
    thanks: "Bedankt voor je review!",
    reviewed: "Jouw review",
    basedOn: "Gebaseerd op",
    reviewsWord: "reviews",
    verifiedOrder: "Geverifieerde bestelling",
  },
  admin: {
    title: "Admin dashboard",
    subtitle: "Volg prestaties en beheer je menu.",
    accessDenied: "Alleen admins",
    accessDeniedText: "Je hebt een admin-account nodig voor deze pagina.",
    totalRevenue: "Totale omzet",
    totalOrders: "Totaal bestellingen",
    totalUsers: "Geregistreerde gebruikers",
    totalProducts: "Producten",
    avgOrder: "Gemiddelde bestelling",
    topProducts: "Topproducten",
    recentOrders: "Recente bestellingen",
    manageProducts: "Producten beheren",
    addProduct: "Product toevoegen",
    productName: "Naam",
    productDesc: "Omschrijving",
    productPrice: "Prijs (€)",
    productCategory: "Categorie",
    productImage: "Afbeelding",
    productDetail: "Lees meer-tekst",
    productDetailHint: "Uitgebreide omschrijving in de 'Lees meer'-pop-up van het product (optioneel)",
    save: "Product opslaan",
    saving: "Opslaan…",
    productAdded: "Product succesvol toegevoegd!",
    productUpdated: "Product succesvol bijgewerkt!",
    saveFailed: "Opslaan mislukt",
    nameRequired: "Voer een productnaam in.",
    priceInvalid: "Voer een geldige prijs in, bijv. 8.73",
    priceHint: "Gebruik een punt voor centen, bijv. 8.73 — een komma wordt automatisch omgezet.",
    imageError: "Deze afbeelding kon niet worden gelezen. Gebruik een JPG- of PNG-foto.",
    manageMenus: "Restaurants & categorieën",
    manageMenusSub: "Voeg restaurants en hun menucategorieën toe of verwijder ze.",
    addRestaurant: "Restaurant toevoegen",
    restaurantName: "Restaurantnaam",
    addCategoryBtn: "Categorie toevoegen",
    categoryName: "Categorienaam",
    pickIcon: "Icoon",
    brandExists: "Er bestaat al een restaurant met deze naam.",
    categoryExists: "Deze categorie bestaat al.",
    brandHasProducts: "Dit restaurant heeft nog producten — verwijder of verplaats ze eerst.",
    categoryHasProducts: "Deze categorie heeft nog producten — verwijder of verplaats ze eerst.",
    lastBrand: "Er is minimaal één restaurant nodig.",
    lastCategory: "Een restaurant heeft minimaal één categorie nodig.",
    filterAll: "Alle tijd",
    filterToday: "Vandaag",
    filterWeek: "Laatste 7 dagen",
    filterMonth: "Laatste 30 dagen",
    filterPickDate: "Kies een datum",
    noOrders: "Nog geen bestellingen.",
    ordersByCategory: "Verkoop per categorie",
    customerInsights: "Klantinzichten",
    customerInsightsSub: "Hoe elke klant bestelt — favorieten, uitgaven en activiteit.",
    customer: "Klant",
    favoriteProduct: "Favoriete product",
    favoriteCategory: "Favoriete categorie",
    ordersLabel: "Bestellingen",
    totalSpent: "Totaal besteed",
    avgSpent: "Gem. bestelling",
    lastOrder: "Laatste bestelling",
    itemsOrdered: "Bestelde items",
    noCustomers: "Nog geen klantgegevens.",
    guest: "Gast",
    deliveryArea: "Bezorggebied",
    editProduct: "Product bewerken",
    changeCategory: "Categorie",
    restaurant: "Restaurant",
    itemsToPrepare: "Te bereiden items",
    deleteConfirmTitle: "Product verwijderen?",
    deleteConfirmText: "Weet je zeker dat je dit product wilt verwijderen? Dit kan niet ongedaan worden gemaakt.",
    vipRequests: "VIP-kaart aanvragen",
    vipRequestsSub: "Keur klanten goed die een foto van hun fysieke VIP-kaart hebben geüpload.",
    recentlyOnline: "Recent online",
    recentlyOnlineSub: "De laatste 20 klanten die ingelogd de website bezochten.",
    justNow: "zojuist",
    minutesAgo: "{n} min geleden",
    hoursAgo: "{n} u geleden",
    daysAgo: "{n} d geleden",
    socialTitle: "Social media links",
    socialSub: "Voeg je profiellinks toe en zet de iconen aan die je in de footer van de website wilt tonen.",
    socialUrlPlaceholder: "https://…",
    socialVisible: "Zichtbaar",
    socialHidden: "Verborgen",
    socialSaved: "Opgeslagen",
    approve: "Goedkeuren",
    reject: "Afwijzen",
    noVipRequests: "Geen openstaande VIP-aanvragen.",
    vipCardApproved: "Goedgekeurd — VIP geactiveerd",
    vipCardRejected: "Afgewezen",
  },
  fulfillment: {
    paymentTitle: "Betaling",
    paid: "Betaald",
    unpaid: "Niet betaald",
    markPaid: "Markeer als betaald",
    markUnpaid: "Markeer als niet betaald",
    statusTitle: "Status",
    statusNew: "Bestelling ontvangen",
    statusPreparing: "In bereiding",
    statusDelivery: "Onderweg",
    statusDelivered: "Bezorgd",
    startPreparing: "Start bereiding",
    sendToCourier: "Aan koerier geven",
    markDelivered: "Markeer als bezorgd",
    completed: "Voltooid",
    orderManagement: "Bestelbeheer",
    orderManagementSub: "Bevestig betalingen en verplaats bestellingen door de bezorging.",
    trackOrder: "Volg je bestelling",
    invoiced: "Gefactureerd — betaal binnen 7 dagen",
    noActiveOrders: "Momenteel geen actieve bestellingen.",
    customerOrders: "Klantbestellingen",
    companyOrders: "Bedrijfsbestellingen",
    customerNote: "Klantnotitie",
    invoiceSent: "Factuur verzonden",
    invoiceNotSent: "Factuur niet verzonden",
    markInvoiceSent: "Markeer factuur verzonden",
    markInvoiceNotSent: "Markeer factuur niet verzonden",
    companyDetails: "Bedrijfsgegevens",
    noCustomerOrders: "Nog geen klantbestellingen.",
    noCompanyOrders: "Nog geen bedrijfsbestellingen.",
    orderNumber: "Bestelnr.",
    searchCustomers: "Zoek op naam of bestelnummer…",
    searchCompanies: "Zoek op bedrijf of bestelnummer…",
    noMatches: "Geen bestellingen gevonden.",
  },
  pay: {
    processing: "Je betaling wordt bevestigd…",
    processingDesc: "Dit duurt maar even. Sluit deze pagina niet.",
    success: "Betaling geslaagd!",
    orderConfirmed: "Bedankt! Je bestelling is bevestigd en we bereiden je eten.",
    vipActivated: "Welkom als VIP! Je korting van 10% is nu actief.",
    failed: "Betaling niet voltooid",
    failedDesc: "Je betaling is geannuleerd of niet gelukt. Je kunt het opnieuw proberen.",
    tryAgain: "Opnieuw proberen",
    viewOrders: "Bekijk mijn bestellingen",
    goToAccount: "Naar mijn account",
    backToMenu: "Terug naar menu",
    redirecting: "Doorsturen naar veilige betaling…",
  },
  email: {
    verifyBanner: "Bevestig je e-mailadres",
    verifyBannerSub: "We hebben een bevestigingslink naar je inbox gestuurd.",
    resend: "E-mail opnieuw sturen",
    resendSent: "Verzonden! Check je inbox.",
    verifyingTitle: "Je e-mail wordt bevestigd…",
    verifySuccess: "E-mail bevestigd!",
    verifySuccessText: "Bedankt — je e-mailadres is nu geverifieerd.",
    verifyFail: "Link verlopen of ongeldig",
    verifyFailText: "Deze bevestigingslink is niet meer geldig. Je kunt een nieuwe aanvragen vanuit je account.",
    forgotLink: "Wachtwoord vergeten?",
    forgotTitle: "Wachtwoord opnieuw instellen",
    forgotText: "Voer je e-mailadres in en we sturen je een link om je wachtwoord opnieuw in te stellen.",
    emailLabel: "E-mail",
    forgotSubmit: "Verstuur resetlink",
    forgotSent: "Als dat e-mailadres is geregistreerd, is er een resetlink onderweg. Check je inbox.",
    resetTitle: "Kies een nieuw wachtwoord",
    resetText: "Voer een nieuw wachtwoord in voor je account.",
    newPassword: "Nieuw wachtwoord",
    confirmPassword: "Bevestig wachtwoord",
    resetSubmit: "Wachtwoord bijwerken",
    resetSuccess: "Wachtwoord bijgewerkt!",
    resetSuccessText: "Je kunt nu inloggen met je nieuwe wachtwoord.",
    resetInvalid: "Deze resetlink is ongeldig of verlopen.",
    passwordMismatch: "Wachtwoorden komen niet overeen.",
    passwordWeak: "Wachtwoord moet minstens 6 tekens bevatten.",
    backToSignIn: "Terug naar inloggen",
    goToAccount: "Naar mijn account",
  },
  footer: {
    tagline:
      "Heerlijke wraps, burgers, pizza's en verse dranken. Eat to go staat voor smaak, versheid en gemak - perfect voor onderweg.",
    contact: "Contact",
    followUs: "Volg ons",
    rights: "Alle rechten voorbehouden.",
    address: "Adres",
    ourRestaurants: "Onze Restaurants",
    theMaison: "The Maison",
    theTandoor: "The Tandoor Company",
    legal: "Juridisch",
    privacy: "Privacybeleid",
    terms: "Algemene Voorwaarden",
  },
  hours: {
    title: "Openingstijden",
    tueSun: "di – zo",
    monday: "maandag",
    closed: "Gesloten",
    openNow: "Nu geopend",
    closedNow: "Nu gesloten",
    closedNote: "Wij zijn momenteel gesloten. U kunt bestellen van dinsdag t/m zondag tussen 14:00 en 20:00 (maandag gesloten).",
    preOrderToday: "Wij zijn nu gesloten, maar u kunt uw bestelling al plaatsen — wij beginnen vandaag vanaf 14:00 met bereiden.",
    preOrderDay: "Wij zijn nu gesloten, maar u kunt uw bestelling al plaatsen — wij beginnen op {day} vanaf 14:00 met bereiden.",
    scheduleClosedNote: "Kies een bezorgmoment binnen onze openingstijden: dinsdag t/m zondag, 14:00–20:00 (maandag gesloten).",
  },
  cookies: {
    message:
      "Wij gebruiken alleen functionele cookies die noodzakelijk zijn voor het functioneren van de website (uw sessie, winkelwagen en voorkeuren). Wij gebruiken geen tracking- of advertentiecookies.",
    accept: "Accepteren",
    decline: "Alleen noodzakelijk",
    learnMore: "Meer informatie",
  },
};

export const translations: Record<Lang, Dictionary> = { en, nl };
