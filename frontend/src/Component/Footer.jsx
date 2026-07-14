import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaInstagram, FaFacebookF, FaYoutube, FaTwitter } from 'react-icons/fa'
import { FiChevronDown } from 'react-icons/fi'
import { siteSettingsApi } from '../api/siteSettingsApi'
import '../styles/Footer.css'

const footerColumns = [
  {
    title: 'Shop',
    links: [
      { label: 'All Products', to: '/shop' },
      { label: 'Hair Care', to: '/shop?category=hair-care' },
      { label: 'Immunity', to: '/shop?category=immunity' },
      { label: 'Skincare', to: '/shop?category=skin-care' },
      { label: 'Best Sellers', to: '/shop?bestseller=true' },
      { label: "Today's Offers", to: '/shop?offer=true' },
    ],
  },
  {
    title: 'Explore',
    links: [
      { label: 'Ingredients', to: '/ingredients' },
      { label: 'About Us', to: '/about' },
      { label: 'Contact', to: '/contact' },
      { label: 'My Account', to: '/profile' },
    ],
  },
  {
    title: 'Customer Care',
    links: [
      { label: 'FAQs', to: '/contact' },
      { label: 'Shipping Policy', to: '/contact' },
      { label: 'Returns & Refunds', to: '/contact' },
      { label: 'Wholesale', to: '/contact' },
      { label: 'Track Order', to: '/contact' },
    ],
  },
]

export default function Footer() {
  // On mobile, each column behaves like an accordion — tapping the
  // title slides its links open/closed. Desktop layout is unaffected;
  // all columns stay open there (see Footer.css).
  const [openIndex, setOpenIndex] = useState(null)

  // Contact block + social links — pulled from the admin's Settings page
  // (backend: SiteSettings.contactInfo) so the footer always shows
  // whatever the admin last saved, with no code changes needed.
  const [contact, setContact] = useState(null)

  useEffect(() => {
    let cancelled = false
    siteSettingsApi
      .getContactInfo()
      .then((res) => {
        if (!cancelled) setContact(res.contactInfo)
      })
      .catch(() => {
        // Footer still works fine without live contact info.
      })
    return () => {
      cancelled = true
    }
  }, [])

  const toggleColumn = (index) => {
    setOpenIndex((prev) => (prev === index ? null : index))
  }

  return (
    <footer className="footer">
      {/* Floating decorative leaves */}
      <div className="footer-leaves" aria-hidden="true">
        <svg className="footer-leaf leaf-1" viewBox="0 0 100 100">
          <path d="M50 5 C70 15 90 35 90 55 C90 78 70 95 50 95 C30 95 10 78 10 55 C10 35 30 15 50 5 Z" fill="currentColor" />
        </svg>
        <svg className="footer-leaf leaf-2" viewBox="0 0 100 100">
          <path d="M50 5 C70 15 90 35 90 55 C90 78 70 95 50 95 C30 95 10 78 10 55 C10 35 30 15 50 5 Z" fill="currentColor" />
        </svg>
        <svg className="footer-leaf leaf-3" viewBox="0 0 100 100">
          <path d="M50 5 C70 15 90 35 90 55 C90 78 70 95 50 95 C30 95 10 78 10 55 C10 35 30 15 50 5 Z" fill="currentColor" />
        </svg>
        <svg className="footer-leaf leaf-4" viewBox="0 0 100 100">
          <path d="M50 5 C70 15 90 35 90 55 C90 78 70 95 50 95 C30 95 10 78 10 55 C10 35 30 15 50 5 Z" fill="currentColor" />
        </svg>
        <svg className="footer-leaf leaf-5" viewBox="0 0 100 100">
          <path d="M50 5 C70 15 90 35 90 55 C90 78 70 95 50 95 C30 95 10 78 10 55 C10 35 30 15 50 5 Z" fill="currentColor" />
        </svg>
      </div>

      <div className="container">
        <div className="foot-grid">

          <div className="foot-brand">
            <Link to="/" className="foot-logo">Amrita<span>.</span></Link>
            <p>Premium Ayurvedic wellness, handcrafted from pure herbs. Rooted in tradition, crafted for today.</p>
            <div className="socials">
              <a href={contact?.socials?.instagram || '#'} target={contact?.socials?.instagram ? '_blank' : undefined} rel="noreferrer" aria-label="Instagram" className="soc-link">
                <FaInstagram size={16} />
              </a>
              <a href={contact?.socials?.facebook || '#'} target={contact?.socials?.facebook ? '_blank' : undefined} rel="noreferrer" aria-label="Facebook" className="soc-link">
                <FaFacebookF size={15} />
              </a>
              <a href={contact?.socials?.youtube || '#'} target={contact?.socials?.youtube ? '_blank' : undefined} rel="noreferrer" aria-label="YouTube" className="soc-link">
                <FaYoutube size={16} />
              </a>
              <a href={contact?.socials?.twitter || '#'} target={contact?.socials?.twitter ? '_blank' : undefined} rel="noreferrer" aria-label="Twitter" className="soc-link">
                <FaTwitter size={15} />
              </a>
            </div>
          </div>

          <div className="foot-col foot-col-contact">
            <div className="foot-col-title" style={{ pointerEvents: 'none' }}>
              <h4>Get in Touch</h4>
            </div>
            <ul className="foot-col-links foot-contact-list">
              <li>{contact?.address || 'Amrita Ayurveda, Indore, Madhya Pradesh, India'}</li>
              <li><a href={`tel:${(contact?.phone || '+91 98765 43210').replace(/\s+/g, '')}`}>{contact?.phone || '+91 98765 43210'}</a></li>
              <li><a href={`mailto:${contact?.email || 'support@amritaayurveda.com'}`}>{contact?.email || 'support@amritaayurveda.com'}</a></li>
              <li>{contact?.businessHours || 'Mon - Sat, 9:00 AM - 6:00 PM'}</li>
            </ul>
          </div>

          {footerColumns.map((col, index) => {
            const isOpen = openIndex === index
            return (
              <div className={`foot-col ${isOpen ? 'is-open' : ''}`} key={col.title}>
                <button
                  type="button"
                  className="foot-col-title"
                  onClick={() => toggleColumn(index)}
                  aria-expanded={isOpen}
                >
                  <h4>{col.title}</h4>
                  <FiChevronDown className="foot-col-chevron" aria-hidden="true" size={14} />
                </button>
                <ul className="foot-col-links">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link to={link.to} onClick={() => setOpenIndex(null)}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}

        </div>

        <div className="foot-pay">
          <span>We Accept:</span>
          <div className="pay-icons">
            {['VISA','MC','UPI','Paytm','RuPay','NetBank'].map(p => (
              <span key={p} className="pay-badge">{p}</span>
            ))}
          </div>
        </div>

        <div className="foot-bottom">
          <span>© 2026 Amrita Ayurveda. All rights reserved.</span>
          <div className="foot-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Use</a>
            <a href="#">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
