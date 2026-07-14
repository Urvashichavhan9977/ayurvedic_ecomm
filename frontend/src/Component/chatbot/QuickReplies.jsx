export default function QuickReplies({ chips, onSelect, disabled }) {
  if (!chips?.length) return null

  return (
    <div className="chatbot-quick-replies">
      {chips.map((chip) => (
        <button
          key={chip}
          className="chatbot-quick-replies__chip"
          onClick={() => onSelect(chip)}
          disabled={disabled}
        >
          {chip}
        </button>
      ))}
    </div>
  )
}
