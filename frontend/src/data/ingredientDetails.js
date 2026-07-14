// Rich, per-herb content used on the Ingredient Detail page (/ingredients/:slug)
// and as the short card description on the Ingredients listing page.
// Keyed by the same `slug` used in data/products.js -> ingredients[]

export const ingredientDetails = {
  ashwagandha: {
    tagline: 'The Adaptogen for Stress & Stamina',
    description:
      'Ashwagandha is one of the most extensively used roots in Ayurveda, traditionally taken to help the body adapt to physical and mental stress. It is prized for restoring energy levels, supporting deep and restful sleep, and helping maintain a calm, balanced mood through demanding days.',
    benefits: [
      'Helps the body manage everyday stress and anxiety',
      'Supports natural energy and stamina',
      'Promotes deeper, more restful sleep',
      'Supports healthy testosterone levels and muscle strength',
      'Traditionally used to sharpen focus and mental clarity',
    ],
    usage: 'Typically taken as 1–2 capsules or 1 tsp of powder daily, preferably with warm milk or water at night.',
  },
  giloy: {
    tagline: 'The Root of Immunity',
    description:
      'Known in Ayurveda as "Amrita" — the root of immortality — Giloy is a climbing vine used for centuries to strengthen the body\'s natural defenses. It is traditionally reached for during seasonal fevers and is valued for its cleansing, detoxifying action on the system.',
    benefits: [
      'Strengthens natural immunity',
      'Traditionally used to manage recurring fevers',
      'Supports the body\'s natural detox process',
      'Helps maintain healthy digestion',
      'Supports joint comfort and mobility',
    ],
    usage: 'Best taken as a kadha (decoction), juice, or capsule form, once or twice daily, preferably on an empty stomach.',
  },
  amla: {
    tagline: 'Nature\'s Richest Source of Vitamin C',
    description:
      'Amla, or Indian gooseberry, is one of Ayurveda\'s most celebrated superfoods — naturally rich in Vitamin C and antioxidants. It has long been used to strengthen hair from root to tip, support smooth digestion, and bring a natural brightness to the skin.',
    benefits: [
      'Naturally rich in Vitamin C and antioxidants',
      'Strengthens hair and helps reduce hair fall',
      'Supports healthy digestion and gut health',
      'Helps brighten and nourish the skin',
      'Supports overall immunity',
    ],
    usage: 'Enjoy as fresh juice, dried candy, or powder — 1 tbsp of juice or powder daily is a common ritual.',
  },
  turmeric: {
    tagline: 'The Golden Spice of Wellness',
    description:
      'Turmeric has been a kitchen and medicine cabinet staple across India for thousands of years. Its active compound, curcumin, is behind its well-known anti-inflammatory and antioxidant properties — making it a daily go-to for joint comfort, skin clarity, and immunity.',
    benefits: [
      'Powerful anti-inflammatory properties',
      'Supports joint comfort and flexibility',
      'Helps maintain clear, healthy-looking skin',
      'Supports daily immunity',
      'Rich in antioxidants that fight free radicals',
    ],
    usage: 'Add to warm milk (golden milk), food, or take as a standardised capsule — usually once daily with a pinch of black pepper for better absorption.',
  },
  neem: {
    tagline: 'The Purifying Leaf',
    description:
      'Neem is a bitter but deeply respected leaf in Ayurvedic tradition, known for its purifying and antifungal properties. It has long been used to clear skin concerns, balance the blood, and support the body\'s natural cleansing processes.',
    benefits: [
      'Helps clear skin blemishes and acne',
      'Natural antifungal and antibacterial properties',
      'Supports blood purification',
      'Helps maintain a healthy scalp',
      'Supports the body\'s natural detoxification',
    ],
    usage: 'Available as capsules, oil, or powder. Typically 1–2 capsules daily, or applied topically for skin concerns.',
  },
  tulsi: {
    tagline: 'Holy Basil for Mind & Breath',
    description:
      'Tulsi, or Holy Basil, is considered sacred in Indian households and is one of Ayurveda\'s most trusted adaptogens. Its aromatic leaves are traditionally brewed into teas to support respiratory health, ease everyday stress, and gently uplift the mind.',
    benefits: [
      'Supports respiratory health and easy breathing',
      'Helps the body adapt to daily stress',
      'Uplifts mood and mental clarity',
      'Supports natural immunity',
      'Traditionally used to soothe coughs and colds',
    ],
    usage: 'Best enjoyed as a warm herbal tea 1–2 times a day, or taken as capsules/drops as directed.',
  },
  brahmi: {
    tagline: 'The Memory Herb',
    description:
      'Brahmi is a small, water-loving herb long valued in Ayurveda for its ability to support memory, focus, and a calm nervous system. It is also a classic ingredient in hair oils, traditionally used to nourish the scalp and support healthy hair growth.',
    benefits: [
      'Traditionally used to support memory and focus',
      'Calms and supports the nervous system',
      'Nourishes the scalp and supports hair growth',
      'Helps ease occasional anxiety',
      'Supports healthy cognitive function with age',
    ],
    usage: 'Take as capsules or powder daily, or massage Brahmi-infused oil into the scalp 2–3 times a week.',
  },
  shatavari: {
    tagline: 'The Root for Women\'s Wellness',
    description:
      'Shatavari, meaning "she who possesses a hundred roots," is one of Ayurveda\'s most revered herbs for women\'s health. Traditionally used across every stage of life, it supports hormonal balance, reproductive wellness, and healthy lactation for new mothers.',
    benefits: [
      'Supports hormonal balance through every life stage',
      'Traditionally used to support healthy lactation',
      'Supports reproductive and menstrual wellness',
      'Acts as a general adaptogen for stress',
      'Supports digestive comfort',
    ],
    usage: 'Typically taken as 1–2 tsp of powder with warm milk, or as capsules, once or twice daily.',
  },
}

export const defaultIngredientDetail = {
  tagline: 'A Time-Honoured Ayurvedic Herb',
  description:
    'A time-honoured Ayurvedic herb used across our handcrafted formulations, chosen for its purity, potency and traditional healing significance.',
  benefits: [
    'Sourced from certified organic farms',
    'Used in traditional Ayurvedic formulations for generations',
    'Lab-tested for purity and potency',
  ],
  usage: 'Refer to the specific product\'s label for recommended usage and dosage.',
}