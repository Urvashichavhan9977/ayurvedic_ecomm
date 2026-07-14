import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { siteSettingsApi } from '../api/siteSettingsApi'
import '../styles/BrandStory.css'

const STORY_FALLBACK = {
  eyebrow: 'Brand Story',
  title: 'From Himalayan kitchens to your shelf',
  para1: 'Amrita began where remedies were prepared by hand, passed through generations. We carry that devotion into every jar.',
  para2: 'Partnering with organic farmers, we source rare herbs at peak potency — never diluted, never rushed.',
  tags: ['Family Recipes', 'Small Batch', 'Farmer Partnered', 'Plastic-Free'],
  videoUrl: 'herbs.mp4',
  ctaText: 'Our Full Story',
  ctaLink: '/about',
}

export default function BrandStory() {
  // Admin-editable via Admin Panel -> Storefront -> Home Content. Falls
  // back to the bundled defaults instantly and while the request is in
  // flight, so the section never renders empty.
  const [story, setStory] = useState(STORY_FALLBACK)

  useEffect(() => {
    let cancelled = false
    siteSettingsApi
      .getHomeContent()
      .then((res) => {
        if (!cancelled && res.homeContent?.brandStory) {
          setStory((prev) => ({ ...prev, ...res.homeContent.brandStory }))
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
    <section className="section">
      <div className="container story-grid">
        <div className="story-video">
          <iframe
            src={story.videoUrl}
            title="Amrita Brand Story"
            allowFullScreen
            allow="autoplay"
            loading="lazy"
          />
        </div>
        <div className="story-text">
          <span className="eyebrow">{story.eyebrow}</span>
          <h2>{story.title}</h2>
          <p>{story.para1}</p>
          <p>{story.para2}</p>
          <div className="pill-tags">
            {(story.tags || []).map(tag => (
              <span key={tag} className="pill-tag">{tag}</span>
            ))}
          </div>
          <Link to={story.ctaLink || '/about'} className="btn btn-green">{story.ctaText}</Link>
        </div>
      </div>
    </section>
  )
}