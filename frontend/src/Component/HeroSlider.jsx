import { Link } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Navigation, Pagination, EffectFade } from 'swiper/modules'
import * as LucideIcons from 'lucide-react'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/effect-fade'
import { heroSlides } from '../data/products'
import '../styles/HeroSlider.css'
import herbImg from '../assets/images/insta/herbs-mortar.png'

const IconComponent = ({ iconName }) => {
  const Icon = LucideIcons[iconName]
  return Icon ? <Icon size={18} strokeWidth={2} /> : null
}


export default function HeroSlider() {
  return (
    <section className="hero-slider" aria-label="Hero">
      <Swiper
        className="hero-swiper"
        modules={[Autoplay, Navigation, Pagination, EffectFade]}
        loop={true}
        autoplay={{ delay: 5500, disableOnInteraction: false }}
        speed={900}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        navigation
        pagination={{ clickable: true }}
      >
        {heroSlides.map(slide => (
          <SwiperSlide key={slide.id} className="hero-slide">

            {/* Amrita background — video if available, image fallback */}
            {slide.video ? (
              <video
                key={slide.video}
                className="hero-bg-image"
                src={slide.video}
                autoPlay
                muted
                loop
                playsInline
                controls={false}
                disablePictureInPicture
                tabIndex={-1}
                aria-hidden="true"
              />
            ) : (
              <img
                className="hero-bg-image"
                src={slide.img}
                alt={slide.title}
              />
            )}

            <div className="hero-overlay" />
            <div className="hero-leaves" aria-hidden="true">
              <svg className="hero-leaf leaf-1" viewBox="0 0 100 100">
                <path d="M50 5 C70 15 90 35 90 55 C90 78 70 95 50 95 C30 95 10 78 10 55 C10 35 30 15 50 5 Z" fill="currentColor" />
              </svg>
              <svg className="hero-leaf leaf-2" viewBox="0 0 100 100">
                <path d="M50 5 C70 15 90 35 90 55 C90 78 70 95 50 95 C30 95 10 78 10 55 C10 35 30 15 50 5 Z" fill="currentColor" />
              </svg>
              <svg className="hero-leaf leaf-3" viewBox="0 0 100 100">
                <path d="M50 5 C70 15 90 35 90 55 C90 78 70 95 50 95 C30 95 10 78 10 55 C10 35 30 15 50 5 Z" fill="currentColor" />
              </svg>
              <svg className="hero-leaf leaf-4" viewBox="0 0 100 100">
                <path d="M50 5 C70 15 90 35 90 55 C90 78 70 95 50 95 C30 95 10 78 10 55 C10 35 30 15 50 5 Z" fill="currentColor" />
              </svg>
              <svg className="hero-leaf leaf-5" viewBox="0 0 100 100">
                <path d="M50 5 C70 15 90 35 90 55 C90 78 70 95 50 95 C30 95 10 78 10 55 C10 35 30 15 50 5 Z" fill="currentColor" />
              </svg>
              <svg className="hero-leaf leaf-6" viewBox="0 0 100 100">
                <path d="M50 5 C70 15 90 35 90 55 C90 78 70 95 50 95 C30 95 10 78 10 55 C10 35 30 15 50 5 Z" fill="currentColor" />
              </svg>
            </div>

            <div className="container hero-inner">
              <div className="hero-text">
                <h1 className="hero-title">
                  {slide.title}<br />
                  <em>{slide.titleEm}</em>
                </h1>
                <p className="hero-sub">{slide.sub}</p>
                <div className="hero-feats">
                  {slide.feats.map((f, i) => (
                    <div key={i} className="hero-feat">
                      <IconComponent iconName={f.icon} /><span>{f.text}</span>
                    </div>
                  ))}
                </div>
                <div className="hero-btns">
                  <Link to={slide.btn1.link} className="btn btn-gold">{slide.btn1.text}</Link>
                  <Link to={slide.btn2.link} className="btn btn-outline-w">{slide.btn2.text}</Link>
                </div>
              </div>

              {/* Right side herb image box */}
              <div className="hero-img-wrap">
                <div className="herb-anim-box">
                  <img
                    className="herb-video"
                    src={herbImg}
                    alt="Ayurvedic Herbs"
                  />
                  <div className="herb-swirl" />
                  <div className="herb-mist" />
                  <div className="herb-ring" />
                  <div className="herb-ring" />
                </div>
                <div className="hero-badge">
                  {slide.badge1}<br />
                  <strong>{slide.badge2}</strong>
                </div>
              </div>
            </div>

          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  )
}