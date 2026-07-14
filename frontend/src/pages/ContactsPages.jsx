import { useState, useEffect } from 'react'
import { contactsApi } from '../api/contactsApi'
import { siteSettingsApi } from '../api/siteSettingsApi'
import * as LucideIcons from 'lucide-react'
import '../styles/pages/Contacts.css'

// Fallback content shown instantly (and if the API call fails) so the page
// never looks empty. Once the admin saves Home Content in the admin panel
// (Storefront -> Home Content), these are replaced by the live data below.
const WHY_US_FALLBACK = [
  { icon: 'Award', title: 'Certified Ayurveda', desc: 'Formulated and tested under recognized Ayurvedic standards.' },
  { icon: 'Leaf', title: '100% Natural Herbs', desc: 'No synthetic fillers — every batch traced back to the source herb.' },
  { icon: 'Heart', title: 'Doctor Consultation', desc: 'Talk to a registered Ayurveda practitioner before you order.' },
  { icon: 'Truck', title: 'Fast Delivery', desc: 'Pan-India shipping, dispatched within 24 hours of your order.' },
]

const TESTIMONIALS_FALLBACK = [
  { name: 'Priya S.', quote: 'My skin cleared up within a month of using their products. Genuinely natural ingredients.' },
  { name: 'Rahul M.', quote: 'Very effective Ayurvedic products — the immunity kit made a real difference for my family.' },
  { name: 'Ananya K.', quote: 'Fast delivery and the doctor consultation call helped me pick the right course for my skin type.' },
  { name: 'Vikram T.', quote: 'Been ordering for 6 months now — consistent quality and the customer support genuinely cares.' },
]

function WhyUsIcon({ name }) {
  const Icon = LucideIcons[name]
  return Icon ? <Icon size={26} strokeWidth={1.6} /> : <LucideIcons.Leaf size={26} strokeWidth={1.6} />
}

const FAQS = [
  { q: 'How long does delivery take?', a: 'Most orders across India are delivered within 3–6 business days of dispatch.' },
  { q: 'Is Cash on Delivery available?', a: 'Yes, COD is available on eligible pin codes at checkout.' },
  { q: 'Are the products 100% natural?', a: 'Yes, our formulations use natural herbal ingredients with no harmful synthetic additives.' },
  { q: 'Can I return a product?', a: 'Unopened products can be returned within 7 days of delivery — see our Returns Policy for details.' },
]

export default function ContactsPages() {
  const [form, setForm] = useState({
    fname: '',
    lname: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState(null) // { type: 'success' | 'error', text: string }

  // Contact info shown in the sidebar — pulled from the admin's Settings
  // page (backend: SiteSettings.contactInfo) so it stays in sync with
  // whatever the admin last saved, with no code changes needed.
  const [info, setInfo] = useState(null)

  // "Why Choose Us" cards and testimonials — pulled from the admin's Home
  // Content page (backend: SiteSettings.homeContent) so editing them once
  // in the admin panel updates both the homepage and this Contact page.
  const [whyUs, setWhyUs] = useState(WHY_US_FALLBACK)
  const [testimonials, setTestimonials] = useState(TESTIMONIALS_FALLBACK)

  // FAQ accordion — purely UI state, not tied to any API
  const [openFaq, setOpenFaq] = useState(0)

  // Newsletter — local-only for now, see note near the form below
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterStatus, setNewsletterStatus] = useState(null)

  useEffect(() => {
    let cancelled = false
    siteSettingsApi
      .getContactInfo()
      .then((res) => {
        if (!cancelled) setInfo(res.contactInfo)
      })
      .catch(() => {
        // Silently fall back to no sidebar info if the request fails —
        // the form itself still works either way.
      })
    siteSettingsApi
      .getHomeContent()
      .then((res) => {
        if (cancelled) return
        if (res.homeContent?.whyUs?.length) setWhyUs(res.homeContent.whyUs)
        if (res.homeContent?.testimonials?.length) setTestimonials(res.homeContent.testimonials)
      })
      .catch(() => {
        // Keep the fallback arrays above if this request fails.
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setStatus(null)
    try {
      await contactsApi.send(form)
      setStatus({ type: 'success', text: 'Thanks! Your message has been sent — we will get back to you soon.' })
      setForm({ fname: '', lname: '', email: '', phone: '', subject: '', message: '' })
    } catch (err) {
      setStatus({ type: 'error', text: err.message || 'Something went wrong. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  // NOTE: no backend route exists for newsletter signups yet, so this just
  // gives UI feedback. Wire it up to your own API (e.g. contactsApi.subscribe
  // or a new siteSettingsApi endpoint) whenever that's ready.
  const handleNewsletterSubmit = (e) => {
    e.preventDefault()
    if (!newsletterEmail) return
    setNewsletterStatus('Thanks for subscribing! Health tips are on the way.')
    setNewsletterEmail('')
  }

  const socialLinks = info?.socials
    ? Object.entries(info.socials).filter(([, url]) => url)
    : []

  return (
    <div className="contact-page">
      {/* ── 1. Hero ── */}
      <section className="contact-hero">
        <span className="hero-leaf leaf-1">
          <svg viewBox="0 0 24 24" width="34" height="34"><path d="M12 22s7-4.5 7-11a7 7 0 00-14 0c0 6.5 7 11 7 11z" fill="currentColor" /></svg>
        </span>
        <span className="hero-leaf leaf-2">
          <svg viewBox="0 0 24 24" width="26" height="26"><path d="M12 22s7-4.5 7-11a7 7 0 00-14 0c0 6.5 7 11 7 11z" fill="currentColor" /></svg>
        </span>
        <span className="hero-leaf leaf-3">
          <svg viewBox="0 0 24 24" width="30" height="30"><path d="M12 22s7-4.5 7-11a7 7 0 00-14 0c0 6.5 7 11 7 11z" fill="currentColor" /></svg>
        </span>
        <span className="hero-leaf leaf-4">
          <svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 22s7-4.5 7-11a7 7 0 00-14 0c0 6.5 7 11 7 11z" fill="currentColor" /></svg>
        </span>
        <span className="hero-leaf leaf-5">
          <svg viewBox="0 0 24 24" width="28" height="28"><path d="M12 22s7-4.5 7-11a7 7 0 00-14 0c0 6.5 7 11 7 11z" fill="currentColor" /></svg>
        </span>

        <div className="container contact-hero-inner">
          <p className="eyebrow">Get In Touch</p>
          <h1>Contact Our Ayurveda Experts</h1>
          <p>Your journey to natural wellness starts here — we're here to answer your questions and help you choose the right Ayurvedic products.</p>
          
        </div>
      </section>

      {/* ── 2. Contact info cards ── */}
      <section className="container contact-cards-section">
        <div className="contact-cards-grid">
          <div className="info-card">
            <div className="ic-wrap">
              <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
            </div>
            <div>
              <h3>Address</h3>
              <p>{info?.address || 'Amrita Ayurveda, Indore, Madhya Pradesh, India'}</p>
            </div>
          </div>

          <div className="info-card">
            <div className="ic-wrap">
              <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.68 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.32 1.85.55 2.81.68A2 2 0 0122 16.92z" /></svg>
            </div>
            <div>
              <h3>Phone</h3>
              <p>{info?.phone || '+91 98765 43210'}</p>
              {info?.whatsapp && <p className="note-gold">WhatsApp: {info.whatsapp}</p>}
            </div>
          </div>

          <div className="info-card">
            <div className="ic-wrap">
              <svg viewBox="0 0 24 24"><path d="M22 6l-10 7L2 6" /><path d="M2 6h20v12H2z" /></svg>
            </div>
            <div>
              <h3>Email</h3>
              <p>{info?.email || 'support@amritaayurveda.com'}</p>
            </div>
          </div>

          <div className="info-card">
            <div className="ic-wrap">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
            </div>
            <div>
              <h3>Working Hours</h3>
              <p>{info?.businessHours || 'Mon - Sat, 9:00 AM - 6:00 PM'}</p>
            </div>
          </div>
        </div>

        {socialLinks.length > 0 && (
          <div className="contact-socials contact-socials-center">
            {socialLinks.map(([name, url]) => (
              <a key={name} href={url} target="_blank" rel="noopener noreferrer" aria-label={name}>
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /></svg>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* ── 3. Form + image ── */}
      <section className="container contact-body" id="contact-form">
        <div className="contact-grid">
          <div className="form-card">
            <h3>Send us a Message</h3>
            <p className="sub">Fill out the form below and our team will reach out shortly.</p>

            <form onSubmit={handleSubmit}>
              {status && (
                <div className={status.type === 'success' ? 'form-success' : 'contact-alert contact-alert-error'}>
                  {status.text}
                </div>
              )}

              <div className="form-row">
                <div className="field">
                  <label htmlFor="fname">First Name</label>
                  <input
                    id="fname"
                    name="fname"
                    type="text"
                    required
                    value={form.fname}
                    onChange={handleChange}
                  />
                </div>
                <div className="field">
                  <label htmlFor="lname">Last Name</label>
                  <input
                    id="lname"
                    name="lname"
                    type="text"
                    value={form.lname}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="field">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="field">
                  <label htmlFor="phone">Phone</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="subject">Subject</label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  placeholder="General Inquiry"
                  value={form.subject}
                  onChange={handleChange}
                />
              </div>

              <div className="field">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  required
                  value={form.message}
                  onChange={handleChange}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Sending…' : 'Send Message'}
              </button>
            </form>
          </div>

          {/* Decorative side panel — swap the SVG below for a real photo
              (e.g. <img src="/images/contact-herbs.jpg" alt="Ayurvedic herbs" />)
              whenever you have an asset ready. */}
          <div className="contact-side-visual">
            {info?.mapEmbedUrl ? null : null}
            <div className="side-visual-card">
              <svg viewBox="0 0 200 240" className="side-visual-art">
                <ellipse cx="100" cy="210" rx="70" ry="14" fill="rgba(0,0,0,0.08)" />
                <path d="M60 190 Q55 140 65 100 Q75 60 100 30 Q125 60 135 100 Q145 140 140 190 Z" fill="#c8e6c9" />
                <path d="M100 30 Q95 90 100 190" stroke="#4d8362" strokeWidth="2" fill="none" />
                <ellipse cx="80" cy="80" rx="14" ry="26" fill="#4d8362" transform="rotate(-25 80 80)" />
                <ellipse cx="120" cy="80" rx="14" ry="26" fill="#4d8362" transform="rotate(25 120 80)" />
                <ellipse cx="70" cy="130" rx="12" ry="22" fill="#4d8362" transform="rotate(-20 70 130)" />
                <ellipse cx="130" cy="130" rx="12" ry="22" fill="#4d8362" transform="rotate(20 130 130)" />
                <circle cx="100" cy="200" r="24" fill="#e8f5e9" stroke="#c8a951" strokeWidth="2" />
              </svg>
              <p>Every remedy, rooted in tradition — crafted with herbs sourced straight from the soil.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Why Choose Us ── */}
      <section className="container why-amrita-section">
        <div className="section-heading">
          <p className="eyebrow eyebrow-dark">Why Choose Us</p>
          <h2>Why Choose Amrita Ayurveda</h2>
        </div>
        <div className="why-amrita-grid">
          {whyUs.map((item) => (
            <div className="why-amrita-card" key={item.title}>
              <div className="icon-wrap"><WhyUsIcon name={item.icon} /></div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. Testimonials ── */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-heading section-heading-light">
            <p className="eyebrow">Customer Love</p>
            <h2>What Our Customers Say</h2>
          </div>
          <div className="testimonials-marquee">
            <div className="testimonials-track">
              {[...testimonials, ...testimonials].map((t, idx) => (
                <div className="testimonial-card" key={`${t.name}-${idx}`}>
                  <div className="stars" aria-hidden="true">
                    {'★'.repeat(t.rating || 5)}{'☆'.repeat(5 - (t.rating || 5))}
                  </div>
                  <p>"{t.quote}"</p>
                  <span className="testimonial-name">{t.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. FAQ ── */}
      <section className="container faq-section">
        <div className="section-heading">
          <p className="eyebrow eyebrow-dark">FAQ</p>
          <h2>Frequently Asked Questions</h2>
        </div>
        <div className="faq-list">
          {FAQS.map((item, idx) => (
            <div className={`faq-item ${openFaq === idx ? 'faq-item-open' : ''}`} key={item.q}>
              <button
                type="button"
                className="faq-question"
                onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                aria-expanded={openFaq === idx}
              >
                {item.q}
                <span className="faq-icon">{openFaq === idx ? '−' : '+'}</span>
              </button>
              {openFaq === idx && <div className="faq-answer">{item.a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ── 7. Map ── */}
      <section className="container map-section">
        <div className="map-wrap">
          <iframe
            title="Our Location"
            src={info?.mapEmbedUrl || 'https://maps.google.com/maps?q=TECAI+Software+%26+AI+Automation+Company,+3rd+Floor,+Mishika+Tower,+201,+Sapna+Sangeeta+Rd,+Sarvoday+Nagar,+Indore,+Madhya+Pradesh+452001&ll=22.6999927,75.8672425&z=17&t=&ie=UTF8&iwloc=&output=embed'}
            width="100%"
            height="360"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>

      {/* ── 8. Newsletter ── */}
      <section className="newsletter-section">
        <div className="container newsletter-inner">
          <h2>Get Ayurvedic Health Tips</h2>
          <p>Join our list for seasonal wellness routines, herb spotlights, and early access to new launches.</p>
          <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
            <input
              type="email"
              placeholder="Enter your email"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              required
              aria-label="Email address"
            />
            <button type="submit" className="btn btn-gold">Subscribe</button>
          </form>
          {newsletterStatus && <p className="newsletter-status">{newsletterStatus}</p>}
        </div>
      </section>
    </div>
  )
}