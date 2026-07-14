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
import { productsApi } from '../api/productsApi.js'

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [bestSellers, setBestSellers] = useState([])
  const [todaysOffers, setTodaysOffers] = useState([])
  const [newArrivals, setNewArrivals] = useState([])
  const [trendingProducts, setTrendingProducts] = useState([])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const [featured, bestSeller, newArrival, trending, offers] = await Promise.all([
        productsApi.list({ isFeatured: true, limit: 8 }).catch(() => ({ products: [] })),
        productsApi.list({ isBestSeller: true, limit: 8 }).catch(() => ({ products: [] })),
        productsApi.list({ isNewArrival: true, limit: 8 }).catch(() => ({ products: [] })),
        productsApi.list({ isTrending: true, limit: 8 }).catch(() => ({ products: [] })),
        // "Today's Offers" = any active product that currently has a discount
        productsApi.list({ sort: '-createdAt', limit: 8 }).catch(() => ({ products: [] })),
      ])

      if (cancelled) return
      setFeaturedProducts(featured.products)
      setBestSellers(bestSeller.products)
      setNewArrivals(newArrival.products)
      setTrendingProducts(trending.products)
      setTodaysOffers(offers.products.filter(p => p.oldPrice && p.oldPrice > p.price))
    }

    load()
    return () => { cancelled = true }
  }, [])

  return (
    <>
      <HeroSlider />
      <FeaturesStrip />
      <CategoryGrid />

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

      <EssentialsGrid />

      <ProductSwiper
        eyebrow="Limited Time"
        title="Today's Offers"
        subtitle="Grab these deals before they expire tonight"
        products={todaysOffers}
        autoplayDelay={3800}
        showQuick={false}
      />

      <ComboSwiper />
      <ConcernSwiper />
      <IngredientSwiper />
      <SearchPills />

      <ProductSwiper
        eyebrow="Fresh Drops"
        title="New Arrivals"
        subtitle="The latest additions to our herbal collection"
        products={newArrivals}
        bgClass="bg-light"
        autoplayDelay={3600}
      />

      <ProductSwiper
        eyebrow="Hot Right Now"
        title="Trending Products"
        subtitle="Flying off our shelves — grab yours before it's gone"
        products={trendingProducts}
        autoplayDelay={3400}
        showQuick={false}
      />

      <WhyChooseUs />
      <Testimonials />
      <BrandStory />
      <Newsletter />
      <InstagramGrid />
      <CtaBand />
    </>
  )
}