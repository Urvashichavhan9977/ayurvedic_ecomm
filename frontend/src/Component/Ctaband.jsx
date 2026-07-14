import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { siteSettingsApi } from '../api/siteSettingsApi'
import '../styles/CtaBand.css'

const CTA_FALLBACK = {
  title: 'Begin your wellness journey',
  subtitle: 'Explore handcrafted Ayurvedic rituals for everyday balance.',
  buttonText: 'Shop Now',
  buttonLink: '/shop',
}

export default function CtaBand() {
  // Admin-editable via Admin Panel -> Storefront -> Home Content. Falls
  // back to the bundled defaults instantly and while the request is in
  // flight, so the band never renders empty.
  const [cta, setCta] = useState(CTA_FALLBACK)

  useEffect(() => {
    let cancelled = false
    siteSettingsApi
      .getHomeContent()
      .then((res) => {
        if (!cancelled && res.homeContent?.ctaBand) {
          setCta((prev) => ({ ...prev, ...res.homeContent.ctaBand }))
        }
      })
      .catch(() => {
        // Keep the fallback content if the request fails.
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="section-sm">
      <div className="container">
        <div className="cta-band">
          <div>
            <h2>{cta.title}</h2>
            <p>{cta.subtitle}</p>
          </div>
          <Link to={cta.buttonLink || '/shop'} className="btn btn-gold">{cta.buttonText}</Link>
        </div>
      </div>
    </section>
  )
}