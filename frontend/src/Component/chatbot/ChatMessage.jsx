import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import ProductRecommendation from './ProductRecommendation.jsx'

function formatTime(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function ChatMessage({ message }) {
  const [copied, setCopied] = useState(false)
  const isBot = message.role === 'bot'

  const handleCopy = () => {
    navigator.clipboard?.writeText(message.text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className={`chatbot-message ${isBot ? 'chatbot-message--bot' : 'chatbot-message--user'}`}>
      <div className="chatbot-message__bubble">
        <p className="chatbot-message__text">{message.text}</p>

        {isBot && message.products?.length > 0 && (
          <ProductRecommendation products={message.products} />
        )}

        {isBot && message.disclaimer && (
          <p className="chatbot-message__disclaimer">{message.disclaimer}</p>
        )}

        <div className="chatbot-message__meta">
          <span>{formatTime(message.timestamp)}</span>
          {isBot && (
            <button className="chatbot-message__copy" onClick={handleCopy} aria-label="Copy message">
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
