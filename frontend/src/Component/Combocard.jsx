import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { combosApi } from '../api/combosApi.js'
import { PLACEHOLDER_IMAGE, handleImageError } from '../utils/imageFallback.js'
import '../styles/ComboCard.css'

function ComboCard({ combo }) {
  return (
    <div className="combo-card">
      <div className="combo-save">{combo.save}</div>
      <div className="combo-imgs">
        <div className="combo-img-box">
          <img src={combo.img1 || PLACEHOLDER_IMAGE} alt="" loading="lazy" onError={handleImageError} />
        </div>
        <span className="combo-plus">+</span>
        <div className="combo-img-box">
          <img src={combo.img2 || PLACEHOLDER_IMAGE} alt="" loading="lazy" onError={handleImageError} />
        </div>
      </div>
      <h3>{combo.title}</h3>
      <p>{combo.desc}</p>
      <div className="combo-price">
        <span className="combo-new">{combo.newPrice}</span>
        <span className="combo-old">{combo.oldPrice}</span>
      </div>
      <Link to={`/shop?combo=${combo.id}`} className="btn btn-gold">Shop Now</Link>
    </div>
  )
}

export default function ComboSwiper() {
  const [combos, setCombos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    combosApi.listActive()
      .then((data) => {
        if (mounted) setCombos(data)
      })
      .catch(() => {
        // Network/API failure — section simply doesn't render rather than
        // falling back to dummy data.
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  // Nothing active in the admin panel (or still loading) — render nothing
  // instead of an empty/broken-looking section.
  if (loading || combos.length === 0) return null

  // Swiper's loop mode needs at least as many slides as the widest
  // breakpoint's slidesPerView, otherwise it can render blank/duplicate
  // slides — so only loop when there's genuinely enough combos for it.
  const canLoop = combos.length > 3

  return (
    <section className="section bg-light">
      <div className="container">
        <div className="sec-head">
          <span className="eyebrow">Bundle &amp; Save</span>
          <h2>Combo Offers</h2>
          <p>Save more when you buy these powerful duos together</p>
        </div>
        <Swiper
          className="prod-swiper prod-swiper-eq"
          modules={[Autoplay, Navigation, Pagination]}
          slidesPerView={1}
          spaceBetween={20}
          grabCursor={true}
          loop={canLoop}
          speed={900}
          autoplay={{ delay: 3200, disableOnInteraction: false, pauseOnMouseEnter: true }}
          navigation
          pagination={{ clickable: true }}
          breakpoints={{
            480:  { slidesPerView: 1.15, spaceBetween: 18 },
            640:  { slidesPerView: 2, spaceBetween: 22 },
            1024: { slidesPerView: 3, spaceBetween: 26 },
            1280: { slidesPerView: Math.min(4, combos.length), spaceBetween: 26 },
          }}
        >
          {combos.map(combo => (
            <SwiperSlide key={combo.id}>
              <ComboCard combo={combo} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  )
}
