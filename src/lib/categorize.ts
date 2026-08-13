// Auto-categorization for kid purchases. Keyword rules run against the
// merchant/description text; first hit wins, "Other" is the fallback.

export const CATEGORIES = [
  "Food & Drink",
  "Groceries",
  "Rides & Transport",
  "Shopping",
  "Entertainment",
  "Subscriptions",
  "Health & Beauty",
  "Gas & Car",
  "Travel",
  "Education",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_EMOJI: Record<Category, string> = {
  "Food & Drink": "🍔",
  Groceries: "🛒",
  "Rides & Transport": "🚗",
  Shopping: "🛍️",
  Entertainment: "🎬",
  Subscriptions: "🔁",
  "Health & Beauty": "💊",
  "Gas & Car": "⛽",
  Travel: "✈️",
  Education: "📚",
  Other: "❓",
};

// Order matters: earlier rules win. Groceries before Food so "Whole Foods"
// isn't caught by "food"; Food before Rides so "Uber Eats" isn't caught by
// "uber". Keywords with spaces around them avoid substring traps (e.g.
// "sephora" contains "pho") — the matched text is padded with spaces.
const RULES: [Category, string[]][] = [
  [
    "Groceries",
    ["whole foods", "trader joe", "kroger", "safeway", "publix", "wegmans",
     "aldi", "heb ", "h-e-b", "albertsons", "vons", "ralphs", "giant",
     "stop & shop", "stop and shop", "food lion", "meijer", "grocery",
     "market", "instacart", "fresh direct", "freshdirect", "sprouts", "harris teeter"],
  ],
  [
    "Food & Drink",
    ["mcdonald", "chipotle", "starbucks", "dunkin", "chick-fil-a", "chick fil a",
     "shake shack", "sweetgreen", "cava", "panera", "subway sandwich", "wendy",
     "burger", "taco", "pizza", "domino", "papa john", "kfc", "popeyes",
     "five guys", "in-n-out", "in n out", "raising cane", "wingstop", "sonic",
     "jamba", "smoothie", "boba", "bubble tea", "kung fu tea", "dutch bros",
     "doordash", "uber eats", "ubereats", "grubhub", "postmates", "seamless",
     "restaurant", "cafe", "coffee", "deli", "diner", "grill", "sushi", "ramen",
     "poke", "bakery", "donut", "ice cream", "gelato", "acai", "juice",
     "pret a manger", "panda express", "qdoba", "moe's", "jersey mike",
     "jimmy john", "firehouse", "zaxby", "bojangles", "culver", "whataburger",
     "steak", "bbq", "noodle", " pho ", "thai", "halal", "kebab", "food"],
  ],
  [
    "Rides & Transport",
    ["uber", "lyft", "waymo", "taxi", " cab ", "metro", "mta", "subway ride",
     "bart", "caltrain", "amtrak", "bird", "lime", "scooter", "parking",
     "spothero", "revel", "citibike", "citi bike", "transit"],
  ],
  [
    "Subscriptions",
    ["netflix", "spotify", "hulu", "disney+", "disney plus", "hbo", "max.com",
     "apple.com/bill", "apple music", "icloud", "youtube premium", "paramount",
     "peacock", "audible", "kindle unlimited", "crunchyroll", "twitch",
     "patreon", "onlyfans", "chatgpt", "openai", "claude", "membership",
     "subscription", "prime video", "amazon prime", "playstation plus",
     "xbox game pass", "nintendo online", "discord nitro"],
  ],
  [
    "Entertainment",
    ["amc", "regal", "cinemark", "cinema", "movie", "theater", "theatre",
     "ticketmaster", "stubhub", "seatgeek", "axs", "concert", "festival",
     "bowling", "arcade", "dave & buster", "dave and buster", "topgolf",
     "mini golf", "escape room", "museum", "zoo", "aquarium", "six flags",
     "disney world", "disneyland", "universal studios", "steam", "steampowered",
     "playstation store", "xbox", "nintendo", "epic games", "roblox",
     "fortnite", "riot games", "game"],
  ],
  [
    "Gas & Car",
    ["shell", "chevron", "exxon", "mobil", "bp ", "sunoco", "citgo", "marathon",
     "valero", " 76 ", " arco", "speedway", "wawa fuel", " gas", "fuel", "car wash",
     "carwash", "autozone", "jiffy lube", "oil change", "supercharger", "ev charge",
     "chargepoint", "electrify america"],
  ],
  [
    "Health & Beauty",
    ["cvs", "walgreens", "rite aid", "pharmacy", "sephora", "ulta", "bath & body",
     "bath and body", "salon", "barber", "haircut", "nails", " spa ", "gnc",
     "vitamin", "doctor", "dental", "dentist", "urgent care", "clinic", "gym",
     "planet fitness", "equinox", "crossfit", "yoga", "pilates"],
  ],
  [
    "Travel",
    ["airline", "airways", "delta", "united air", "american air", "jetblue",
     "southwest", "spirit air", "frontier air", "alaska air", "hotel", "motel",
     "airbnb", "vrbo", "marriott", "hilton", "hyatt", "expedia", "booking.com",
     "kayak", "tsa", "airport"],
  ],
  [
    "Education",
    ["tuition", "school", "university", "college", "textbook", "chegg",
     "quizlet", "coursera", "udemy", "khan", "tutor", "kaplan", "princeton review",
     "college board", "collegeboard", "act.org", "barnes & noble education"],
  ],
  [
    "Shopping",
    ["amazon", "amzn", "target", "walmart", "costco", "sam's club", "sams club",
     "best buy", "bestbuy", "apple store", "nike", "adidas", "foot locker",
     "footlocker", "lululemon", "zara", "h&m", "uniqlo", "urban outfitters",
     "american eagle", "abercrombie", "hollister", "brandy melville", "pacsun",
     "forever 21", "shein", "temu", "etsy", "ebay", "depop", "poshmark",
     "stockx", "goat", "grailed", "nordstrom", "macy", "bloomingdale", "dillard",
     "tj maxx", "tjmaxx", "marshalls", " ross ", "home depot", "lowe's", "lowes",
     "ikea", "dick's", "dicks sporting", "rei", "gap ", "old navy", "banana republic",
     "victoria's secret", "aerie", "clothing", "apparel", "shoes", " mall"],
  ],
];

export function categorize(text: string): Category {
  // Card processors decorate merchant names ("UBER *EATS", "SQ *CAFE") —
  // strip that punctuation so multi-word keywords still match.
  const t = ` ${text.toLowerCase().replace(/[*#_]+/g, " ").replace(/\s+/g, " ").trim()} `;
  for (const [category, keywords] of RULES) {
    for (const kw of keywords) {
      if (t.includes(kw)) return category;
    }
  }
  return "Other";
}

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}
