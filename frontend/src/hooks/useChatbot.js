import { useCallback, useRef, useState } from 'react'
import { chatbotApi } from '../api/chatbotApi'

export const QUICK_REPLY_CHIPS = [
  'Hair Fall',
  'Weight Loss',
  'Diabetes Support',
  'Immunity',
  'Digestion',
  'Acidity',
  'Joint Pain',
  'Skin Problems',
  'Stress',
  'Sleep Issues',
]

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'bot',
  text:
    "Hello 👋 Welcome to Amrita Ayurveda.\n\nMain aapka AI Ayurveda Assistant hoon. Apni health concern ya wellness goal batayein, main store se suitable Ayurvedic products recommend kar dunga.\n\nHow can I help you today?",
  products: [],
  timestamp: Date.now(),
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function makeSessionId() {
  try {
    return crypto.randomUUID()
  } catch {
    return makeId()
  }
}

export function useChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState([WELCOME_MESSAGE])
  const [isTyping, setIsTyping] = useState(false)
  const sessionIdRef = useRef(makeSessionId())

  const open = useCallback(() => {
    setIsOpen(true)
    setIsMinimized(false)
  }, [])

  const close = useCallback(() => setIsOpen(false), [])

  const toggleMinimize = useCallback(() => setIsMinimized((prev) => !prev), [])

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      if (prev) return false
      setIsMinimized(false)
      return true
    })
  }, [])

  const clearChat = useCallback(() => {
    setMessages([WELCOME_MESSAGE])
  }, [])

  const sendMessage = useCallback(async (rawText) => {
    const text = rawText.trim()
    if (!text) return

    const userMessage = { id: makeId(), role: 'user', text, timestamp: Date.now() }
    setMessages((prev) => [...prev, userMessage])
    setIsTyping(true)

    try {
      const res = await chatbotApi.chat(text, sessionIdRef.current)

      // Small artificial delay so the typing indicator feels natural
      // instead of the reply flashing in instantly.
      await new Promise((r) => setTimeout(r, 500))

      const botMessage = {
        id: makeId(),
        role: 'bot',
        text: res.reply,
        products: res.products || [],
        concern: res.concern || null,
        disclaimer: res.disclaimer || null,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, botMessage])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: 'bot',
          text: 'Kuch technical issue aa gaya hai 🙏 Thodi der baad please try karein.',
          products: [],
          timestamp: Date.now(),
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }, [])

  return {
    isOpen,
    isMinimized,
    messages,
    isTyping,
    open,
    close,
    toggle,
    toggleMinimize,
    clearChat,
    sendMessage,
  }
}
