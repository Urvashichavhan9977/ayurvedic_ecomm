const express = require('express');
const { getProducts, recommend, chat } = require('../controllers/chatbotController');

const router = express.Router();

// All public — the chatbot is a storefront-facing feature, no auth needed.
router.get('/products', getProducts);
router.get('/recommend', recommend);
router.post('/chat', chat);

module.exports = router;
