const mongoose = require('mongoose');

/**
 * Single-document collection holding site-wide settings.
 * Stores the global theme ('light' | 'dark') as well as the storefront's
 * "Contact Us" info (email, phone, address, map embed, social links) —
 * all editable from the admin Settings page and read by the public
 * customer storefront so both surfaces stay in sync for every visitor.
 */
const SiteSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'global',
      unique: true,
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light',
    },

    contactInfo: {
      email: { type: String, trim: true, default: 'support@amritaayurveda.com' },
      phone: { type: String, trim: true, default: '+91 98765 43210' },
      address: { type: String, trim: true, default: 'Amrita Ayurveda, Indore, Madhya Pradesh, India' },
      whatsapp: { type: String, trim: true, default: '' },
      mapEmbedUrl: { type: String, trim: true, default: '' },
      businessHours: { type: String, trim: true, default: 'Mon - Sat, 9:00 AM - 6:00 PM' },
      socials: {
        instagram: { type: String, trim: true, default: '' },
        facebook: { type: String, trim: true, default: '' },
        youtube: { type: String, trim: true, default: '' },
        twitter: { type: String, trim: true, default: '' },
      },
    },

    // ── Home Page Content ──────────────────────────────────────────────
    // Powers the storefront's "Why Choose Us", "Features Strip",
    // "Testimonials", "Brand Story" and "CTA Band" sections. Editable from
    // the admin "Home Content" page, read publicly by the storefront so
    // both stay in sync. `icon` fields hold a lucide-react icon name
    // (e.g. "Leaf", "Truck") already used elsewhere in this codebase.
    homeContent: {
      whyUs: {
        type: [
          {
            icon: { type: String, trim: true, default: 'Leaf' },
            title: { type: String, trim: true, required: true },
            desc: { type: String, trim: true, default: '' },
          },
        ],
        default: [
          { icon: 'Leaf', title: '100% Natural', desc: 'Every ingredient from certified organic farms — no synthetics, ever.' },
          { icon: 'FlaskConical', title: 'Chemical Free', desc: 'Zero harmful chemicals, preservatives or artificial fragrances.' },
          { icon: 'Truck', title: 'Fast Delivery', desc: 'Pan-India delivery in 2–5 days. Express shipping for major cities.' },
          { icon: 'Lock', title: 'Secure Payment', desc: 'Bank-grade encryption. UPI, cards, wallets — all accepted safely.' },
          { icon: 'Award', title: 'Certified Products', desc: 'FSSAI, Ayush, ISO certified. Every batch lab-tested for you.' },
          { icon: 'RotateCcw', title: 'Easy Returns', desc: 'Return within 7 days. No questions asked, full refund guaranteed.' },
        ],
      },
      features: {
        type: [
          {
            icon: { type: String, trim: true, default: 'Leaf' },
            title: { type: String, trim: true, required: true },
            sub: { type: String, trim: true, default: '' },
          },
        ],
        default: [
          { icon: 'Leaf', title: '100% Natural', sub: 'Pure herbs, no chemicals' },
          { icon: 'BadgeCheck', title: 'Lab Certified', sub: 'Every batch tested' },
          { icon: 'Truck', title: 'Free Shipping', sub: 'Orders above ₹999' },
          { icon: 'CreditCard', title: 'Secure Payment', sub: '100% safe checkout' },
          { icon: 'RotateCcw', title: 'Easy Returns', sub: '7-day hassle-free' },
        ],
      },
      testimonials: {
        type: [
          {
            name: { type: String, trim: true, required: true },
            location: { type: String, trim: true, default: '' },
            quote: { type: String, trim: true, required: true },
            rating: { type: Number, min: 1, max: 5, default: 5 },
          },
        ],
        default: [
          { name: 'Priya Sharma', location: 'Mumbai', rating: 5, quote: 'Bhringraj oil transformed my hair fall completely. Pure, authentic and smells divine. My hair grew noticeably thicker in just 2 months!' },
          { name: 'Rahul Mehta', location: 'Delhi', rating: 5, quote: "Chyawanprash tastes exactly like my grandmother used to make. My whole family's daily immunity ritual now." },
          { name: 'Ananya Reddy', location: 'Hyderabad', rating: 5, quote: 'Kumkumadi cream gave me visible glow in just 3 weeks. Premium quality at such reasonable prices.' },
          { name: 'Vikram Kumar', location: 'Bangalore', rating: 5, quote: 'Ashwagandha capsules helped me sleep better and manage stress at work. Highly recommend!' },
        ],
      },
      brandStory: {
        eyebrow: { type: String, trim: true, default: 'Brand Story' },
        title: { type: String, trim: true, default: 'From Himalayan kitchens to your shelf' },
        para1: { type: String, trim: true, default: 'Amrita began where remedies were prepared by hand, passed through generations. We carry that devotion into every jar.' },
        para2: { type: String, trim: true, default: 'Partnering with organic farmers, we source rare herbs at peak potency — never diluted, never rushed.' },
        tags: { type: [String], default: ['Family Recipes', 'Small Batch', 'Farmer Partnered', 'Plastic-Free'] },
        videoUrl: { type: String, trim: true, default: 'herbs.mp4' },
        ctaText: { type: String, trim: true, default: 'Our Full Story' },
        ctaLink: { type: String, trim: true, default: '/about' },
      },
      ctaBand: {
        title: { type: String, trim: true, default: 'Begin your wellness journey' },
        subtitle: { type: String, trim: true, default: 'Explore handcrafted Ayurvedic rituals for everyday balance.' },
        buttonText: { type: String, trim: true, default: 'Shop Now' },
        buttonLink: { type: String, trim: true, default: '/shop' },
      },
    },
  },
  { timestamps: true }
);

// Returns the one-and-only settings document, creating it with defaults
// the first time it's requested.
SiteSettingsSchema.statics.getSingleton = async function getSingleton() {
  let doc = await this.findOne({ key: 'global' });
  if (!doc) {
    doc = await this.create({ key: 'global' });
  }
  return doc;
};

module.exports = mongoose.model('SiteSettings', SiteSettingsSchema);