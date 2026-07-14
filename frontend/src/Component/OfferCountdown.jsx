import { useEffect, useState } from 'react'
import '../styles/OfferCountdown.css'

/**
 * Countdown timer for limited-time offers.
 *
 * Usage:
 *   <OfferCountdown endOfDay />                     // resets every night at 12:00 AM
 *   <OfferCountdown endTime="2026-07-10T23:59:59" /> // counts down to a fixed date/time
 *   <OfferCountdown hours={6} />                     // counts down 6 hours from first render
 */
export default function OfferCountdown({ endTime, endOfDay = false, hours, label = 'Offer ends in' }) {
  const getTarget = () => {
    if (endTime) return new Date(endTime).getTime()
    if (hours) return Date.now() + hours * 60 * 60 * 1000
    if (endOfDay) {
      const midnight = new Date()
      midnight.setHours(24, 0, 0, 0) // next midnight
      return midnight.getTime()
    }
    // default fallback: 24 hours from now
    return Date.now() + 24 * 60 * 60 * 1000
  }

  const [target, setTarget] = useState(getTarget)
  const [remaining, setRemaining] = useState(target - Date.now())

  useEffect(() => {
    const tick = () => {
      const diff = target - Date.now()
      if (diff <= 0) {
        // Timer hit zero — if it's a daily reset offer, roll over to the next day automatically
        if (endOfDay) {
          const nextMidnight = new Date()
          nextMidnight.setHours(24, 0, 0, 0)
          setTarget(nextMidnight.getTime())
        } else {
          setRemaining(0)
        }
      } else {
        setRemaining(diff)
      }
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [target, endOfDay])

  const totalSeconds = Math.max(0, Math.floor(remaining / 1000))
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60

  const pad = (n) => String(n).padStart(2, '0')

  return (
    <div className="offer-countdown" role="timer" aria-live="off">
      <span className="offer-countdown-label">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="12" cy="12" r="9" />
          <polyline points="12 7 12 12 15.5 14" />
        </svg>
        {label}
      </span>

      <div className="offer-countdown-boxes">
        <div className="offer-countdown-box">
          <span className="offer-countdown-num">{pad(h)}</span>
          <span className="offer-countdown-unit">Hrs</span>
        </div>
        <span className="offer-countdown-sep">:</span>
        <div className="offer-countdown-box">
          <span className="offer-countdown-num">{pad(m)}</span>
          <span className="offer-countdown-unit">Min</span>
        </div>
        <span className="offer-countdown-sep">:</span>
        <div className="offer-countdown-box">
          <span className="offer-countdown-num">{pad(s)}</span>
          <span className="offer-countdown-unit">Sec</span>
        </div>
      </div>
    </div>
  )
}