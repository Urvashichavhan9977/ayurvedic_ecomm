import { useState } from 'react'
import { Send } from 'lucide-react'
import VoiceInput from './VoiceInput.jsx'

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState('')

  const submit = () => {
    if (!value.trim() || disabled) return
    onSend(value)
    setValue('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="chatbot-input-bar">
      <VoiceInput onResult={(text) => setValue((prev) => (prev ? `${prev} ${text}` : text))} />
      <input
        className="chatbot-input-bar__field"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Apni health concern likhein... e.g. Mujhe acidity hai"
        disabled={disabled}
      />
      <button
        className="chatbot-input-bar__send"
        onClick={submit}
        disabled={disabled || !value.trim()}
        aria-label="Send message"
      >
        <Send size={18} />
      </button>
    </div>
  )
}
