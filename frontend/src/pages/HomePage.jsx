import { useEffect, useState } from 'react'
import HeroSlider from '../Component/HeroSlider.jsx'
import FeaturesStrip from '../Component/Feautresstrip.jsx'
import CategoryGrid from '../Component/Categorygrid.jsx'
import ProductSwiper from '../Component/Productswiper.jsx'
import EssentialsGrid from '../Component/Essentialsgrid.jsx'
import ComboSwiper from '../Component/Combocard.jsx'
import { ConcernSwiper, IngredientSwiper } from '../Component/Concerncard.jsx'
import SearchPills from '../Component/Searchpills.jsx'
import WhyChooseUs from '../Component/Whychooseus.jsx'
import Testimonials from '../Component/Testimonials.jsx'
import BrandStory from '../Component/Brandstory.jsx'
import Newsletter from '../Component/Newsletter.jsx'
import InstagramGrid from '../Component/Instagramgrid.jsx'
import CtaBand from '../Component/Ctaband.jsx'
import OfferCountdown from '../Component/OfferCountdown.jsx'
import { productsApi } from '../api/productsApi.js'

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [bestSellers, setBestSellers] = useState([])
  const [todaysOffers, setTodaysOffers] = useState([])
  const [newArrivals, setNewArrivals] = useState([])
  const [trendingProducts, setTrendingProducts] = useState([])

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        const [featured, best, offers, arrivals, trending] = await Promise.all([
          productsApi.list({ isFeatured: true, limit: 8 }),
          productsApi.list({ isBestSeller: true, limit: 8 }),
          productsApi.list({ sort: '-createdAt', limit: 8 }),
          productsApi.list({ isNewArrival: true, limit: 8 }),
          productsApi.list({ isTrending: true, limit: 8 }),
        ])

        if (!mounted) return
        setFeaturedProducts(featured.products || [])
        setBestSellers(best.products || [])
        // "Today's Offers" = active products currently on discount (oldPrice > price)
        setTodaysOffers((offers.products || []).filter((p) => p.oldPrice && p.oldPrice > p.price))
        setNewArrivals(arrivals.products || [])
        setTrendingProducts(trending.products || [])
      } catch {
        // Network/API failure — sections below simply render nothing rather than dummy data.
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <>
      <HeroSlider />
      <FeaturesStrip />
      <CategoryGrid />

      {featuredProducts.length > 0 && (
        <ProductSwiper
          eyebrow="Top Picks"
          title="Featured Products"
          subtitle="Bestselling Ayurvedic products loved by thousands of customers"
          products={featuredProducts}
          viewAllLink="/shop"
          viewAllText="View All Products"
          bgClass="bg-light"
          autoplayDelay={3500}
        />
      )}

      {bestSellers.length > 0 && (
        <ProductSwiper
          eyebrow="Most Loved"
          title="Best Sellers"
          subtitle="Our customers can't get enough of these Ayurvedic favourites"
          products={bestSellers}
          viewAllLink="/shop?bestseller=true"
          viewAllText="View All Best Sellers"
          autoplayDelay={3200}
          showQuick={false}
        />
      )}

      <EssentialsGrid />

      {todaysOffers.length > 0 && (
        <ProductSwiper
          eyebrow="Limited Time"
          title="Today's Offers"
          subtitle="Grab these deals before they expire tonight"
          products={todaysOffers}
          autoplayDelay={3800}
          showQuick={false}
          headerExtra={<OfferCountdown endOfDay label="Offer ends in" />}
        />
      )}

      <ComboSwiper />
      <ConcernSwiper />
      <IngredientSwiper />
      <SearchPills />

      {newArrivals.length > 0 && (
        <ProductSwiper
          eyebrow="Fresh Drops"
          title="New Arrivals"
          subtitle="The latest additions to our herbal collection"
          products={newArrivals}
          bgClass="bg-light"
          autoplayDelay={3600}
        />
      )}

      {trendingProducts.length > 0 && (
        <ProductSwiper
          eyebrow="Hot Right Now"
          title="Trending Products"
          subtitle="Flying off our shelves — grab yours before it's gone"
          products={trendingProducts}
          autoplayDelay={3400}
          showQuick={false}
        />
      )}

      <WhyChooseUs />
      <Testimonials />
      <BrandStory />
      <Newsletter />
      <InstagramGrid />
      <CtaBand />
    </>
  )
}