import { useEffect, useState } from 'react'
import { whyUs as whyUsFallback } from '../data/products.js'
import { siteSettingsApi } from '../api/siteSettingsApi'
import * as LucideIcons from 'lucide-react'
import '../styles/WhyChooseUs.css'

export default function WhyChooseUs() {
  // Admin-editable via Admin Panel -> Storefront -> Home Content. Falls
  // back to the bundled defaults instantly and while the request is in
  // flight, so the section never renders empty.
  const [whyUs, setWhyUs] = useState(whyUsFallback)

  useEffect(() => {
    let cancelled = false
    siteSettingsApi
      .getHomeContent()
      .then((res) => {
        if (!cancelled && res.homeContent?.whyUs?.length) {
          setWhyUs(res.homeContent.whyUs)
        }
      })
      .catch(() => {
        // Keep the fallback list if the request fails.
      })
    return () => {
      cancelled = true
    }
  }, [])

  const IconComponent = ({ iconName }) => {
    const Icon = LucideIcons[iconName]
    return Icon ? <Icon size={32} strokeWidth={1.5} /> : null
  }

  return (
    <section className="section bg-light">
      <div className="container">
        <div className="sec-head">
          <span className="eyebrow">Our Promise</span>
          <h2>Why Choose Amrita?</h2>
          <p>We believe in nature's power to heal, nourish and transform your life</p>
        </div>
        <div className="why-grid">
          {whyUs.map((item, i) => (
            <div key={i} className="why-card">
              <div className="why-icon">
                <IconComponent iconName={item.icon} />
              </div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
