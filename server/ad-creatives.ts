/**
 * tatooo.shop Ad Creatives Registry
 * All 7 creatives uploaded to CDN — ready for use in campaigns, social posts, and email outreach.
 * Format: portrait (9:16 / 512x1024) and landscape (3:2 / 768x512)
 */

export type AdCreative = {
  id: string;
  name: string;
  headline: string;
  subheadline: string;
  cta: string;
  targetAudience: "consumer" | "artist" | "both";
  format: "portrait" | "landscape";
  url: string;
  /** Suggested channels for this creative */
  channels: string[];
  /** UTM campaign tag */
  utmCampaign: string;
};

export const AD_CREATIVES: AdCreative[] = [
  // ── Portrait creatives (9:16 — ideal for Instagram Stories, TikTok, Facebook Stories) ──
  {
    id: "p1-design-dream-tattoo",
    name: "Design Your Dream Tattoo with AI",
    headline: "Design Your Dream Tattoo with AI",
    subheadline: "Find Your Perfect Artist",
    cta: "Book Now",
    targetAudience: "consumer",
    format: "portrait",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663418605762/Pa7E4RBX4UbpFBvKpz2nxk/ad-p1-design-dream-tattoo_aec0e002.png",
    channels: ["instagram_stories", "tiktok", "facebook_stories", "snapchat"],
    utmCampaign: "dream-tattoo-ai-portrait",
  },
  {
    id: "p2-get-inked-artists",
    name: "Get Inked by Top Local Artists",
    headline: "Get Inked by Top Local Artists",
    subheadline: "Join the #1 Tattoo Platform — 15% First Booking Commission",
    cta: "Join Now",
    targetAudience: "artist",
    format: "portrait",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663418605762/Pa7E4RBX4UbpFBvKpz2nxk/ad-p2-get-inked-artists_bd21e791.png",
    channels: ["instagram_stories", "tiktok", "facebook_stories"],
    utmCampaign: "artist-join-portrait",
  },
  {
    id: "p3-create-book-one-place",
    name: "Create & Book Your Tattoo in One Place",
    headline: "Create & Book Your Tattoo in One Place!",
    subheadline: "Start Now at tatooo.shop — Find Your Artist",
    cta: "Find Your Artist",
    targetAudience: "consumer",
    format: "portrait",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663418605762/Pa7E4RBX4UbpFBvKpz2nxk/ad-p3-create-book-one-place_0d676dca.png",
    channels: ["instagram_stories", "tiktok", "pinterest"],
    utmCampaign: "create-book-one-place-portrait",
  },

  // ── Landscape creatives (3:2 — ideal for Facebook Feed, Google Display, Twitter/X, LinkedIn) ──
  {
    id: "l1-design-tattoo-ideas-ai",
    name: "Design Your Tattoo Ideas with AI",
    headline: "Design Your Tattoo Ideas with AI",
    subheadline: "Find Your Perfect Artist! — 15% First Booking Commission",
    cta: "Start Now",
    targetAudience: "both",
    format: "landscape",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663418605762/Pa7E4RBX4UbpFBvKpz2nxk/ad-l1-design-tattoo-ideas-ai_3f2a99e5.png",
    channels: ["facebook_feed", "google_display", "twitter", "reddit"],
    utmCampaign: "tattoo-ideas-ai-landscape",
  },
  {
    id: "l2-ai-designs-verified-artists",
    name: "AI Designs Your Tattoo — Verified Artists",
    headline: "AI Designs Your Tattoo",
    subheadline: "We Connect You to Verified Artists — $99/Year to Join + 15% Commission on Bookings",
    cta: "Get Inked Today",
    targetAudience: "both",
    format: "landscape",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663418605762/Pa7E4RBX4UbpFBvKpz2nxk/ad-l2-ai-designs-verified-artists_435734d1.png",
    channels: ["facebook_feed", "google_display", "instagram_feed"],
    utmCampaign: "ai-verified-artists-landscape",
  },
  {
    id: "l3-create-dream-tattoo",
    name: "Create Your Dream Tattoo with AI",
    headline: "Create Your Dream Tattoo with AI",
    subheadline: "Find Your Artist on tatooo.shop — $99/Year to Join + 15% Commission on Bookings",
    cta: "Get Inked Today",
    targetAudience: "artist",
    format: "landscape",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663418605762/Pa7E4RBX4UbpFBvKpz2nxk/ad-l3-create-dream-tattoo_aa614443.png",
    channels: ["facebook_feed", "google_display", "instagram_feed", "pinterest"],
    utmCampaign: "create-dream-tattoo-landscape",
  },
  {
    id: "l4-design-book-one-place",
    name: "Design & Book Your Tattoo in One Place",
    headline: "Design & Book Your Tattoo in One Place!",
    subheadline: "Create • Match • Get Inked — tatooo.shop",
    cta: "Start Now",
    targetAudience: "consumer",
    format: "landscape",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663418605762/Pa7E4RBX4UbpFBvKpz2nxk/ad-l4-design-book-one-place_d847a592.png",
    channels: ["facebook_feed", "google_display", "twitter", "reddit"],
    utmCampaign: "design-book-one-place-landscape",
  },
];

/** Get creatives by target audience */
export function getCreativesByAudience(audience: AdCreative["targetAudience"]): AdCreative[] {
  return AD_CREATIVES.filter(c => c.targetAudience === audience || c.targetAudience === "both");
}

/** Get creatives by format */
export function getCreativesByFormat(format: AdCreative["format"]): AdCreative[] {
  return AD_CREATIVES.filter(c => c.format === format);
}

/** Get creatives suitable for a specific channel */
export function getCreativesForChannel(channel: string): AdCreative[] {
  return AD_CREATIVES.filter(c => c.channels.includes(channel));
}

/** Build a full ad URL with UTM tracking */
export function buildAdUrl(creative: AdCreative, utmSource: string, utmMedium: string): string {
  const base = "https://tatooo.shop";
  const params = new URLSearchParams({
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: creative.utmCampaign,
    utm_content: creative.id,
  });
  return `${base}?${params.toString()}`;
}
