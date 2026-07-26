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
    reservations: string;
    events: string;
    eventsOverview: string;
    eventsAbout: string;
    eventsGallery: string;
    eventsBirthdays: string;
    eventsCelebrations: string;
    eventsCompanyCatering: string;
    eventsCompanyLunches: string;
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
    heroTitleAccent: string;
    heroSubtitle: string;
    heroCtaReserve: string;
    heroCtaMenu: string;
    statYears: string;
    statDishes: string;
    statGuests: string;
    statRating: string;
    aboutOverline: string;
    aboutTitle: string;
    aboutText: string;
    aboutCta: string;
    storyOverline: string;
    storyTitle: string;
    storyText: string;
    storyText2: string;
    storyQuote: string;
    storyPoint1: string;
    storyPoint2: string;
    storyPoint3: string;
    featuresOverline: string;
    featuresTitle: string;
    feature1Title: string;
    feature1Text: string;
    feature2Title: string;
    feature2Text: string;
    feature3Title: string;
    feature3Text: string;
    popularOverline: string;
    popularTitle: string;
    popularSubtitle: string;
    ambianceOverline: string;
    ambianceTitle: string;
    ambianceText: string;
    ambianceCta: string;
    hoursTitle: string;
    reserveOverline: string;
    reserveTitle: string;
    reserveText: string;
    reserveCta: string;
    makeOrder: string;
    testimonialsOverline: string;
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
    freeDeliveryUnlocked: string;
    securePayment: string;
    usePoints: string;
    pointsAvailable: string;
    pointsHint: string;
    willEarnPoints: string;
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
    menuUpgradeTitle: string;
    menuUpgradeHint: string;
    menuUpgradeDrink: string;
    menuUpgradeNoDrinks: string;
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
    verifiedVisit: string;
    reservationPlaceholder: string;
  };
  reservations: {
    overline: string;
    title: string;
    subtitle: string;
    formTitle: string;
    name: string;
    email: string;
    emailHint: string;
    phone: string;
    date: string;
    time: string;
    guests: string;
    guestsSuffix: string;
    occasion: string;
    occasionNone: string;
    occasionBirthday: string;
    occasionBusiness: string;
    occasionRomantic: string;
    occasionFamily: string;
    occasionOther: string;
    note: string;
    notePlaceholder: string;
    submit: string;
    submitting: string;
    successTitle: string;
    successText: string;
    successEmailNote: string;
    makeAnother: string;
    errorFillFields: string;
    errorInvalidSlot: string;
    errorPastDate: string;
    errorGeneric: string;
    hoursNote: string;
    largeGroupNote: string;
    myReservations: string;
    location: string;
    locationSubtitle: string;
    getDirections: string;
    noReservations: string;
    statusPending: string;
    statusConfirmed: string;
    statusDeclined: string;
    statusCancelled: string;
    cancelBooking: string;
    signInPrompt: string;
    infoTitle: string;
    info1Title: string;
    info1Text: string;
    info2Title: string;
    info2Text: string;
    info3Title: string;
    info3Text: string;
    guestsLabel: string;
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
    productSearch: string;
    allRestaurants: string;
    allCategories: string;
    noProductMatches: string;
    productDesc: string;
    productDescNl: string;
    productPrice: string;
    productCategory: string;
    productImage: string;
    productDetail: string;
    productDetailNl: string;
    productDetailHint: string;
    productIngredients: string;
    productIngredientsNl: string;
    productAllergens: string;
    productAllergensNl: string;
    listHint: string;
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
    uploadLogo: string;
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
    sellAtRestaurants: string;
    atLeastOneRestaurant: string;
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
    onlineNow: string;
    signedInLabel: string;
    guestsLabel: string;
    bookedOn: string;
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
    reservationsTitle: string;
    reservationsSub: string;
    noReservationsAdmin: string;
    resConfirm: string;
    resDecline: string;
    resCancelAdmin: string;
    resUpcoming: string;
    resAll: string;
  };
  fulfillment: {
    paymentTitle: string;
    paid: string;
    unpaid: string;
    paymentOpen: string;
    paymentPending: string;
    paymentFailed: string;
    paymentCanceled: string;
    paymentExpired: string;
    paymentReason: string;
    molliePaymentId: string;
    markPaid: string;
    markUnpaid: string;
    showOrderDetails: string;
    hideOrderDetails: string;
    deleteExpiredOrder: string;
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
    eatToGo: string;
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
  terminal: {
    title: string;
    subtitle: string;
    startShift: string;
    startShiftHint: string;
    live: string;
    autoPrint: string;
    print: string;
    noOrders: string;
    activeOrders: string;
    doneOrders: string;
    newOrderAlert: string;
    printerHelp: string;
    accessDenied: string;
    lastUpdate: string;
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
    reservations: "Reservations",
    events: "Events",
    eventsOverview: "Events overview",
    eventsAbout: "About us",
    eventsGallery: "Gallery",
    eventsBirthdays: "Birthdays & parties",
    eventsCelebrations: "Celebrations & weddings",
    eventsCompanyCatering: "Company catering",
    eventsCompanyLunches: "Company lunches",
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
    badge: "Authentic Indian · Amsterdam-Noord",
    heroTitle: "Where the fire of the tandoor meets",
    heroTitleAccent: "the soul of India",
    heroSubtitle:
      "Discover the rich flavours of India - freshly prepared curries, tandoori grills, biryani and naan, straight from our traditional clay oven. For dining in, pickup and delivery in Amsterdam-Noord.",
    heroCtaReserve: "Reserve a table",
    heroCtaMenu: "Explore the menu",
    statYears: "Years of experience",
    statDishes: "Famous dishes",
    statGuests: "Happy guests",
    statRating: "Average rating",
    aboutOverline: "About The Tandoor Company",
    aboutTitle: "Passion for flavour and tradition",
    aboutText:
      "At The Tandoor Company we bring the authentic flavours of India to your table. Our chefs prepare fresh curries, tandoori grills and traditional dishes every day, with high-quality ingredients, aromatic spices and time-honoured recipes. Locally sourced produce, vegetarian and diet-friendly options, and exquisite combinations - every plate is made with care and love.",
    aboutCta: "Reserve your evening",
    storyOverline: "A family story",
    storyTitle: "Three generations of flavour, one family dream",
    storyText:
      "Behind our kitchen lies a remarkable story. Our father has more than 32 years of hospitality experience in the Netherlands, and before that spent 8 years in the kitchens of five-star hotels in India. Throughout his career he opened more than 28 restaurants for others and trained over 40 chefs in the art of Indian cooking - his dishes even reached the kitchens of Bollywood stars such as Amitabh Bachchan.",
    storyText2:
      "Today, together with his sons, it is finally time for something of our own: The Tandoor Company - a restaurant where decades of experience, family tradition and love for authentic Indian flavours come together.",
    storyQuote: "Good food begins with passion, tradition and attention to detail.",
    storyPoint1: "32+ years of hospitality craftsmanship",
    storyPoint2: "28+ restaurants opened, 40+ chefs trained",
    storyPoint3: "Chef to Bollywood stars",
    featuresOverline: "Our promises",
    featuresTitle: "Our promises to every guest",
    feature1Title: "Traditional tandoor",
    feature1Text: "Authentic and pure - marinated overnight and grilled in our traditional clay oven for that unmistakable smoky flavour.",
    feature2Title: "Fresh ingredients",
    feature2Text: "Prepared fresh every day with locally sourced produce, hand-ground spices and vegetarian and diet-friendly options.",
    feature3Title: "Warm hospitality",
    feature3Text: "Always with care. From a spontaneous dinner to a festive evening - our family welcomes you as one of our own.",
    popularOverline: "From the tandoor",
    popularTitle: "The most beloved flavours",
    popularSubtitle:
      "From tandoori specialties to creamy curries - a taste of the dishes our guests return for, freshly prepared every day.",
    ambianceOverline: "Atmosphere & experience",
    ambianceTitle: "A look inside The Tandoor Company",
    ambianceText:
      "Discover the warm ambiance, the scent of fresh spices and the glow of the tandoor that define our restaurant. Flavour, warmth and experience - valued by our guests time and again.",
    ambianceCta: "View the full gallery",
    hoursTitle: "Opening hours",
    reserveOverline: "Reservations",
    reserveTitle: "Your table awaits",
    reserveText:
      "Reserve your table for a cosy dinner, a family celebration or an evening full of Indian flavours. We look forward to welcoming you.",
    reserveCta: "Book your table",
    makeOrder: "Order now",
    testimonialsOverline: "Guest experiences",
    testimonialsTitle: "What our guests say",
    testimonialsSubtitle: "Honest impressions of an evening at The Tandoor Company - from the tandoori grills and curries to the warmth of our service.",
    ctaTitle: "Join us for a delicious meal",
    ctaText:
      "Whether you crave a smoky tandoori grill, a rich curry or a festive dinner with family and friends - our kitchen is fired up and ready for you.",
    ctaButton: "Reserve now",
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
    inDeliveryArea: "Great news - we deliver to your address!",
    outsideArea: "Sorry, we only deliver within Amsterdam-Noord. Your postcode is outside our delivery area.",
    invalidPostcode: "Please enter a valid Dutch postcode (e.g. 1032 KL).",
    note: "Order note",
    notePlaceholder: "Delivery instructions or requests - e.g. don't ring the bell, use back door, no coriander (optional)",
    orderNumber: "Order no.",
    menuCategories: "categories",
    loyaltyApplied: "Loyalty discount applied",
    orderPlaced: "Order placed! We are preparing your food.",
    selectItem: "Select an item to start your order.",
    signInForDiscount: "Sign in to earn loyalty points and unlock discounts.",
    minOrderNote: "Minimum order is €20 (before discounts and points).",
    minOrderCompanyNote: "Minimum order for company accounts is €100 (before discounts and points).",
    freeDeliveryNote: "Free delivery on orders over €30 (always free for company accounts).",
    freeDeliveryUnlocked: "Free delivery unlocked!",
    securePayment: "Secure payment via Mollie · iDEAL",
    usePoints: "Use loyalty points",
    pointsAvailable: "points available",
    pointsHint: "1 point = €1. Redeem points to pay for your food.",
    willEarnPoints: "You'll earn {points} loyalty point(s) with this order",
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
    menuUpgradeTitle: "Make it a full menu",
    menuUpgradeHint: "+€4 includes fries and one free soft drink.",
    menuUpgradeDrink: "Free soft drink",
    menuUpgradeNoDrinks: "Add a soft drink in admin to enable menu upgrades.",
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
    verifiedVisit: "Verified visit",
    reservationPlaceholder: "How was your visit? Share your experience…",
  },
  reservations: {
    overline: "Reservations",
    title: "Reserve your table",
    subtitle:
      "An unforgettable evening begins here. Choose your date, time and party size - our team will confirm your reservation shortly.",
    formTitle: "Booking details",
    name: "Full name",
    email: "Email address",
    emailHint: "We send your confirmation to this address.",
    phone: "Phone number",
    date: "Date",
    time: "Time",
    guests: "Guests",
    guestsSuffix: "guests",
    occasion: "Occasion (optional)",
    occasionNone: "No special occasion",
    occasionBirthday: "Birthday",
    occasionBusiness: "Business dinner",
    occasionRomantic: "Romantic dinner",
    occasionFamily: "Family gathering",
    occasionOther: "Other celebration",
    note: "Special requests (optional)",
    notePlaceholder: "Allergies, seating preference, celebrations, high chair…",
    submit: "Request reservation",
    submitting: "Sending…",
    successTitle: "Reservation received!",
    successText: "Thank you - we have received your reservation. Our team will review it and confirm shortly.",
    successEmailNote: "A confirmation email is on its way to",
    makeAnother: "Make another reservation",
    errorFillFields: "Please fill in all required fields.",
    errorInvalidSlot: "We are closed at that time. Please pick a time between 17:00 and 22:30, Tuesday to Sunday.",
    errorPastDate: "That moment has already passed - please pick a future date and time.",
    errorGeneric: "Something went wrong. Please try again or call us at +31 20 341 2995.",
    hoursNote: "We welcome guests Tuesday to Sunday, 17:00 – 22:30. Closed on Mondays.",
    largeGroupNote: "Party larger than 12? Add a note or call us - we love hosting groups and will arrange the perfect setting.",
    myReservations: "My reservations",
    location: "Our location",
    locationSubtitle: "You'll find us on Klaprozenweg in Amsterdam-Noord - easy to reach by car, bike or public transport. Step inside and let the warmth of the tandoor welcome you.",
    getDirections: "Get directions",
    noReservations: "No reservations yet. Your bookings will appear here.",
    statusPending: "Awaiting confirmation",
    statusConfirmed: "Confirmed",
    statusDeclined: "Declined",
    statusCancelled: "Cancelled",
    cancelBooking: "Cancel reservation",
    signInPrompt: "Sign in to manage your reservations and book faster with your saved details.",
    infoTitle: "Good to know",
    info1Title: "Flexible until the last moment",
    info1Text: "Plans changed? Cancel or adjust your reservation free of charge up to 2 hours in advance.",
    info2Title: "Groups & celebrations",
    info2Text: "From intimate dinners to festive tables for 40 guests - tell us the occasion and we prepare everything.",
    info3Title: "Personal confirmation",
    info3Text: "Every request is personally reviewed by our team. You receive a confirmation by email.",
    guestsLabel: "guest(s)",
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
    productSearch: "Search products",
    allRestaurants: "All restaurants",
    allCategories: "All categories",
    noProductMatches: "No products match these filters.",
    productDesc: "Description (English)",
    productDescNl: "Description (Dutch)",
    productPrice: "Price (€)",
    productCategory: "Category",
    productImage: "Image",
    productDetail: "Read more text (English)",
    productDetailNl: "Read more text (Dutch)",
    productDetailHint: "Detailed description shown in the product's 'Read more' popup (optional)",
    productIngredients: "Ingredients (English)",
    productIngredientsNl: "Ingredients (Dutch)",
    productAllergens: "Allergens (English)",
    productAllergensNl: "Allergens (Dutch)",
    listHint: "Separate items with commas, e.g. Paneer cheese, Spinach, Cream",
    save: "Save product",
    saving: "Saving…",
    productAdded: "Product added successfully!",
    productUpdated: "Product updated successfully!",
    saveFailed: "Saving failed",
    nameRequired: "Enter a product name.",
    priceInvalid: "Enter a valid price, e.g. 8.73",
    priceHint: "Use a dot for cents, e.g. 8.73 - a comma is converted automatically.",
    imageError: "This image could not be read. Please use a JPG or PNG photo.",
    manageMenus: "Restaurants & categories",
    manageMenusSub: "Add or remove restaurants and their menu categories.",
    addRestaurant: "Add restaurant",
    restaurantName: "Restaurant name",
    uploadLogo: "Upload logo",
    addCategoryBtn: "Add category",
    categoryName: "Category name",
    pickIcon: "Icon",
    brandExists: "A restaurant with this name already exists.",
    categoryExists: "This category already exists.",
    brandHasProducts: "This restaurant still has products - delete or move them first.",
    categoryHasProducts: "This category still has products - delete or move them first.",
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
    customerInsightsSub: "How each customer orders - favourites, spend and activity.",
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
    sellAtRestaurants: "Sold at these restaurants",
    atLeastOneRestaurant: "Select at least one restaurant",
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
    onlineNow: "Online now",
    signedInLabel: "signed in",
    guestsLabel: "guests",
    bookedOn: "Booked",
    socialTitle: "Social media links",
    socialSub: "Add your profile links and switch on the icons you want to show in the website footer.",
    socialUrlPlaceholder: "https://…",
    socialVisible: "Visible",
    socialHidden: "Hidden",
    socialSaved: "Saved",
    approve: "Approve",
    reject: "Reject",
    noVipRequests: "No pending VIP requests.",
    vipCardApproved: "Approved - VIP activated",
    vipCardRejected: "Rejected",
    reservationsTitle: "Table reservations",
    reservationsSub: "Confirm, decline or cancel guest bookings.",
    noReservationsAdmin: "No reservations in this view.",
    resConfirm: "Confirm",
    resDecline: "Decline",
    resCancelAdmin: "Cancel",
    resUpcoming: "Upcoming",
    resAll: "All",
  },
  fulfillment: {
    paymentTitle: "Payment",
    paid: "Paid",
    unpaid: "Unpaid",
    paymentOpen: "Payment started",
    paymentPending: "Payment pending",
    paymentFailed: "Payment failed",
    paymentCanceled: "Payment cancelled",
    paymentExpired: "Payment expired",
    paymentReason: "Reason",
    molliePaymentId: "Mollie ID",
    markPaid: "Mark as paid",
    markUnpaid: "Mark as unpaid",
    showOrderDetails: "Show details",
    hideOrderDetails: "Hide details",
    deleteExpiredOrder: "Cancel expired order",
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
    invoiced: "Invoiced - pay within 7 days",
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
    verifySuccessText: "Thank you - your email address is now verified.",
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
      "Authentic Indian cuisine with classic tandoori grills, rich curries and fresh flavours - prepared with passion by our family, for yours.",
    contact: "Contact",
    followUs: "Follow us",
    rights: "All rights reserved.",
    address: "Address",
    ourRestaurants: "Our Restaurants",
    eatToGo: "Eat to go",
    theTandoor: "The Maison",
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
    closedNote: "We are currently closed. You can order Tuesday to Sunday between 17:00 and 22:30 (closed on Mondays).",
    preOrderToday: "We are closed right now, but you can already place your order - we will start preparing it today from 17:00.",
    preOrderDay: "We are closed right now, but you can already place your order - we will start preparing it on {day} from 17:00.",
    scheduleClosedNote: "Please pick a delivery slot within our opening hours: Tuesday to Sunday, 17:00–22:30 (closed on Mondays).",
  },
  cookies: {
    message:
      "We use only functional cookies that are necessary for the website to work (your session, cart and preferences). We do not use tracking or advertising cookies.",
    accept: "Accept",
    decline: "Only necessary",
    learnMore: "Learn more",
  },
  terminal: {
    title: "Kitchen terminal",
    subtitle: "Live order feed for staff - new orders arrive automatically and can be printed as a receipt.",
    startShift: "Start shift",
    startShiftHint: "Tap to enable sound alerts and keep the screen awake.",
    live: "Live - checking for new orders",
    autoPrint: "Auto-print new orders",
    print: "Print receipt",
    noOrders: "No active orders right now. New orders appear here automatically.",
    activeOrders: "Active orders",
    doneOrders: "Completed today",
    newOrderAlert: "NEW",
    printerHelp: "Printing uses the RawBT app (set it to the built-in printer). If nothing prints, install RawBT from the Play Store and open it once.",
    accessDenied: "Sign in with a staff (admin) account to use the terminal.",
    lastUpdate: "Updated",
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
    reservations: "Reserveren",
    events: "Evenementen",
    eventsOverview: "Evenementen overzicht",
    eventsAbout: "Over ons",
    eventsGallery: "Galerij",
    eventsBirthdays: "Verjaardagen & feesten",
    eventsCelebrations: "Vieringen & bruiloften",
    eventsCompanyCatering: "Bedrijfscatering",
    eventsCompanyLunches: "Bedrijfslunches",
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
    badge: "Authentiek Indiaas · Amsterdam-Noord",
    heroTitle: "Waar het vuur van de tandoor",
    heroTitleAccent: "de ziel van India ontmoet",
    heroSubtitle:
      "Ontdek de rijke smaken van India - vers bereide curry's, tandoori grills, biryani en naan, rechtstreeks uit onze traditionele kleioven. Voor dine-in, afhalen en bezorgen in Amsterdam-Noord.",
    heroCtaReserve: "Reserveer een tafel",
    heroCtaMenu: "Ontdek het menu",
    statYears: "Jaar ervaring",
    statDishes: "Beroemde gerechten",
    statGuests: "Tevreden gasten",
    statRating: "Gemiddelde beoordeling",
    aboutOverline: "Over The Tandoor Company",
    aboutTitle: "Passie voor smaak en traditie",
    aboutText:
      "Bij The Tandoor Company brengen we de authentieke smaken van India naar uw tafel. Onze chefs bereiden elke dag verse curry's, tandoori grills en traditionele gerechten met hoogwaardige ingrediënten, aromatische kruiden en beproefde recepten. Lokaal geproduceerde ingrediënten, vegetarische en dieetvriendelijke opties en exquise combinaties - elk gerecht wordt met zorg en liefde gemaakt.",
    aboutCta: "Reserveer uw avond",
    storyOverline: "Een familieverhaal",
    storyTitle: "Drie generaties smaak, één familiedroom",
    storyText:
      "Achter onze keuken schuilt een bijzonder verhaal. Onze vader heeft meer dan 32 jaar ervaring in de horeca in Nederland en werkte daarvoor 8 jaar in de keukens van vijfsterrenhotels in India. Gedurende zijn carrière heeft hij meer dan 28 restaurants voor anderen opgezet en meer dan 40 koks opgeleid in de kunst van de Indiase keuken - zijn gerechten brachten hem zelfs in de keukens van Bollywoodsterren zoals Amitabh Bachchan.",
    storyText2:
      "Vandaag zetten wij zijn passie voort. Samen met zijn zonen is het eindelijk tijd voor iets van onszelf: The Tandoor Company - een restaurant waar jarenlange ervaring, familietraditie en liefde voor authentieke Indiase smaken samenkomen.",
    storyQuote: "Goed eten begint met passie, traditie en aandacht voor detail.",
    storyPoint1: "32+ jaar horeca-vakmanschap",
    storyPoint2: "28+ restaurants opgezet, 40+ koks opgeleid",
    storyPoint3: "Chef van Bollywoodsterren",
    featuresOverline: "Onze beloftes",
    featuresTitle: "Onze beloftes aan elke gast",
    feature1Title: "Traditionele tandoor",
    feature1Text: "Authentiek en puur - een nacht gemarineerd en gegrild in onze traditionele kleioven voor die onmiskenbare rokerige smaak.",
    feature2Title: "Verse ingrediënten",
    feature2Text: "Dagelijks vers bereid met lokaal geproduceerde ingrediënten, handgemalen kruiden en vegetarische en dieetvriendelijke opties.",
    feature3Title: "Warme gastvrijheid",
    feature3Text: "Altijd met zorg. Van een spontaan diner tot een feestelijke avond - onze familie verwelkomt u als één van ons.",
    popularOverline: "Uit de tandoor",
    popularTitle: "De meest geliefde smaken",
    popularSubtitle:
      "Van tandoori specialiteiten tot romige curry's - een voorproefje van de gerechten waarvoor onze gasten terugkomen, elke dag vers bereid.",
    ambianceOverline: "Sfeer & beleving",
    ambianceTitle: "Een kijkje binnen The Tandoor Company",
    ambianceText:
      "Ontdek de warme ambiance, de geur van verse kruiden en de gloed van de tandoor die ons restaurant vormen. Smaak, warmte en beleving - keer op keer gewaardeerd door onze gasten.",
    ambianceCta: "Bekijk de volledige galerij",
    hoursTitle: "Openingstijden",
    reserveOverline: "Reserveringen",
    reserveTitle: "Uw tafel staat klaar",
    reserveText:
      "Reserveer uw tafel voor een gezellig diner, een familiefeest of een avond vol Indiase smaken. Wij kijken ernaar uit u te verwelkomen.",
    reserveCta: "Reserveer uw tafel",
    makeOrder: "Bestel nu",
    testimonialsOverline: "Gastervaringen",
    testimonialsTitle: "Wat onze gasten zeggen",
    testimonialsSubtitle: "Eerlijke ervaringen van een avond bij The Tandoor Company - van de tandoori grills en curry's tot de warmte van onze service.",
    ctaTitle: "Kom bij ons voor een heerlijke maaltijd",
    ctaText:
      "Of u nu zin heeft in een rokerige tandoori grill, een rijke curry of een feestelijk diner met familie en vrienden - onze keuken staat voor u klaar.",
    ctaButton: "Reserveer nu",
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
    inDeliveryArea: "Goed nieuws - wij bezorgen op jouw adres!",
    outsideArea: "Sorry, wij bezorgen alleen binnen Amsterdam-Noord. Jouw postcode valt buiten ons bezorggebied.",
    invalidPostcode: "Voer een geldige Nederlandse postcode in (bijv. 1032 KL).",
    note: "Bestelnotitie",
    notePlaceholder: "Bezorginstructies of verzoeken - bijv. niet aanbellen, gebruik de achterdeur, geen koriander (optioneel)",
    orderNumber: "Bestelnr.",
    menuCategories: "categorieën",
    loyaltyApplied: "Loyaliteitskorting toegepast",
    orderPlaced: "Bestelling geplaatst! We bereiden uw eten.",
    selectItem: "Kies een product om te beginnen.",
    signInForDiscount: "Log in om punten te sparen en kortingen te ontgrendelen.",
    minOrderNote: "Minimale bestelling is €20 (vóór kortingen en punten).",
    minOrderCompanyNote: "Minimale bestelling voor bedrijfsaccounts is €100 (vóór kortingen en punten).",
    freeDeliveryNote: "Gratis bezorging bij bestellingen boven €30 (altijd gratis voor bedrijfsaccounts).",
    freeDeliveryUnlocked: "Gratis bezorging ontgrendeld!",
    securePayment: "Veilig betalen via Mollie · iDEAL",
    usePoints: "Loyaliteitspunten gebruiken",
    pointsAvailable: "punten beschikbaar",
    pointsHint: "1 punt = €1. Wissel punten in om je eten te betalen.",
    willEarnPoints: "U verdient {points} loyaliteitspunt(en) met deze bestelling",
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
    menuUpgradeTitle: "Maak er een volledig menu van",
    menuUpgradeHint: "+€4 inclusief friet en één gratis frisdrank.",
    menuUpgradeDrink: "Gratis frisdrank",
    menuUpgradeNoDrinks: "Voeg in admin een frisdrank toe om menu-upgrades te activeren.",
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
    verifiedVisit: "Geverifieerd bezoek",
    reservationPlaceholder: "Hoe was uw bezoek? Deel uw ervaring…",
  },
  reservations: {
    overline: "Reserveringen",
    title: "Reserveer uw tafel",
    subtitle:
      "Een onvergetelijke avond begint hier. Kies uw datum, tijd en gezelschap - ons team bevestigt uw reservering spoedig.",
    formTitle: "Reserveringsgegevens",
    name: "Volledige naam",
    email: "E-mailadres",
    emailHint: "Wij sturen uw bevestiging naar dit adres.",
    phone: "Telefoonnummer",
    date: "Datum",
    time: "Tijd",
    guests: "Gasten",
    guestsSuffix: "gasten",
    occasion: "Gelegenheid (optioneel)",
    occasionNone: "Geen speciale gelegenheid",
    occasionBirthday: "Verjaardag",
    occasionBusiness: "Zakelijk diner",
    occasionRomantic: "Romantisch diner",
    occasionFamily: "Familiebijeenkomst",
    occasionOther: "Andere viering",
    note: "Speciale verzoeken (optioneel)",
    notePlaceholder: "Allergieën, zitvoorkeur, feestelijkheden, kinderstoel…",
    submit: "Reservering aanvragen",
    submitting: "Versturen…",
    successTitle: "Reservering ontvangen!",
    successText: "Dank u wel - wij hebben uw reservering ontvangen. Ons team bekijkt deze en bevestigt spoedig.",
    successEmailNote: "Een bevestigingsmail is onderweg naar",
    makeAnother: "Nog een reservering maken",
    errorFillFields: "Vul alle verplichte velden in.",
    errorInvalidSlot: "Wij zijn op dat moment gesloten. Kies een tijd tussen 17:00 en 22:30, dinsdag t/m zondag.",
    errorPastDate: "Dat moment is al voorbij - kies een datum en tijd in de toekomst.",
    errorGeneric: "Er ging iets mis. Probeer het opnieuw of bel ons op +31 20 341 2995.",
    hoursNote: "Wij verwelkomen gasten van dinsdag t/m zondag, 17:00 – 22:30. Maandag gesloten.",
    largeGroupNote: "Gezelschap groter dan 12? Voeg een notitie toe of bel ons - wij ontvangen graag groepen en regelen de perfecte setting.",
    myReservations: "Mijn reserveringen",
    location: "Onze locatie",
    locationSubtitle: "U vindt ons aan de Klaprozenweg in Amsterdam-Noord - goed bereikbaar met auto, fiets en openbaar vervoer. Stap binnen en laat de warmte van de tandoor u verwelkomen.",
    getDirections: "Routebeschrijving",
    noReservations: "Nog geen reserveringen. Uw boekingen verschijnen hier.",
    statusPending: "Wacht op bevestiging",
    statusConfirmed: "Bevestigd",
    statusDeclined: "Afgewezen",
    statusCancelled: "Geannuleerd",
    cancelBooking: "Reservering annuleren",
    signInPrompt: "Log in om uw reserveringen te beheren en sneller te boeken met uw opgeslagen gegevens.",
    infoTitle: "Goed om te weten",
    info1Title: "Flexibel tot het laatste moment",
    info1Text: "Plannen gewijzigd? Annuleer of wijzig uw reservering kosteloos tot 2 uur van tevoren.",
    info2Title: "Groepen & vieringen",
    info2Text: "Van intieme diners tot feestelijke tafels voor 40 gasten - vertel ons de gelegenheid en wij bereiden alles voor.",
    info3Title: "Persoonlijke bevestiging",
    info3Text: "Elke aanvraag wordt persoonlijk beoordeeld door ons team. U ontvangt een bevestiging per e-mail.",
    guestsLabel: "gast(en)",
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
    productSearch: "Producten zoeken",
    allRestaurants: "Alle restaurants",
    allCategories: "Alle categorieën",
    noProductMatches: "Geen producten gevonden met deze filters.",
    productDesc: "Omschrijving (Engels)",
    productDescNl: "Omschrijving (Nederlands)",
    productPrice: "Prijs (€)",
    productCategory: "Categorie",
    productImage: "Afbeelding",
    productDetail: "Lees meer-tekst (Engels)",
    productDetailNl: "Lees meer-tekst (Nederlands)",
    productDetailHint: "Uitgebreide omschrijving in de 'Lees meer'-pop-up van het product (optioneel)",
    productIngredients: "Ingrediënten (Engels)",
    productIngredientsNl: "Ingrediënten (Nederlands)",
    productAllergens: "Allergenen (Engels)",
    productAllergensNl: "Allergenen (Nederlands)",
    listHint: "Scheid items met komma's, bijv. Paneer kaas, Spinazie, Room",
    save: "Product opslaan",
    saving: "Opslaan…",
    productAdded: "Product succesvol toegevoegd!",
    productUpdated: "Product succesvol bijgewerkt!",
    saveFailed: "Opslaan mislukt",
    nameRequired: "Voer een productnaam in.",
    priceInvalid: "Voer een geldige prijs in, bijv. 8.73",
    priceHint: "Gebruik een punt voor centen, bijv. 8.73 - een komma wordt automatisch omgezet.",
    imageError: "Deze afbeelding kon niet worden gelezen. Gebruik een JPG- of PNG-foto.",
    manageMenus: "Restaurants & categorieën",
    manageMenusSub: "Voeg restaurants en hun menucategorieën toe of verwijder ze.",
    addRestaurant: "Restaurant toevoegen",
    restaurantName: "Restaurantnaam",
    uploadLogo: "Logo uploaden",
    addCategoryBtn: "Categorie toevoegen",
    categoryName: "Categorienaam",
    pickIcon: "Icoon",
    brandExists: "Er bestaat al een restaurant met deze naam.",
    categoryExists: "Deze categorie bestaat al.",
    brandHasProducts: "Dit restaurant heeft nog producten - verwijder of verplaats ze eerst.",
    categoryHasProducts: "Deze categorie heeft nog producten - verwijder of verplaats ze eerst.",
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
    customerInsightsSub: "Hoe elke klant bestelt - favorieten, uitgaven en activiteit.",
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
    sellAtRestaurants: "Verkocht bij deze restaurants",
    atLeastOneRestaurant: "Selecteer minstens \u00e9\u00e9n restaurant",
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
    onlineNow: "Nu online",
    signedInLabel: "ingelogd",
    guestsLabel: "gasten",
    bookedOn: "Geboekt",
    socialTitle: "Social media links",
    socialSub: "Voeg je profiellinks toe en zet de iconen aan die je in de footer van de website wilt tonen.",
    socialUrlPlaceholder: "https://…",
    socialVisible: "Zichtbaar",
    socialHidden: "Verborgen",
    socialSaved: "Opgeslagen",
    approve: "Goedkeuren",
    reject: "Afwijzen",
    noVipRequests: "Geen openstaande VIP-aanvragen.",
    vipCardApproved: "Goedgekeurd - VIP geactiveerd",
    vipCardRejected: "Afgewezen",
    reservationsTitle: "Tafelreserveringen",
    reservationsSub: "Bevestig, wijs af of annuleer reserveringen van gasten.",
    noReservationsAdmin: "Geen reserveringen in deze weergave.",
    resConfirm: "Bevestigen",
    resDecline: "Afwijzen",
    resCancelAdmin: "Annuleren",
    resUpcoming: "Aankomend",
    resAll: "Alles",
  },
  fulfillment: {
    paymentTitle: "Betaling",
    paid: "Betaald",
    unpaid: "Niet betaald",
    paymentOpen: "Betaling gestart",
    paymentPending: "Betaling in behandeling",
    paymentFailed: "Betaling mislukt",
    paymentCanceled: "Betaling geannuleerd",
    paymentExpired: "Betaling verlopen",
    paymentReason: "Reden",
    molliePaymentId: "Mollie ID",
    markPaid: "Markeer als betaald",
    markUnpaid: "Markeer als niet betaald",
    showOrderDetails: "Details tonen",
    hideOrderDetails: "Details verbergen",
    deleteExpiredOrder: "Verlopen bestelling annuleren",
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
    invoiced: "Gefactureerd - betaal binnen 7 dagen",
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
    verifySuccessText: "Bedankt - je e-mailadres is nu geverifieerd.",
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
      "Authentieke Indiase keuken met klassieke tandoori-grills, rijke curry's en verse smaken - met passie bereid door onze familie, voor de uwe.",
    contact: "Contact",
    followUs: "Volg ons",
    rights: "Alle rechten voorbehouden.",
    address: "Adres",
    ourRestaurants: "Onze Restaurants",
    eatToGo: "Eat to go",
    theTandoor: "The Maison",
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
    closedNote: "Wij zijn momenteel gesloten. U kunt bestellen van dinsdag t/m zondag tussen 17:00 en 22:30 (maandag gesloten).",
    preOrderToday: "Wij zijn nu gesloten, maar u kunt uw bestelling al plaatsen - wij beginnen vandaag vanaf 17:00 met bereiden.",
    preOrderDay: "Wij zijn nu gesloten, maar u kunt uw bestelling al plaatsen - wij beginnen op {day} vanaf 17:00 met bereiden.",
    scheduleClosedNote: "Kies een bezorgmoment binnen onze openingstijden: dinsdag t/m zondag, 17:00–22:30 (maandag gesloten).",
  },
  cookies: {
    message:
      "Wij gebruiken alleen functionele cookies die noodzakelijk zijn voor het functioneren van de website (uw sessie, winkelwagen en voorkeuren). Wij gebruiken geen tracking- of advertentiecookies.",
    accept: "Accepteren",
    decline: "Alleen noodzakelijk",
    learnMore: "Meer informatie",
  },
  terminal: {
    title: "Keukenterminal",
    subtitle: "Live bestellingenoverzicht voor medewerkers - nieuwe bestellingen verschijnen automatisch en kunnen als bon worden geprint.",
    startShift: "Dienst starten",
    startShiftHint: "Tik om geluidsmeldingen in te schakelen en het scherm wakker te houden.",
    live: "Live - controleren op nieuwe bestellingen",
    autoPrint: "Nieuwe bestellingen automatisch printen",
    print: "Bon printen",
    noOrders: "Momenteel geen actieve bestellingen. Nieuwe bestellingen verschijnen hier automatisch.",
    activeOrders: "Actieve bestellingen",
    doneOrders: "Vandaag afgerond",
    newOrderAlert: "NIEUW",
    printerHelp: "Printen gebruikt de RawBT-app (ingesteld op de ingebouwde printer). Print er niets? Installeer RawBT via de Play Store en open de app één keer.",
    accessDenied: "Log in met een medewerkers- (admin-)account om de terminal te gebruiken.",
    lastUpdate: "Bijgewerkt",
  },
};

export const translations: Record<Lang, Dictionary> = { en, nl };
