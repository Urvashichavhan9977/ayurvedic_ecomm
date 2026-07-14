import React, { useEffect, useState } from 'react'
import { instaImages } from '../data/products.js'
import { fetchActiveInstagramPosts } from '../admin/api/instagramApi'
import '../styles/InstagramGrid.css'

const FALLBACK_ITEMS = instaImages.map((item) => ({ imageUrl: item.img, postLink: '#' }))

export default function InstagramGrid() {
  const [items, setItems] = useState(FALLBACK_ITEMS)

  useEffect(() => {
    let isMounted = true
    fetchActiveInstagramPosts()
      .then((res) => {
        if (!isMounted) return
        const posts = res && res.posts ? res.posts : []
        if (posts.length > 0) setItems(posts)
      })
      .catch(() => {})
    return () => { isMounted = false }
  }, [])

  const trackItems = items.length > 0 ? items.concat(items) : []

  function InstaLink(props) {
    const item = props.item
    const linkProps = {
      href: item.postLink || '#',
      className: 'insta-item'
    }
    if (item.postLink) {
      linkProps.target = '_blank'
      linkProps.rel = 'noopener noreferrer'
    }
    return (
      React.createElement('a', linkProps,
        React.createElement('img', { src: item.imageUrl, alt: item.caption || '', loading: 'lazy' })
      )
    )
  }

  return (
    <section className="insta-section">
      <div className="container">
        <div className="sec-head">
          <span className="eyebrow">@amrita.ayurveda</span>
          <h2>Instagram Gallery</h2>
          <p>Follow us for daily Ayurvedic rituals &amp; product inspiration</p>
        </div>
      </div>

      <div className="insta-marquee-wrap">
        <div className="insta-marquee-track">
          {trackItems.map(function (item, i) {
            const linkKey = (item._id || item.imageUrl || 'insta') + '-' + i
            return <InstaLink key={linkKey} item={item} />
          })}
        </div>
      </div>
    </section>
  )
}
