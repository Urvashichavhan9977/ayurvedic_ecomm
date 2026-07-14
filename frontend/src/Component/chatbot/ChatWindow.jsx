import { useEffect, useRef } from 'react'
import ChatHeader from './ChatHeader.jsx'
import ChatMessage from './ChatMessage.jsx'
import TypingIndicator from './TypingIndicator.jsx'
import QuickReplies from './QuickReplies.jsx'
import ChatInput from './ChatInput.jsx'
import { QUICK_REPLY_CHIPS } from '../../hooks/useChatbot.js'

export default function ChatWindow({
  isMinimized,
  messages,
  isTyping,
  onSend,
  onMinimize,
  onClear,
  onClose,
}) {
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isTyping, isMinimized])

  return (
    <div className={`chatbot-window ${isMinimized ? 'chatbot-window--minimized' : ''}`}>
      <ChatHeader isMinimized={isMinimized} onMinimize={onMinimize} onClear={onClear} onClose={onClose} />

      {!isMinimized && (
        <>
          <div className="chatbot-window__body" ref={scrollRef}>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isTyping && <TypingIndicator />}
          </div>

          <QuickReplies chips={QUICK_REPLY_CHIPS} onSelect={onSend} disabled={isTyping} />
          <ChatInput onSend={onSend} disabled={isTyping} />
        </>
      )}
    </div>
  )
}
