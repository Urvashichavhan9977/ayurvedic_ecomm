import { useEffect, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import { testimonials as testimonialsFallback } from '../data/products.js'
import { siteSettingsApi } from '../api/siteSettingsApi'
import '../styles/Testimonials.css'

const initialsOf = (name = '') =>
  name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?'

export default function Testimonials() {
  // Admin-editable via Admin Panel -> Storefront -> Home Content. Falls
  // back to the bundled defaults instantly and while the request is in
  // flight, so the section never renders empty.
  const [testimonials, setTestimonials] = useState(testimonialsFallback)

  useEffect(() => {
    let cancelled = false
    siteSettingsApi
      .getHomeContent()
      .then((res) => {
        const list = res.homeContent?.testimonials
        if (!cancelled && list?.length) {
          setTestimonials(
            list.map((t, i) => ({
              id: t._id || i,
              initials: initialsOf(t.name),
              name: t.name,
              location: t.location,
              quote: t.quote,
              rating: t.rating || 5,
            }))
          )
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
    <section className="testi-section" aria-label="Testimonials">
      <div className="testi-orb o1" />
      <div className="testi-orb o2" />
      <div className="container">
        <div className="sec-head">
          <span className="eyebrow" style={{ color: 'var(--gold2)' }}>Real Stories</span>
          <h2 style={{ color: '#fff' }}>What Our Customers Say</h2>
          <p style={{ color: 'rgba(255,255,255,.6)' }}>Trusted by 50,000+ happy customers across India</p>
        </div>
        <Swiper
          className="prod-swiper testi-swiper"
          modules={[Autoplay, Pagination]}
          loop={true}
          autoplay={{ delay: 4500, disableOnInteraction: false }}
          speed={750}
          slidesPerView={1}
          spaceBetween={20}
          pagination={{ clickable: true }}
          breakpoints={{
            768:  { slidesPerView: 2, spaceBetween: 20 },
            1024: { slidesPerView: 3, spaceBetween: 24 },
          }}
        >
          {testimonials.map(t => (
            <SwiperSlide key={t.id} className="testi-slide">
              <div className="testi-card">
                <div className="testi-stars">
                  {'★'.repeat(t.rating || 5)}{'☆'.repeat(5 - (t.rating || 5))}
                </div>
                <p className="testi-quote">"{t.quote}"</p>
                <div className="testi-author">
                  <div className="testi-av">{t.initials}</div>
                  <div>
                    <strong>{t.name}</strong>
                    <small>{t.location} • Verified Buyer</small>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  )
}