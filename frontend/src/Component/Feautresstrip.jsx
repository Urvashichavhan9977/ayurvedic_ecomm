import { useEffect, useState } from 'react'
import * as LucideIcons from 'lucide-react'
import { siteSettingsApi } from '../api/siteSettingsApi'
import '../styles/FeaturesStrip.css'

const FEATURES_FALLBACK = [
  { icon: 'ShieldCheck', title: '100% Natural', sub: 'Pure herbs, no chemicals' },
  { icon: 'BadgeCheck', title: 'Lab Certified', sub: 'Every batch tested' },
  { icon: 'Truck', title: 'Free Shipping', sub: 'Orders above ₹999' },
  { icon: 'CreditCard', title: 'Secure Payment', sub: '100% safe checkout' },
  { icon: 'RotateCcw', title: 'Easy Returns', sub: '7-day hassle-free' },
]

function FeatureIcon({ name }) {
  const Icon = LucideIcons[name]
  return Icon ? <Icon size={22} strokeWidth={1.8} /> : <LucideIcons.Leaf size={22} strokeWidth={1.8} />
}

export default function FeaturesStrip() {
  // Admin-editable via Admin Panel -> Storefront -> Home Content. Falls
  // back to the bundled defaults instantly and while the request is in
  // flight, so the strip never renders empty.
  const [features, setFeatures] = useState(FEATURES_FALLBACK)

  useEffect(() => {
    let cancelled = false
    siteSettingsApi
      .getHomeContent()
      .then((res) => {
        if (!cancelled && res.homeContent?.features?.length) {
          setFeatures(res.homeContent.features)
        }
      })
      .catch(() => {
        // Keep the fallback list if the request fails.
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="fstrip">
      <div className="container">
        <div className="fstrip-grid">
          {features.map((f, i) => (
            <div key={i} className="fstrip-item">
              <div className="fstrip-icon"><FeatureIcon name={f.icon} /></div>
              <div className="fstrip-text">
                <strong>{f.title}</strong>
                <span>{f.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}