import { Link } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import ProductCard from './Productcard.jsx'
import '../styles/ProductSwiper.css'

export default function ProductSwiper({
  title,
  eyebrow,
  subtitle,
  products,
  viewAllLink,
  viewAllText = 'View All',
  bgClass = '',
  autoplayDelay = 3500,
  showQuick = true,
}) {
  // Nothing added in the admin panel for this section yet — render
  // nothing rather than an empty/broken-looking swiper.
  if (!products || products.length === 0) return null

  return (
    <section className={`section ${bgClass}`}>
      <div className="container">
        <div className="sec-head">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>

        <Swiper
          className="prod-swiper"
          modules={[Autoplay, Navigation, Pagination]}
          slidesPerView={1.15}
          spaceBetween={16}
          grabCursor={true}
          loop={false}
          autoplay={{ delay: autoplayDelay, disableOnInteraction: false }}
          navigation
          pagination={{ clickable: true }}
          breakpoints={{
            480:  { slidesPerView: 2.1, spaceBetween: 16 },
            768:  { slidesPerView: 3,   spaceBetween: 20 },
            1024: { slidesPerView: 4,   spaceBetween: 24 },
          }}
        >
          {products.map(product => (
            <SwiperSlide key={product.id}>
              <ProductCard product={product} showQuick={showQuick} />
            </SwiperSlide>
          ))}
        </Swiper>

        {viewAllLink && (
          <div className="tc mt-3">
            <Link to={viewAllLink} className="btn btn-outline">{viewAllText}</Link>
          </div>
        )}
      </div>
    </section>
  )
}