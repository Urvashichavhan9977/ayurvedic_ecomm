import { useState } from 'react'

// A small, self-contained "AI Seller Assistant" for the Become a Seller
// page. It's rule-based (keyword matching over a knowledge base) rather
// than calling an external AI API — so it works instantly, offline, and
// with zero extra backend/API-key setup, while still giving new sellers
// immediate answers to the questions they ask most before signing up.
const KNOWLEDGE_BASE = [
  {
    keywords: ['document', 'documents', 'kagaz', 'proof', 'id proof', 'kyc'],
    question: 'Documents kya chahiye?',
    answer:
      'Seller banne ke liye aapko apna naam, email, phone aur shop ka naam dena hota hai. GST number optional hai — agar aapke paas hai to add kar sakte hain, warna baad me bhi add kar sakte hain.',
  },
  {
    keywords: ['commission', 'charge', 'fee', 'kitna', 'percent', '%', 'paisa', 'payment milega'],
    question: 'Commission / payment kaise milta hai?',
    answer:
      'Har sale par aapko aapka commission share (default 5%) milta hai. Jab customer ka order "Delivered" mark hota hai, aapka share automatically aapke Vendor Wallet me credit ho jata hai — Vendor Dashboard ke "Earnings" section me dikh jayega.',
  },
  {
    keywords: ['approve', 'approval', 'review', 'kitna time', 'kab tak', 'live kab'],
    question: 'Approval me kitna time lagta hai?',
    answer:
      'Registration ke baad aapka application admin team review karti hai. Approve hote hi aap products add kar sakte hain — har naya product bhi ek baar admin approval ke baad hi store par live hota hai.',
  },
  {
    keywords: ['product', 'add product', 'listing', 'kaise dalu', 'upload'],
    question: 'Product kaise add karein?',
    answer:
      'Approve hone ke baad Vendor Dashboard → "Manage Products" me jaake naya product add kar sakte hain — naam, price, images, stock aur category daalni hoti hai. Submit karte hi ye admin review ke liye chala jata hai.',
  },
  {
    keywords: ['order', 'tracking', 'track', 'shipping', 'deliver'],
    question: 'Orders/tracking kaise dekhu?',
    answer:
      'Vendor Dashboard → "Orders" me sirf aapke products wale orders dikhte hain. Wahi se aap status update kar sakte hain (Confirmed → Shipped → Delivered) — customer ko bhi apni Track Order page par ye same status dikhta hai.',
  },
  {
    keywords: ['bank', 'account', 'withdraw', 'paisa kaise', 'wallet'],
    question: 'Paisa withdraw kaise hoga?',
    answer:
      'Aapka earning wallet balance me jama hota rehta hai. Withdrawal / bank details Vendor Profile me update kar sakte hain — is baare me hamari support team se bhi confirm kar sakte hain.',
  },
]

const SUGGESTED = KNOWLEDGE_BASE.slice(0, 4).map((k) => k.question)

function findAnswer(text) {
  const lower = text.toLowerCase()
  const match = KNOWLEDGE_BASE.find((entry) => entry.keywords.some((kw) => lower.includes(kw)))
  if (match) return match.answer
  return "Ye specific sawaal ke liye humari support team se contact karein — support@amritaayurveda.com ya niche diye gaye common sawaal try karein."
}

export default function SellerAIHelper() {
  const [open, setOpen] = useState(true)
  const [messages, setMessages] = useState([
    {
      from: 'bot',
      text: 'Namaste! Main aapka Seller Assistant hoon. Seller banne se related koi bhi sawaal poochein — jaise commission, documents, ya approval time.',
    },
  ])
  const [input, setInput] = useState('')

  const ask = (text) => {
    if (!text.trim()) return
    const answer = findAnswer(text)
    setMessages((m) => [...m, { from: 'user', text }, { from: 'bot', text: answer }])
    setInput('')
  }

  return (
    <div className="vnd-auth-card" style={{ maxWidth: 360, alignSelf: 'flex-start' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem' }}>🤖 Seller AI Assistant</h3>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.85rem', color: 'var(--vnd-primary, #1f8a4c)' }}
        >
          {open ? 'Hide' : 'Show'}
        </button>
      </div>

      {open && (
        <>
          <p style={{ fontSize: '.8rem', color: '#777', marginTop: 0 }}>
            Become a seller se related sawaal poochein — turant jawab milega.
          </p>

          <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '.5rem', marginBottom: '.75rem' }}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.from === 'bot' ? 'flex-start' : 'flex-end',
                  background: m.from === 'bot' ? '#f1f7f3' : '#e8f3ff',
                  padding: '.5rem .75rem',
                  borderRadius: 10,
                  fontSize: '.85rem',
                  maxWidth: '90%',
                }}
              >
                {m.text}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem', marginBottom: '.6rem' }}>
            {SUGGESTED.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => ask(q)}
                style={{
                  fontSize: '.72rem',
                  border: '1px solid #ddd',
                  background: '#fff',
                  borderRadius: 999,
                  padding: '.3rem .6rem',
                  cursor: 'pointer',
                }}
              >
                {q}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              ask(input)
            }}
            style={{ display: 'flex', gap: '.4rem' }}
          >
            <input
              className="vnd-input"
              placeholder="Apna sawaal likhein…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className="vnd-btn vnd-btn-primary" style={{ width: 'auto' }}>
              Ask
            </button>
          </form>
        </>
      )}
    </div>
  )
}
