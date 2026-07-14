const Product = require('../models/Product');
const Concern = require('../models/Concern');
const ChatHistory = require('../models/ChatHistory');
const asyncHandler = require('../utils/asyncHandler');

const DISCLAIMER =
  'Note: Ye general Ayurvedic wellness suggestions hain aapki query ke basis par. Ye medical diagnosis nahi hain aur professional healthcare ka substitute nahi hain. Kripya serious ya persistent symptoms ke liye kisi qualified healthcare professional se consult karein.';

// Same storefront-visibility rule used in productController.js: a product
// counts as visible if isActive/approvalStatus are explicitly set right,
// OR if the fields are simply missing (older admin products created before
// the multi-vendor upgrade never had approvalStatus written to them).
// Keeping this identical here means the chatbot recommends admin AND
// vendor products exactly like the storefront does — never out of sync.
const VISIBLE_FILTER = {
  $and: [
    { $or: [{ isActive: true }, { isActive: { $exists: false } }] },
    { $or: [{ approvalStatus: 'approved' }, { approvalStatus: { $exists: false } }] },
  ],
};

// ─── Concern knowledge base ───────────────────────────────────────────
// Each entry maps real user phrasing (Hindi / English / Hinglish) to:
//  - concernNames: possible Concern.name values in MongoDB (admin-managed,
//    see backend/src/models/Concern.js) — checked FIRST so admin edits
//    to concerns/products always win.
//  - fallbackWords: used for a direct Product text search if no matching
//    Concern doc (or no active products under it) is found.
// This keeps recommendations grounded in real store data — nothing here
// is a hardcoded product name, only search hints.
const CONCERN_LIBRARY = [
  {
    key: 'hairfall',
    label: 'Hair Fall',
    concernNames: ['hair fall', 'hair loss', 'hairfall'],
    keywords: [
      'hair fall', 'hairfall', 'hair loss', 'baal jhad', 'baal jhadna', 'jhad rahe',
      'baal gir', 'balo ka jhadna', 'hair thinning', 'baldness', 'ganjapan', 'balo',
    ],
    fallbackWords: ['hair', 'bhringraj', 'amla'],
    reply: 'Hair fall ke kai reasons ho sakte hain jaise stress, nutrition ki kami ya scalp issues. Based on your concern, ye Ayurvedic products help kar sakte hain:',
  },
  {
    key: 'immunity',
    label: 'Immunity',
    concernNames: ['immunity', 'immune support'],
    keywords: ['immunity', 'immune', 'rog pratirodhak', 'ROG', 'seasonal cold', 'baar baar bimar'],
    fallbackWords: ['immunity', 'giloy', 'tulsi', 'chyawanprash'],
    reply: 'Strong immunity ke liye ye Ayurvedic products popular hain:',
  },
  {
    key: 'weightloss',
    label: 'Weight Loss',
    concernNames: ['weight loss', 'weight management'],
    keywords: ['weight loss', 'vajan kam', 'motapa', 'fat loss', 'slim', 'weight kam karna'],
    fallbackWords: ['detox', 'weight', 'metabolism'],
    reply: 'Weight management ke liye lifestyle aur diet ke saath ye Ayurvedic products try kar sakte hain:',
  },
  {
    key: 'digestion',
    label: 'Digestion',
    concernNames: ['digestion', 'digestive health'],
    keywords: ['digestion', 'pachan', 'indigestion', 'weak digestion', 'digestion weak', 'gas'],
    fallbackWords: ['digestion', 'digestive', 'detox'],
    reply: 'Digestion ko naturally strong banane ke liye ye products madad kar sakte hain:',
  },
  {
    key: 'acidity',
    label: 'Acidity',
    concernNames: ['acidity', 'acid reflux'],
    keywords: ['acidity', 'acid', 'jalan', 'khatti dakar', 'heartburn', 'acidity hai'],
    fallbackWords: ['acidity', 'digestive', 'cooling'],
    reply: 'Acidity ke liye ye Ayurvedic digestive products kaafi helpful maane jaate hain:',
  },
  {
    key: 'skin',
    label: 'Skin Problems',
    concernNames: ['skin', 'skin care', 'skin problems'],
    keywords: ['skin', 'twacha', 'chehra', 'face glow', 'pimple', 'acne', 'dull skin', 'skin dull', 'oily skin'],
    fallbackWords: ['skin', 'face', 'glow'],
    reply: 'Skin ki natural glow aur health ke liye ye products try kiye ja sakte hain:',
  },
  {
    key: 'stress',
    label: 'Stress',
    concernNames: ['stress', 'stress relief', 'mental wellness'],
    keywords: ['stress', 'tension', 'tanav', 'pareshan', 'anxious', 'anxiety'],
    fallbackWords: ['ashwagandha', 'shilajit', 'stress'],
    reply: 'Stress manage karne ke liye ye Ayurvedic products calming maane jaate hain:',
  },
  {
    key: 'sleep',
    label: 'Sleep Issues',
    concernNames: ['sleep', 'sleep issues', 'insomnia'],
    keywords: ['sleep', 'neend', 'insomnia', 'so nahi pata', 'neend nahi', 'sound sleep'],
    fallbackWords: ['sleep', 'golden milk', 'ashwagandha'],
    reply: 'Better neend ke liye ye Ayurvedic products try kiye ja sakte hain:',
  },
  {
    key: 'jointpain',
    label: 'Joint Pain',
    concernNames: ['joint pain', 'joint health'],
    keywords: ['joint pain', 'ghutno me dard', 'jodo me dard', 'arthritis', 'knee pain', 'joint'],
    fallbackWords: ['joint', 'pain relief', 'oil'],
    reply: 'Joint pain me rahat ke liye ye Ayurvedic products dekh sakte hain:',
  },
  {
    key: 'diabetes',
    label: 'Diabetes Support',
    concernNames: ['diabetes', 'diabetes support', 'sugar control'],
    keywords: ['diabetes', 'sugar', 'blood sugar', 'sugar control'],
    fallbackWords: ['sugar', 'diabetes', 'blood sugar'],
    reply: 'Sugar levels ko naturally support karne ke liye ye Ayurvedic products dekhe ja sakte hain:',
  },
  {
    key: 'weakness',
    label: 'Weakness',
    concernNames: ['weakness', 'energy', 'vitality'],
    keywords: ['weakness', 'kamzori', 'energy kam', 'thakan', 'fatigue'],
    fallbackWords: ['shilajit', 'dry fruits', 'energy'],
    reply: 'Energy aur vitality ke liye ye Ayurvedic products popular hain:',
  },
];

const PRODUCT_SELECT = 'name slug images price oldPrice shortDescription ratingsAverage ratingsQuantity';

function normalize(text = '') {
  return text.toLowerCase().trim();
}

// Scores every concern by how many of its keywords appear in the message
// and returns the best match (or null if nothing scores).
function detectConcern(message) {
  const text = normalize(message);
  if (!text) return null;

  let best = null;
  let bestScore = 0;

  for (const concern of CONCERN_LIBRARY) {
    let score = 0;
    for (const kw of concern.keywords) {
      if (text.includes(kw)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = concern;
    }
  }

  return best;
}

// Tries the admin-managed Concern collection first (real store data),
// then falls back to a direct Product text search using hint words.
async function getProductsForConcern(concernLib) {
  if (!concernLib) return [];

  const nameRegex = new RegExp(concernLib.concernNames.join('|'), 'i');
  const concernDoc = await Concern.findOne({ name: nameRegex, isActive: true }).populate({
    path: 'products',
    match: VISIBLE_FILTER,
    select: PRODUCT_SELECT,
  });

  if (concernDoc && concernDoc.products?.length) {
    return concernDoc.products.slice(0, 4);
  }

  const wordRegex = new RegExp(concernLib.fallbackWords.join('|'), 'i');
  const products = await Product.find({
    ...VISIBLE_FILTER,
    $or: [
      { name: wordRegex },
      { shortDescription: wordRegex },
      { description: wordRegex },
      { benefits: { $in: [wordRegex] } },
      { ingredients: { $in: [wordRegex] } },
    ],
  })
    .select(PRODUCT_SELECT)
    .limit(4);

  return products;
}

/**
 * @desc    List active, store-approved products for the chatbot to browse
 * @route   GET /api/v1/chatbot/products
 * @access  Public
 * Query params: search (optional free-text)
 */
const getProducts = asyncHandler(async (req, res) => {
  const filter = { ...VISIBLE_FILTER };

  if (req.query.search) {
    const regex = new RegExp(req.query.search, 'i');
    filter.$or = [{ name: regex }, { shortDescription: regex }, { description: regex }];
  }

  const products = await Product.find(filter).select(PRODUCT_SELECT).limit(50);

  res.status(200).json({ success: true, count: products.length, products });
});

/**
 * @desc    Recommend products for a given wellness concern/problem
 * @route   GET /api/v1/chatbot/recommend?problem=hairfall
 * @access  Public
 */
const recommend = asyncHandler(async (req, res) => {
  const problem = req.query.problem;

  if (!problem) {
    return res.status(400).json({ success: false, message: 'problem query param is required' });
  }

  const concernLib = detectConcern(problem);

  if (!concernLib) {
    return res.status(200).json({
      success: true,
      concern: null,
      products: [],
      message: "Is problem ke liye koi direct match nahi mila. Please try: hairfall, immunity, weightloss, digestion, acidity, skin, stress, sleep, jointpain, diabetes.",
    });
  }

  const products = await getProductsForConcern(concernLib);

  res.status(200).json({
    success: true,
    concern: concernLib.label,
    products,
    disclaimer: DISCLAIMER,
  });
});

/**
 * @desc    Main chatbot conversation endpoint — detects intent from a
 *          free-text Hindi/English/Hinglish message and returns a reply
 *          plus matching product recommendations.
 * @route   POST /api/v1/chatbot/chat
 * @access  Public
 * Body: { message: string, sessionId?: string }
 */
const chat = asyncHandler(async (req, res) => {
  const { message, sessionId } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: 'message is required' });
  }

  const concernLib = detectConcern(message);
  let reply;
  let products = [];
  let concernLabel = null;
  let showDisclaimer = false;

  if (concernLib) {
    products = await getProductsForConcern(concernLib);
    concernLabel = concernLib.label;
    showDisclaimer = true;

    reply = products.length
      ? concernLib.reply
      : `${concernLib.label} ke liye abhi store mein matching products available nahi hain. Please humari full range "${'/shop'}" par dekhein ya humse contact karein.`;
  } else {
    reply =
      "Samajh nahi paaya aapki concern kya hai 🙂 Aap apni health concern ya wellness goal bata sakte hain — jaise Hair Fall, Weight Loss, Immunity, Digestion, Skin, Stress, Sleep ya Joint Pain. Main aapko store ke Ayurvedic products recommend kar dunga.";
  }

  // Best-effort conversation logging — never blocks or breaks the chat.
  if (sessionId) {
    ChatHistory.findOneAndUpdate(
      { sessionId },
      {
        $push: {
          messages: {
            $each: [
              { role: 'user', text: message },
              { role: 'bot', text: reply, matchedConcern: concernLabel || '' },
            ],
          },
        },
      },
      { upsert: true }
    ).catch(() => {});
  }

  res.status(200).json({
    success: true,
    reply,
    concern: concernLabel,
    products,
    disclaimer: showDisclaimer ? DISCLAIMER : null,
  });
});

module.exports = { getProducts, recommend, chat };
