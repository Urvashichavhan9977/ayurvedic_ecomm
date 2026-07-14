export default function TypingIndicator() {
  return (
    <div className="chatbot-message chatbot-message--bot">
      <div className="chatbot-message__bubble chatbot-typing">
        <span className="chatbot-typing__dot" />
        <span className="chatbot-typing__dot" />
        <span className="chatbot-typing__dot" />
      </div>
    </div>
  )
}
