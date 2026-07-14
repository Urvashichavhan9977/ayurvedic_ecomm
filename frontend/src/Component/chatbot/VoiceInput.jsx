import { useRef, useState } from 'react'
import { Mic, MicOff } from 'lucide-react'

const SpeechRecognition =
  typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)

export default function VoiceInput({ onResult }) {
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef(null)

  // No browser support (e.g. Firefox) — hide the mic entirely rather
  // than showing a button that silently does nothing.
  if (!SpeechRecognition) return null

  const handleClick = () => {
    if (listening) {
      recognitionRef.current?.stop()
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'hi-IN'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      onResult(transcript)
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  return (
    <button
      type="button"
      className={`chatbot-input__mic ${listening ? 'chatbot-input__mic--active' : ''}`}
      onClick={handleClick}
      aria-label={listening ? 'Stop voice input' : 'Start voice input'}
      title="Voice input"
    >
      {listening ? <MicOff size={18} /> : <Mic size={18} />}
    </button>
  )
}
