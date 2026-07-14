import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import {
  Sparkles, Droplet, Flame, Moon, Smile, Target, Send, Bot,
  Calculator, Scale, Timer, Leaf, ChevronRight, X, CheckCircle2,
  Star, Quote, ArrowRight, Activity, Wind, Sun, Award,
} from 'lucide-react'
import '../styles/pages/WellnessHub.css'

/* ────────────────────────────────────────────────────────────
   SHARED HELPERS
──────────────────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

function Reveal({ children, className = '', once = true, ...props }) {
  return (
    <motion.div
      className={className}
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount: 0.2 }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/* ────────────────────────────────────────────────────────────
   SECTION 1 — PREMIUM HERO
──────────────────────────────────────────────────────────── */
const PHONE_SCREENS = [
  { title: "Today's Wellness", icon: Sparkles, value: '92', label: 'Wellness Score', accent: '#2E7D32' },
  { title: 'Water Intake', icon: Droplet, value: '2.1L', label: 'of 3L goal', accent: '#1E88E5' },
  { title: 'Healthy Diet', icon: Leaf, value: '4/4', label: 'meals logged', accent: '#43A047' },
  { title: 'Sleep Tracker', icon: Moon, value: '7h 40m', label: 'restful sleep', accent: '#6A5AE0' },
  { title: 'Immunity Boost', icon: Wind, value: '88%', label: 'immunity index', accent: '#D4AF37' },
  { title: 'Progress Tracker', icon: Target, value: '18/30', label: 'days on streak', accent: '#EF6C00' },
]

function FloatingLeaves() {
  const leaves = useMemo(
    () => Array.from({ length: 10 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 6,
      duration: 10 + Math.random() * 10,
      size: 18 + Math.random() * 22,
      rotate: Math.random() * 360,
    })),
    []
  )
  return (
    <div className="wh-leaves" aria-hidden="true">
      {leaves.map((l) => (
        <motion.span
          key={l.id}
          className="wh-leaf"
          style={{ left: `${l.left}%`, width: l.size, height: l.size }}
          initial={{ y: '110vh', opacity: 0, rotate: l.rotate }}
          animate={{ y: '-10vh', opacity: [0, 1, 1, 0], rotate: l.rotate + 180 }}
          transition={{ duration: l.duration, delay: l.delay, repeat: Infinity, ease: 'linear' }}
        >
          <Leaf size={l.size} />
        </motion.span>
      ))}
    </div>
  )
}

function HeroPhone() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % PHONE_SCREENS.length), 3000)
    return () => clearInterval(id)
  }, [])

  const screen = PHONE_SCREENS[index]
  const Icon = screen.icon

  return (
    <motion.div
      className="wh-phone-wrap"
      animate={{ y: [0, -16, 0] }}
      transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div className="wh-phone-glow" />
      <div className="wh-phone">
        <div className="wh-phone-notch" />
        <div className="wh-phone-screen">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              className="wh-phone-card"
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -40, scale: 0.96 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <div className="wh-phone-card-top">
                <span className="wh-phone-icon" style={{ background: `${screen.accent}22`, color: screen.accent }}>
                  <Icon size={20} />
                </span>
                <span className="wh-phone-dot" />
              </div>
              <p className="wh-phone-card-title">{screen.title}</p>
              <p className="wh-phone-card-value" style={{ color: screen.accent }}>{screen.value}</p>
              <p className="wh-phone-card-label">{screen.label}</p>
              <div className="wh-phone-bar">
                <motion.div
                  className="wh-phone-bar-fill"
                  style={{ background: screen.accent }}
                  initial={{ width: '0%' }}
                  animate={{ width: '78%' }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="wh-phone-dots">
            {PHONE_SCREENS.map((_, i) => (
              <span key={i} className={`wh-phone-dot-ind ${i === index ? 'active' : ''}`} />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function HeroSection() {
  return (
    <section className="wh-hero">
      <FloatingLeaves />
      <div className="wh-hero-glow wh-hero-glow-1" />
      <div className="wh-hero-glow wh-hero-glow-2" />

      <div className="wh-container wh-hero-grid">
        <motion.div
          className="wh-hero-copy"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <span className="wh-eyebrow"><Sparkles size={14} /> AI-Powered Ayurvedic Wellness</span>
          <h1>Your Personalized <span>Wellness Journey</span> Starts Here.</h1>
          <p>
            Discover AI-powered Ayurvedic wellness tools, personalized health insights,
            daily routines, and healthy lifestyle recommendations designed to improve
            your overall well-being.
          </p>
          <div className="wh-hero-actions">
            <a href="#wh-dashboard" className="wh-btn wh-btn-primary">
              Start Wellness Journey <ArrowRight size={16} />
            </a>
            <a href="#wh-features" className="wh-btn wh-btn-ghost">Explore Features</a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
        >
          <HeroPhone />
        </motion.div>
      </div>
    </section>
  )
}

/* ────────────────────────────────────────────────────────────
   SECTION 2 — TODAY'S WELLNESS DASHBOARD
──────────────────────────────────────────────────────────── */
const DASHBOARD_CARDS = [
  { id: 'score', title: 'Wellness Score', icon: Sparkles, value: '92', unit: '/100', accent: '#2E7D32',
    detail: 'Your wellness score blends sleep, hydration, movement, and mood into one number.',
    tips: ['Keep a consistent sleep schedule', 'Add 10 minutes of pranayama daily', 'Stay hydrated before noon'] },
  { id: 'water', title: 'Water Intake', icon: Droplet, value: '2.1', unit: 'L / 3L', accent: '#1E88E5',
    detail: 'You are 70% toward your daily hydration goal. Ayurveda recommends warm water through the day.',
    tips: ['Sip warm water every hour', 'Avoid ice-cold water with meals', 'Add a slice of lemon at sunrise'] },
  { id: 'calories', title: 'Calories', icon: Flame, value: '1,480', unit: 'kcal', accent: '#EF6C00',
    detail: 'Balanced intake for your activity level today, with room for a light evening snack.',
    tips: ['Favor warm, cooked meals', 'Eat your largest meal at midday', 'Avoid heavy food after 8 PM'] },
  { id: 'sleep', title: 'Sleep', icon: Moon, value: '7h 40m', unit: '', accent: '#6A5AE0',
    detail: 'Restful sleep window achieved. Consistency is key for Vata balance.',
    tips: ['Wind down 30 min before bed', 'Try warm milk with nutmeg', 'Keep screens away post 9:30 PM'] },
  { id: 'mood', title: 'Mood', icon: Smile, value: 'Balanced', unit: '', accent: '#D4AF37',
    detail: 'Your logged mood trend this week has been calm and steady.',
    tips: ['Practice 5-minute gratitude journaling', 'Short walk in sunlight', 'Try Brahmi for mental clarity'] },
  { id: 'goal', title: 'Daily Goal', icon: Target, value: '4', unit: '/6 tasks', accent: '#00897B',
    detail: 'You are close to completing today\u2019s wellness checklist — two tasks remain.',
    tips: ['Finish your evening walk', 'Log tonight\u2019s herbal tea', 'Set tomorrow\u2019s intention'] },
]

function DashboardSection() {
  const [active, setActive] = useState(null)

  return (
    <section id="wh-dashboard" className="wh-section">
      <div className="wh-container">
        <Reveal className="wh-section-head">
          <span className="wh-kicker">Live Overview</span>
          <h2>Today's Wellness Dashboard</h2>
          <p>A calm, real-time snapshot of your day — tap any card to see full recommendations.</p>
        </Reveal>

        <motion.div
          className="wh-dash-grid"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
        >
          {DASHBOARD_CARDS.map((card) => {
            const Icon = card.icon
            return (
              <motion.button
                key={card.id}
                type="button"
                className="wh-dash-card"
                variants={fadeUp}
                whileHover={{ y: -8, boxShadow: '0 20px 45px rgba(46,125,50,0.18)' }}
                onClick={() => setActive(card)}
              >
                <span className="wh-dash-icon" style={{ background: `${card.accent}1c`, color: card.accent }}>
                  <Icon size={22} />
                </span>
                <p className="wh-dash-title">{card.title}</p>
                <p className="wh-dash-value">
                  {card.value}<span>{card.unit}</span>
                </p>
                <span className="wh-dash-link">View details <ChevronRight size={14} /></span>
              </motion.button>
            )
          })}
        </motion.div>
      </div>

      <AnimatePresence>
        {active && (
          <Modal onClose={() => setActive(null)}>
            <span className="wh-modal-icon" style={{ background: `${active.accent}1c`, color: active.accent }}>
              <active.icon size={26} />
            </span>
            <h3>{active.title}</h3>
            <p className="wh-modal-value" style={{ color: active.accent }}>{active.value}{active.unit}</p>
            <p className="wh-modal-detail">{active.detail}</p>
            <div className="wh-modal-tips">
              <p className="wh-modal-tips-label">Recommendations</p>
              {active.tips.map((t) => (
                <div key={t} className="wh-modal-tip"><CheckCircle2 size={16} /> {t}</div>
              ))}
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </section>
  )
}

function Modal({ children, onClose, wide = false }) {
  return (
    <motion.div
      className="wh-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={`wh-modal ${wide ? 'wh-modal-wide' : ''}`}
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="wh-modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        {children}
      </motion.div>
    </motion.div>
  )
}

/* ────────────────────────────────────────────────────────────
   SECTION 3 — AI WELLNESS ASSISTANT
──────────────────────────────────────────────────────────── */
const AI_KNOWLEDGE = {
  'hair fall': {
    cause: 'Often linked to aggravated Pitta dosha, poor scalp circulation, or nutrient deficiency.',
    herbs: ['Bhringraj', 'Amla', 'Brahmi', 'Neem'],
    products: ['Herbal Hair Oil', 'Amla Hair Cleanser', 'Bhringraj Hair Mask'],
    morning: 'Warm oil scalp massage + 10 min meditation + protein-rich breakfast.',
    night: 'Comb gently, apply herbal oil 30 min before bed, sleep by 10 PM.',
    eat: ['Leafy greens', 'Amla', 'Nuts & seeds', 'Coconut water'],
    avoid: ['Fried food', 'Excess caffeine', 'Late-night eating'],
  },
  default: {
    cause: 'Usually related to a temporary dosha imbalance driven by diet, sleep, or stress.',
    herbs: ['Ashwagandha', 'Tulsi', 'Turmeric', 'Triphala'],
    products: ['Wellness Herbal Tea', 'Immunity Booster Capsules', 'Daily Detox Powder'],
    morning: 'Warm water with lemon + light stretching + a wholesome breakfast.',
    night: 'Herbal tea, light dinner before 8 PM, screen-free wind-down.',
    eat: ['Seasonal fruits', 'Warm cooked meals', 'Herbal teas'],
    avoid: ['Cold drinks', 'Processed snacks', 'Overeating at night'],
  },
}

function AiAssistantSection() {
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hi! I'm your Ayurvedic Wellness Assistant. Tell me a concern — try \u201cI have Hair Fall\u201d." },
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages, typing])

  const send = (text) => {
    const query = (text ?? input).trim()
    if (!query) return
    setMessages((m) => [...m, { role: 'user', text: query }])
    setInput('')
    setTyping(true)

    setTimeout(() => {
      const key = Object.keys(AI_KNOWLEDGE).find((k) => query.toLowerCase().includes(k))
      const data = AI_KNOWLEDGE[key] || AI_KNOWLEDGE.default
      setTyping(false)
      setMessages((m) => [...m, { role: 'ai', data }])
    }, 1300)
  }

  return (
    <section id="wh-features" className="wh-section wh-section-tint">
      <div className="wh-container wh-ai-grid">
        <Reveal className="wh-ai-copy">
          <span className="wh-kicker">Ask Anything</span>
          <h2>AI Wellness Assistant</h2>
          <p>
            Describe a concern and get an instant Ayurvedic perspective — possible causes,
            recommended herbs, routines, and foods to favor or avoid.
          </p>
          <div className="wh-ai-suggestions">
            {['I have Hair Fall', 'I feel stressed', 'I have low energy'].map((s) => (
              <button key={s} className="wh-chip" onClick={() => send(s)}>{s}</button>
            ))}
          </div>
        </Reveal>

        <Reveal className="wh-ai-chat">
          <div className="wh-ai-chat-head">
            <span className="wh-ai-avatar"><Bot size={16} /></span>
            <div>
              <p className="wh-ai-name">Wellness AI</p>
              <p className="wh-ai-status">● Online</p>
            </div>
          </div>

          <div className="wh-ai-body">
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className={`wh-ai-msg ${m.role === 'user' ? 'wh-ai-msg-user' : 'wh-ai-msg-bot'}`}
              >
                {m.text && <p>{m.text}</p>}
                {m.data && (
                  <div className="wh-ai-answer">
                    <p><strong>Possible cause:</strong> {m.data.cause}</p>
                    <p><strong>Recommended herbs:</strong> {m.data.herbs.join(', ')}</p>
                    <p><strong>Recommended products:</strong> {m.data.products.join(', ')}</p>
                    <p><strong>Morning routine:</strong> {m.data.morning}</p>
                    <p><strong>Night routine:</strong> {m.data.night}</p>
                    <p><strong>Foods to eat:</strong> {m.data.eat.join(', ')}</p>
                    <p><strong>Foods to avoid:</strong> {m.data.avoid.join(', ')}</p>
                  </div>
                )}
              </motion.div>
            ))}
            {typing && (
              <div className="wh-ai-msg wh-ai-msg-bot wh-ai-typing">
                <span /><span /><span />
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form
            className="wh-ai-input"
            onSubmit={(e) => { e.preventDefault(); send() }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your concern…"
            />
            <button type="submit" aria-label="Send"><Send size={16} /></button>
          </form>
        </Reveal>
      </div>
    </section>
  )
}

/* ────────────────────────────────────────────────────────────
   SECTION 4 — HEALTH CALCULATORS
──────────────────────────────────────────────────────────── */
const CALCULATORS = [
  { id: 'bmi', title: 'BMI Calculator', icon: Scale, accent: '#2E7D32' },
  { id: 'water', title: 'Water Intake Calculator', icon: Droplet, accent: '#1E88E5' },
  { id: 'calories', title: 'Calories Calculator', icon: Flame, accent: '#EF6C00' },
  { id: 'ideal', title: 'Ideal Weight Calculator', icon: Activity, accent: '#00897B' },
  { id: 'sleep', title: 'Sleep Calculator', icon: Moon, accent: '#6A5AE0' },
]

function CalculatorPanel({ id }) {
  const [height, setHeight] = useState(165)
  const [weight, setWeight] = useState(60)
  const [age, setAge] = useState(28)
  const [activity, setActivity] = useState(1.4)
  const [wake, setWake] = useState('06:30')
  const [result, setResult] = useState(null)

  const calc = () => {
    if (id === 'bmi') {
      const m = height / 100
      const bmi = weight / (m * m)
      let label = 'Normal'
      if (bmi < 18.5) label = 'Underweight'
      else if (bmi >= 25 && bmi < 30) label = 'Overweight'
      else if (bmi >= 30) label = 'Obese'
      setResult({ value: bmi.toFixed(1), label })
    } else if (id === 'water') {
      const liters = (weight * 0.033).toFixed(1)
      setResult({ value: `${liters} L`, label: 'recommended daily intake' })
    } else if (id === 'calories') {
      const bmr = 10 * weight + 6.25 * height - 5 * age + 5
      setResult({ value: Math.round(bmr * activity), label: 'kcal / day maintenance' })
    } else if (id === 'ideal') {
      const ideal = 52 + 1.9 * ((height - 152.4) / 2.54)
      setResult({ value: `${Math.max(40, ideal).toFixed(1)} kg`, label: 'ideal body weight' })
    } else if (id === 'sleep') {
      const [h, m] = wake.split(':').map(Number)
      const cycles = [6, 7.5, 9]
      const times = cycles.map((c) => {
        let total = h * 60 + m - c * 60
        total = ((total % 1440) + 1440) % 1440
        const hh = String(Math.floor(total / 60)).padStart(2, '0')
        const mm = String(total % 60).padStart(2, '0')
        return `${hh}:${mm}`
      })
      setResult({ value: times.join('  •  '), label: 'ideal bedtimes for 6 / 7.5 / 9 hr cycles' })
    }
  }

  return (
    <div className="wh-calc-panel">
      {(id === 'bmi' || id === 'water' || id === 'calories' || id === 'ideal') && (
        <label className="wh-field">
          <span>Weight (kg)</span>
          <input type="number" value={weight} onChange={(e) => setWeight(+e.target.value)} />
        </label>
      )}
      {(id === 'bmi' || id === 'calories' || id === 'ideal') && (
        <label className="wh-field">
          <span>Height (cm)</span>
          <input type="number" value={height} onChange={(e) => setHeight(+e.target.value)} />
        </label>
      )}
      {id === 'calories' && (
        <>
          <label className="wh-field">
            <span>Age</span>
            <input type="number" value={age} onChange={(e) => setAge(+e.target.value)} />
          </label>
          <label className="wh-field">
            <span>Activity Level</span>
            <select value={activity} onChange={(e) => setActivity(+e.target.value)}>
              <option value={1.2}>Sedentary</option>
              <option value={1.4}>Lightly Active</option>
              <option value={1.6}>Active</option>
              <option value={1.8}>Very Active</option>
            </select>
          </label>
        </>
      )}
      {id === 'sleep' && (
        <label className="wh-field">
          <span>Wake-up time</span>
          <input type="time" value={wake} onChange={(e) => setWake(e.target.value)} />
        </label>
      )}

      <button className="wh-btn wh-btn-primary wh-calc-btn" onClick={calc}>Calculate</button>

      <AnimatePresence>
        {result && (
          <motion.div
            className="wh-calc-result"
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <p className="wh-calc-result-value">{result.value}</p>
            <p className="wh-calc-result-label">{result.label}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function CalculatorsSection() {
  const [active, setActive] = useState(null)
  return (
    <section className="wh-section">
      <div className="wh-container">
        <Reveal className="wh-section-head">
          <span className="wh-kicker">Know Your Body</span>
          <h2>Health Calculators</h2>
          <p>Quick, science-backed calculators to guide your daily wellness choices.</p>
        </Reveal>

        <motion.div className="wh-calc-grid" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
          {CALCULATORS.map((c) => {
            const Icon = c.icon
            return (
              <motion.button
                key={c.id}
                className="wh-calc-card"
                variants={fadeUp}
                whileHover={{ y: -6 }}
                onClick={() => setActive(c)}
              >
                <span className="wh-calc-icon" style={{ background: `${c.accent}1c`, color: c.accent }}>
                  <Icon size={22} />
                </span>
                <p>{c.title}</p>
                <span className="wh-dash-link"><Calculator size={14} /> Open</span>
              </motion.button>
            )
          })}
        </motion.div>
      </div>

      <AnimatePresence>
        {active && (
          <Modal onClose={() => setActive(null)}>
            <h3>{active.title}</h3>
            <CalculatorPanel id={active.id} />
          </Modal>
        )}
      </AnimatePresence>
    </section>
  )
}

/* ────────────────────────────────────────────────────────────
   SECTION 5 — 30-DAY WELLNESS CHALLENGE
──────────────────────────────────────────────────────────── */
const CHALLENGE_TASKS = [
  'Drink Warm Water', 'Yoga', 'Meditation', 'Healthy Breakfast',
  'Walk', 'Herbal Tea', 'Reading', 'Sleep before 10 PM',
]

function buildInitialDays() {
  const days = []
  for (let i = 1; i <= 30; i++) {
    let status = 'gray'
    if (i < 18) status = 'green'
    else if (i < 21) status = 'yellow'
    days.push({
      day: i,
      status,
      tasks: CHALLENGE_TASKS.reduce((acc, t) => {
        acc[t] = status === 'green' ? true : status === 'yellow' ? Math.random() > 0.5 : false
        return acc
      }, {}),
    })
  }
  return days
}

function Confetti() {
  const pieces = useMemo(
    () => Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: ['#2E7D32', '#D4AF37', '#43A047', '#F4C430'][i % 4],
      delay: Math.random() * 0.4,
      duration: 1.6 + Math.random() * 1.2,
      rotate: Math.random() * 360,
    })),
    []
  )
  return (
    <div className="wh-confetti" aria-hidden="true">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="wh-confetti-piece"
          style={{ left: `${p.left}%`, background: p.color }}
          initial={{ y: -20, opacity: 1, rotate: 0 }}
          animate={{ y: '110vh', opacity: [1, 1, 0], rotate: p.rotate }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
        />
      ))}
    </div>
  )
}

function ChallengeSection() {
  const [days, setDays] = useState(buildInitialDays)
  const [active, setActive] = useState(null)
  const [confetti, setConfetti] = useState(false)

  const streak = useMemo(() => {
    let s = 0
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].status === 'green') s++
      else break
    }
    return s
  }, [days])

  const completion = useMemo(() => {
    const done = days.filter((d) => d.status === 'green').length
    return Math.round((done / days.length) * 100)
  }, [days])

  const badges = useMemo(() => {
    const list = []
    if (streak >= 7) list.push('7-Day Streak')
    if (streak >= 14) list.push('14-Day Warrior')
    if (completion >= 50) list.push('Halfway Hero')
    if (completion === 100) list.push('Wellness Master')
    return list
  }, [streak, completion])

  const toggleTask = (dayNum, task) => {
    setDays((prev) => prev.map((d) => {
      if (d.day !== dayNum) return d
      const tasks = { ...d.tasks, [task]: !d.tasks[task] }
      const doneCount = Object.values(tasks).filter(Boolean).length
      const status = doneCount === CHALLENGE_TASKS.length ? 'green' : doneCount > 0 ? 'yellow' : 'gray'
      if (status === 'green' && d.status !== 'green') {
        setConfetti(true)
        setTimeout(() => setConfetti(false), 2200)
      }
      const updated = { ...d, tasks, status }
      setActive((a) => (a && a.day === dayNum ? updated : a))
      return updated
    }))
  }

  return (
    <section className="wh-section wh-section-tint">
      <div className="wh-container">
        <Reveal className="wh-section-head">
          <span className="wh-kicker">Build The Habit</span>
          <h2>30-Day Wellness Challenge</h2>
          <p>Track daily rituals, keep your streak alive, and unlock badges along the way.</p>
        </Reveal>

        <Reveal className="wh-challenge-stats">
          <div><p className="wh-stat-value">{streak}</p><p className="wh-stat-label">Current Streak</p></div>
          <div><p className="wh-stat-value">{completion}%</p><p className="wh-stat-label">Completion</p></div>
          <div className="wh-progress-track">
            <div className="wh-progress-fill" style={{ width: `${completion}%` }} />
          </div>
          <div className="wh-badges">
            {badges.length ? badges.map((b) => (
              <span key={b} className="wh-badge"><Award size={12} /> {b}</span>
            )) : <span className="wh-badge wh-badge-muted">Complete days to earn badges</span>}
          </div>
        </Reveal>

        <Reveal className="wh-calendar">
          {days.map((d) => (
            <button
              key={d.day}
              className={`wh-cal-day wh-cal-${d.status}`}
              onClick={() => setActive(d)}
            >
              {d.day}
            </button>
          ))}
        </Reveal>

        <div className="wh-cal-legend">
          <span><i className="wh-cal-green" /> Completed</span>
          <span><i className="wh-cal-yellow" /> Partial</span>
          <span><i className="wh-cal-gray" /> Incomplete</span>
        </div>
      </div>

      <AnimatePresence>
        {active && (
          <Modal onClose={() => setActive(null)}>
            <h3>Day {active.day} Checklist</h3>
            <div className="wh-checklist">
              {CHALLENGE_TASKS.map((t) => (
                <label key={t} className="wh-checklist-item">
                  <input
                    type="checkbox"
                    checked={!!active.tasks[t]}
                    onChange={() => toggleTask(active.day, t)}
                  />
                  <span>{t}</span>
                </label>
              ))}
            </div>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>{confetti && <Confetti />}</AnimatePresence>
    </section>
  )
}

/* ────────────────────────────────────────────────────────────
   SECTION 6 — HEALTHY DIET PLANNER
──────────────────────────────────────────────────────────── */
function DietPlannerSection() {
  const [form, setForm] = useState({ age: 28, weight: 60, goal: 'balance', diet: 'veg' })
  const [plan, setPlan] = useState(null)

  const generate = (e) => {
    e.preventDefault()
    const plans = {
      balance: { breakfast: 'Oats with soaked almonds & seasonal fruit', lunch: 'Moong dal khichdi with ghee & vegetables',
        dinner: 'Steamed vegetables with light roti', snack: 'Herbal tea with soaked figs' },
      weightloss: { breakfast: 'Warm lemon water + vegetable poha', lunch: 'Millet bowl with sautéed greens',
        dinner: 'Clear vegetable soup with sprouts', snack: 'Roasted makhana' },
      weightgain: { breakfast: 'Banana smoothie with nuts & dates', lunch: 'Rice, dal, ghee & paneer sabzi',
        dinner: 'Whole wheat roti with paneer curry', snack: 'Dry fruit & jaggery laddoo' },
      immunity: { breakfast: 'Turmeric milk + herbal porridge', lunch: 'Vegetable soup with millet roti',
        dinner: 'Light khichdi with ginger tempering', snack: 'Tulsi-ginger tea' },
    }
    const herbsByGoal = {
      balance: ['Triphala', 'Ashwagandha'], weightloss: ['Guggul', 'Punarnava'],
      weightgain: ['Ashwagandha', 'Shatavari'], immunity: ['Tulsi', 'Giloy'],
    }
    setPlan({
      meals: plans[form.goal],
      herbs: herbsByGoal[form.goal],
      products: ['Herbal Wellness Tea', 'Daily Immunity Capsules', 'Digestive Churna'],
    })
  }

  return (
    <section className="wh-section">
      <div className="wh-container wh-diet-grid">
        <Reveal className="wh-diet-form-wrap">
          <span className="wh-kicker">Personalized For You</span>
          <h2>Healthy Diet Planner</h2>
          <form className="wh-diet-form" onSubmit={generate}>
            <label className="wh-field">
              <span>Age</span>
              <input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: +e.target.value })} />
            </label>
            <label className="wh-field">
              <span>Weight (kg)</span>
              <input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: +e.target.value })} />
            </label>
            <label className="wh-field">
              <span>Goal</span>
              <select value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })}>
                <option value="balance">Balance & Maintain</option>
                <option value="weightloss">Weight Loss</option>
                <option value="weightgain">Weight Gain</option>
                <option value="immunity">Boost Immunity</option>
              </select>
            </label>
            <label className="wh-field">
              <span>Diet Preference</span>
              <select value={form.diet} onChange={(e) => setForm({ ...form, diet: e.target.value })}>
                <option value="veg">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="eggetarian">Eggetarian</option>
              </select>
            </label>
            <button className="wh-btn wh-btn-primary" type="submit">Generate My Plan</button>
          </form>
        </Reveal>

        <div className="wh-diet-result">
          <AnimatePresence mode="wait">
            {plan ? (
              <motion.div
                key="plan"
                className="wh-diet-cards"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {Object.entries(plan.meals).map(([slot, meal]) => (
                  <div key={slot} className="wh-diet-card">
                    <p className="wh-diet-slot">{slot}</p>
                    <p className="wh-diet-meal">{meal}</p>
                  </div>
                ))}
                <div className="wh-diet-card wh-diet-card-accent">
                  <p className="wh-diet-slot">Recommended Herbs</p>
                  <p className="wh-diet-meal">{plan.herbs.join(', ')}</p>
                </div>
                <div className="wh-diet-card wh-diet-card-accent">
                  <p className="wh-diet-slot">Recommended Products</p>
                  <p className="wh-diet-meal">{plan.products.join(', ')}</p>
                </div>
              </motion.div>
            ) : (
              <motion.div key="empty" className="wh-diet-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Leaf size={28} />
                </motion.div>
                <p>Fill the form to generate your personalized Ayurvedic meal plan.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

/* ────────────────────────────────────────────────────────────
   SECTION 7 — DAILY WELLNESS TIPS
──────────────────────────────────────────────────────────── */
const TIPS = [
  { icon: Sun, title: 'Wake with the Sun',
    desc: 'Rising before sunrise aligns your body clock with nature and boosts energy.',
    more: 'Ayurveda calls this window Brahma Muhurta. Waking 90 minutes before sunrise keeps Vata balanced and gives you a calm, focused start — try it for 7 days and track how your energy shifts by midday.' },
  { icon: Droplet, title: 'Start with Warm Water',
    desc: 'A glass of warm water on waking supports digestion and detoxification.',
    more: 'Warm water gently stimulates peristalsis and flushes Ama (toxins) that accumulate overnight. Add a squeeze of lemon or a pinch of soaked fennel for extra digestive support.' },
  { icon: Wind, title: 'Practice Pranayama',
    desc: 'Five minutes of mindful breathing calms the nervous system instantly.',
    more: 'Start with Nadi Shodhana (alternate nostril breathing) for 5 rounds. It balances the left and right hemispheres and is one of the fastest ways to lower stress before a busy day.' },
  { icon: Leaf, title: 'Eat Seasonal Foods',
    desc: 'Seasonal produce is easier to digest and naturally balances your dosha.',
    more: 'Local, in-season fruits and vegetables carry the exact qualities your body needs to counter that season\u2019s dosha aggravation — cooling in summer, warming in winter.' },
  { icon: Moon, title: 'Wind Down Early',
    desc: 'Sleeping by 10 PM supports the body\u2019s natural repair cycle.',
    more: 'Between 10 PM and 2 AM the body does its deepest Pitta-driven repair work. Missing this window is one of the biggest hidden causes of low energy and skin dullness.' },
]

function TipsSection() {
  const [i, setI] = useState(0)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % TIPS.length), 4000)
    return () => clearInterval(id)
  }, [])
  const tip = TIPS[i]
  const Icon = tip.icon

  return (
    <section className="wh-section wh-section-tint">
      <div className="wh-container">
        <Reveal className="wh-section-head">
          <span className="wh-kicker">Small Rituals, Big Impact</span>
          <h2>Daily Wellness Tips</h2>
        </Reveal>

        <div className="wh-tips-slider">
          <AnimatePresence mode="wait">
            <motion.div
              key={i}
              className="wh-tip-card"
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <motion.span
                className="wh-tip-icon"
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Icon size={26} />
              </motion.span>
              <h3>{tip.title}</h3>
              <p>{tip.desc}</p>
              <button type="button" className="wh-tip-more" onClick={() => setExpanded(tip)}>
                Read More <ArrowRight size={14} />
              </button>
            </motion.div>
          </AnimatePresence>
          <div className="wh-tips-dots">
            {TIPS.map((_, idx) => (
              <button
                key={idx}
                className={`wh-tips-dot ${idx === i ? 'active' : ''}`}
                onClick={() => setI(idx)}
                aria-label={`Tip ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <Modal onClose={() => setExpanded(null)}>
            <span
              className="wh-modal-icon"
              style={{ background: 'var(--wh-green-light)', color: 'var(--wh-green)' }}
            >
              <expanded.icon size={26} />
            </span>
            <h3>{expanded.title}</h3>
            <p className="wh-modal-detail">{expanded.desc}</p>
            <p className="wh-modal-detail">{expanded.more}</p>
          </Modal>
        )}
      </AnimatePresence>
    </section>
  )
}

/* ────────────────────────────────────────────────────────────
   SECTION 8 — ACHIEVEMENTS
──────────────────────────────────────────────────────────── */
function Counter({ to, suffix = '', duration = 1.6 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const [val, setVal] = useState(0)

  useEffect(() => {
    if (!inView) return
    let start
    let raf
    const step = (t) => {
      if (!start) start = t
      const progress = Math.min((t - start) / (duration * 1000), 1)
      setVal(Math.round(to * (1 - Math.pow(1 - progress, 3))))
      if (progress < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [inView, to, duration])

  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>
}

const ACHIEVEMENTS = [
  { to: 50000, suffix: '+', label: 'Healthy Customers' },
  { to: 120, suffix: '+', label: 'Natural Products' },
  { to: 4.9, suffix: '★', label: 'Customer Rating', decimal: true },
  { to: 95, suffix: '%', label: 'Returning Customers' },
]

function AchievementsSection() {
  return (
    <section className="wh-section wh-achievements">
      <div className="wh-container wh-ach-grid">
        {ACHIEVEMENTS.map((a) => (
          <Reveal key={a.label} className="wh-ach-card">
            <p className="wh-ach-value">
              {a.decimal ? '4.9★' : <Counter to={a.to} suffix={a.suffix} />}
            </p>
            <p className="wh-ach-label">{a.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ────────────────────────────────────────────────────────────
   SECTION 9 — TESTIMONIALS
──────────────────────────────────────────────────────────── */
const TESTIMONIALS = [
  { name: 'Ananya Sharma', rating: 5, review: 'The wellness tools helped me build a routine I actually stick to. My energy levels have never been better.' },
  { name: 'Rohit Verma', rating: 5, review: 'The AI assistant gave me such practical Ayurvedic advice — simple, natural, and it actually works.' },
  { name: 'Priya Nair', rating: 4, review: 'Loved the 30-day challenge. The streak tracker kept me motivated the whole month.' },
  { name: 'Karan Mehta', rating: 5, review: 'The diet planner made healthy eating so much easier to follow every day.' },
]

function TestimonialsSection() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % TESTIMONIALS.length), 4500)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="wh-section wh-section-tint">
      <div className="wh-container">
        <Reveal className="wh-section-head">
          <span className="wh-kicker">Loved By Our Community</span>
          <h2>Testimonials</h2>
        </Reveal>

        <div className="wh-testimonial-wrap">
          <AnimatePresence mode="wait">
            <motion.div
              key={i}
              className="wh-testimonial-card"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.5 }}
            >
              <Quote size={26} className="wh-quote-icon" />
              <p className="wh-testimonial-text">{TESTIMONIALS[i].review}</p>
              <div className="wh-testimonial-foot">
                <span className="wh-avatar">{TESTIMONIALS[i].name.charAt(0)}</span>
                <div>
                  <p className="wh-testimonial-name">{TESTIMONIALS[i].name}</p>
                  <div className="wh-stars">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} size={13} fill={idx < TESTIMONIALS[i].rating ? '#D4AF37' : 'none'} color="#D4AF37" />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

/* ────────────────────────────────────────────────────────────
   SECTION 10 — CALL TO ACTION
──────────────────────────────────────────────────────────── */
function CtaSection() {
  return (
    <section className="wh-cta">
      <FloatingLeaves />
      <Reveal className="wh-cta-inner">
        <h2>Start Your Wellness Journey Today</h2>
        <p>Personalized routines, natural remedies, and daily guidance — all in one place.</p>
        <a href="#wh-dashboard" className="wh-btn wh-btn-gold">Check My Wellness</a>
      </Reveal>
    </section>
  )
}

/* ────────────────────────────────────────────────────────────
   PAGE
──────────────────────────────────────────────────────────── */
export default function WellnessHubPage() {
  return (
    <div className="wh-page">
      <HeroSection />
      <DashboardSection />
      <AiAssistantSection />
      <CalculatorsSection />
      <ChallengeSection />
      <DietPlannerSection />
      <TipsSection />
      <AchievementsSection />
      <TestimonialsSection />
      <CtaSection />
    </div>
  )
}