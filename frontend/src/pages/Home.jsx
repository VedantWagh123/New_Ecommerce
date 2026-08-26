import React from 'react'
import Hero from '../components/Hero'
import BrandStory from '../components/BrandStory'
import CategorySection from '../components/CategorySection'
import FeaturedProducts from '../components/FeaturedProducts'
import LatestCollection from '../components/LatestCollection'
import TrendingProducts from '../components/TrendingProducts'
import EditorialSection from '../components/EditorialSection'
import BestSeller from '../components/BestSeller'
import OurPolicy from '../components/OurPolicy'
import NewsletterBox from '../components/NewsletterBox'
import FlashSaleSection from '../components/FlashSaleSection'
import StoryHighlights from '../components/StoryHighlights'

const Home = () => {
  return (
    <div>
      <StoryHighlights />
      <Hero />
      <FlashSaleSection />
      <BrandStory />
      <CategorySection />
      <FeaturedProducts />
      <LatestCollection />
      <TrendingProducts />
      <EditorialSection />
      <BestSeller />
      <OurPolicy />
      <NewsletterBox />
    </div>
  )
}

export default Home
