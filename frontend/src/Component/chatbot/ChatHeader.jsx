import { Bot, Minus, Sparkles, Trash2, X } from 'lucide-react'

export default function ChatHeader({ isMinimized, onMinimize, onClear, onClose }) {
  return (
    <div className="chatbot-header">
      <div className="chatbot-header__identity">
        <div className="chatbot-header__avatar">
          <Bot size={20} />
          <span className="chatbot-header__avatar__sparkle">
            <Sparkles size={9} />
          </span>
        </div>
        <div>
          <div className="chatbot-header__title">Ayurveda AI Expert</div>
          <div className="chatbot-header__subtitle">
            <span className="chatbot-header__dot" />
            Online · Natural Wellness Assistant
          </div>
        </div>
      </div>
      <div className="chatbot-header__actions">
        <button aria-label="Clear chat" onClick={onClear} title="Clear chat">
          <Trash2 size={16} />
        </button>
        <button aria-label={isMinimized ? 'Expand chat' : 'Minimize chat'} onClick={onMinimize} title="Minimize">
          <Minus size={16} />
        </button>
        <button aria-label="Close chat" onClick={onClose} title="Close">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}