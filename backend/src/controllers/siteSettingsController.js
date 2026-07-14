const SiteSettings = require('../models/SiteSettings');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get the current site-wide theme
// @route   GET /api/v1/settings/theme
// @access  Public (the customer storefront polls this to stay in sync)
const getTheme = asyncHandler(async (req, res) => {
  const settings = await SiteSettings.getSingleton();
  res.status(200).json({ success: true, theme: settings.theme });
});

// @desc    Update the site-wide theme — this single value drives both the
//          admin panel's own look and the live customer storefront for
//          every visitor.
// @route   PUT /api/v1/settings/theme
// @access  Private (admin, superadmin)
const updateTheme = asyncHandler(async (req, res) => {
  const { theme } = req.body;

  if (!['light', 'dark'].includes(theme)) {
    return res.status(400).json({
      success: false,
      message: "Theme must be either 'light' or 'dark'.",
    });
  }

  const settings = await SiteSettings.getSingleton();
  settings.theme = theme;
  await settings.save();

  res.status(200).json({ success: true, theme: settings.theme });
});

// @desc    Get the storefront's "Contact Us" info (email, phone, address,
//          map embed, business hours, social links).
// @route   GET /api/v1/settings/contact-info
// @access  Public (the storefront /contact page reads this on load)
const getContactInfo = asyncHandler(async (req, res) => {
  const settings = await SiteSettings.getSingleton();
  res.status(200).json({ success: true, contactInfo: settings.contactInfo });
});

// @desc    Update the storefront's "Contact Us" info — edited by the admin
//          on the Settings page, instantly reflected on the live site.
// @route   PUT /api/v1/settings/contact-info
// @access  Private (admin, superadmin)
const updateContactInfo = asyncHandler(async (req, res) => {
  const { email, phone, address, whatsapp, mapEmbedUrl, businessHours, socials } = req.body;

  const settings = await SiteSettings.getSingleton();

  if (email !== undefined) settings.contactInfo.email = email;
  if (phone !== undefined) settings.contactInfo.phone = phone;
  if (address !== undefined) settings.contactInfo.address = address;
  if (whatsapp !== undefined) settings.contactInfo.whatsapp = whatsapp;
  if (mapEmbedUrl !== undefined) settings.contactInfo.mapEmbedUrl = mapEmbedUrl;
  if (businessHours !== undefined) settings.contactInfo.businessHours = businessHours;
  if (socials && typeof socials === 'object') {
    settings.contactInfo.socials = {
      ...settings.contactInfo.socials.toObject?.() ?? settings.contactInfo.socials,
      ...socials,
    };
  }

  await settings.save();

  res.status(200).json({ success: true, contactInfo: settings.contactInfo });
});

// @desc    Get the storefront's home-page content (Why Choose Us, Features
//          Strip, Testimonials, Brand Story, CTA Band).
// @route   GET /api/v1/settings/home-content
// @access  Public (the storefront home page reads this on load)
const getHomeContent = asyncHandler(async (req, res) => {
  const settings = await SiteSettings.getSingleton();
  res.status(200).json({ success: true, homeContent: settings.homeContent });
});

// @desc    Update the storefront's home-page content — edited from the
//          admin "Home Content" page, instantly reflected on the live site.
// @route   PUT /api/v1/settings/home-content
// @access  Private (admin, superadmin)
const updateHomeContent = asyncHandler(async (req, res) => {
  const { whyUs, features, testimonials, brandStory, ctaBand } = req.body;

  const settings = await SiteSettings.getSingleton();

  if (Array.isArray(whyUs)) settings.homeContent.whyUs = whyUs;
  if (Array.isArray(features)) settings.homeContent.features = features;
  if (Array.isArray(testimonials)) settings.homeContent.testimonials = testimonials;
  if (brandStory && typeof brandStory === 'object') {
    settings.homeContent.brandStory = {
      ...(settings.homeContent.brandStory.toObject?.() ?? settings.homeContent.brandStory),
      ...brandStory,
    };
  }
  if (ctaBand && typeof ctaBand === 'object') {
    settings.homeContent.ctaBand = {
      ...(settings.homeContent.ctaBand.toObject?.() ?? settings.homeContent.ctaBand),
      ...ctaBand,
    };
  }

  await settings.save();

  res.status(200).json({ success: true, homeContent: settings.homeContent });
});

module.exports = {
  getTheme,
  updateTheme,
  getContactInfo,
  updateContactInfo,
  getHomeContent,
  updateHomeContent,
};