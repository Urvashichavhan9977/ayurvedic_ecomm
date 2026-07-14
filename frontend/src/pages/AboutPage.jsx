import { Link } from 'react-router-dom'
import { Leaf, Sprout } from 'lucide-react'
import '../styles/pages/About.css'
import heroVideo from "../assets/images/insta/about.mp4";

const values = [
  {
    title: 'Purity First',
    desc: 'No fillers, no synthetics. Just whole herbs in their truest form, exactly as nature intended.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    title: 'Sustainability',
    desc: 'Ethically harvested ingredients and compostable, earth-friendly packaging across our range.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" />
        <line x1="15" y1="9" x2="15.01" y2="9" />
      </svg>
    ),
  },
  {
    title: 'Honest Craft',
    desc: 'Transparent sourcing and traditional methods that honour both the herb and the maker.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
]

const stats = [
  { num: '5k+', title: 'Customers', desc: 'Across India and beyond.' },
  { num: '40+', title: 'Herbal Blends', desc: 'Crafted in small batches.' },
  { num: '120', title: 'Farmers', desc: 'Partnered and paid fairly.' },
  { num: '100%', title: 'Natural', desc: 'In every single product.' },
]

export default function AboutPage() {
  return (
    <>
      <section className="about-hero">
        {/* floating decorative herbs */}
        <div className="hero-leaf leaf-1"><Leaf size={34} /></div>
        <div className="hero-leaf leaf-2"><Sprout size={28} /></div>
        <div className="hero-leaf leaf-3"><Leaf size={40} /></div>
        <div className="hero-leaf leaf-4"><Sprout size={26} /></div>
        <div className="hero-leaf leaf-5"><Leaf size={22} /></div>

        <div className="container">
          <span className="eyebrow">Our Story</span>
          <h1>Rooted in Tradition</h1>
          <p>We exist to bring authentic Ayurveda into modern life — one pure, handcrafted ritual at a time.</p>
        </div>
      </section>

      <section className="section">
        <div className="container about-split">
          <video
            src={heroVideo}
            autoPlay
            muted
            loop
            playsInline
            controls={false}
            disablePictureInPicture
            aria-label="Amrita Ayurveda sourcing"
          />
          <div>
            <span className="eyebrow">From a Family Kitchen</span>
            <h2>To your shelf</h2>
            <p>
              Amrita began in a small Himalayan town where remedies were prepared by hand, passed
              down through generations. We carry that same devotion into every jar we make today.
            </p>
            <p>
              Working directly with organic farmers, we source rare herbs at their peak and craft
              them slowly to keep their natural potency alive — never diluted, never rushed.
            </p>
            <div className="pill-tags">
              {['Family Recipes', 'Small Batch', 'Farmer Partnered', 'Plastic-Free'].map(tag => (
                <span key={tag} className="pill-tag">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section bg-light">
        <div className="container">
          <div className="sec-head">
            <span className="eyebrow">What We Stand For</span>
            <h2>Our Values</h2>
          </div>
          <div className="values-grid">
            {values.map(v => (
              <div className="value-card" key={v.title}>
                <div className="ic">{v.icon}</div>
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="sec-head">
            <span className="eyebrow">By The Numbers</span>
            <h2>A Growing Ritual</h2>
          </div>
          <div className="about-stats">
            {stats.map(s => (
              <div className="about-stat" key={s.title}>
                <span className="num">{s.num}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-sm">
        <div className="container">
          <div className="cta-band">
            <div>
              <h2>Begin your wellness journey</h2>
              <p>Explore our handcrafted collection and find your daily ritual.</p>
            </div>
            <Link to="/shop" className="btn btn-gold">Shop Now</Link>
          </div>
        </div>
      </section>
    </>
  )
}