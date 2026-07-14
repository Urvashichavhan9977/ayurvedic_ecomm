import { Sparkles, X } from 'lucide-react'

export default function ChatButton({ isOpen, onClick }) {
  return (
    <button
      className={`chatbot-fab ${isOpen ? 'chatbot-fab--open' : ''}`}
      onClick={onClick}
      aria-label={isOpen ? 'Close Ayurveda AI assistant' : 'Ask Ayurveda AI Expert'}
    >
      <span className="chatbot-fab__ring" />
      {isOpen ? <X size={26} /> : <Sparkles size={24} />}
      {!isOpen && <span className="chatbot-fab__tooltip">Ask Ayurveda AI 🌿</span>}
    </button>
  )
}
