import { apiGet, apiPost } from './client'

// Maps to backend/src/routes/chatbotRoutes.js
export const chatbotApi = {
  // GET /chatbot/products?search=...
  getProducts: (search) =>
    apiGet(`/chatbot/products${search ? `?search=${encodeURIComponent(search)}` : ''}`),

  // GET /chatbot/recommend?problem=hairfall
  recommend: (problem) => apiGet(`/chatbot/recommend?problem=${encodeURIComponent(problem)}`),

  // POST /chatbot/chat -> { reply, concern, products, disclaimer }
  chat: (message, sessionId) => apiPost('/chatbot/chat', { message, sessionId }),
}
