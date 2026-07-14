import ChatButton from './ChatButton.jsx'
import ChatWindow from './ChatWindow.jsx'
import { useChatbot } from '../../hooks/useChatbot.js'
import '../../styles/Chatbot.css'

// Single drop-in entry point — mounted once in CustomerApp.jsx (right next
// to <Footer />) so the floating AI button + chat window appear on every
// storefront page, including the home page hero/slider section, and stay
// open while navigating between pages.
export default function AyurvedaChatbot() {
  const {
    isOpen,
    isMinimized,
    messages,
    isTyping,
    toggle,
    close,
    toggleMinimize,
    clearChat,
    sendMessage,
  } = useChatbot()

  return (
    <div className="chatbot-root">
      {isOpen && (
        <ChatWindow
          isMinimized={isMinimized}
          messages={messages}
          isTyping={isTyping}
          onSend={sendMessage}
          onMinimize={toggleMinimize}
          onClear={clearChat}
          onClose={close}
        />
      )}
      <ChatButton isOpen={isOpen} onClick={toggle} />
    </div>
  )
}
