# tatt-ooo TODO

## Core Features
- [x] Database schema: tattoo_generations table with bodyPlacement, sizeInCm, sizeLabel fields
- [x] Backend: File upload endpoint (reference images → S3)
- [x] Backend: OpenAI prompt refinement procedure (takes user message + reference image + body placement + size → enhanced tattoo prompt)
- [x] Backend: RunwayML image generation procedure (correct /v1/text_to_image endpoint)
- [x] Backend: Save generation to DB + fetch history procedures
- [x] Frontend: Dark elegant global theme (black/silver/blue accent, custom fonts)
- [x] Frontend: Landing page with logo, tagline, CTA + wallpaper hero background
- [x] Frontend: Chat interface with text input + image upload button (wide, full-width)
- [x] Frontend: Body placement selector (full body map: face, neck, hands, feet, fingers, arms, chest, back, leg, etc.)
- [x] Frontend: Interactive avatar panel — gender selector (male/female) + body shape (slim, athletic, average, plus-size)
- [x] Frontend: SVG avatar body with clickable placement zones
- [x] Frontend: Tattoo overlay on avatar at correct scale
- [x] Frontend: Size preference picker (XS/S/M/L/XL with cm guide)
- [x] Frontend: AI typing indicator / generation progress state
- [x] Frontend: Generated tattoo image displayed inline in chat
- [x] Frontend: Gallery page showing all generated designs with download and print buttons
- [x] Frontend: History page for authenticated users
- [x] Frontend: Auth (login/logout) integrated into sidebar nav
- [x] Frontend: Responsive design (mobile-first, iOS/Android optimized)
- [x] Frontend: Sidebar nav with LEEGO creator logo at bottom (double size)
- [x] Frontend: Global tattoo style selector (40+ styles across 8 categories)

## Print-Ready Export
- [x] Backend: Calculate pixel dimensions from physical size (cm) at 300 DPI
- [x] Backend: Generate image at correct pixel dimensions
- [x] Backend: Embed 300 DPI metadata into PNG using sharp before saving to S3
- [x] Backend: Return printWidthPx, printHeightPx, dpi, physicalSizeCm in generation response
- [x] Frontend: Show print spec badge on generated image
- [x] Frontend: Download produces full-res print-ready PNG with DPI metadata
- [x] Frontend: Print dialog shows physical size guide and artist instructions

## Tests & Deployment
- [x] Tests: API key validation tests (OpenAI + RunwayML)
- [x] Tests: Auth logout tRPC procedure unit tests
- [x] Railway: Add railway.json config + environment variable documentation (RAILWAY_DEPLOY.md)
- [x] Railway: Health check endpoint at /api/health
- [ ] GitHub: Push all code to repo (pending)

## My Tatts Page
- [x] Backend: tattoo_generations table has userId column linked to users
- [x] Backend: tRPC procedure — myTatts.list (returns all generations for logged-in user, newest first, excludes deleted)
- [x] Backend: tRPC procedure — myTatts.delete (soft-delete a generation by id, owner-only)
- [x] Backend: tRPC procedure — myTatts.rename (update nickname/title on a saved design)
- [x] Frontend: My Tatts page — personal grid gallery of all saved designs
- [x] Frontend: Each card shows thumbnail, style, body placement, size, date, print spec badge
- [x] Frontend: Download and Print buttons on each card
- [x] Frontend: Delete button with two-step confirmation
- [x] Frontend: Rename/title field inline on each card
- [x] Frontend: Empty state with CTA to Studio when no designs yet
- [x] Frontend: Login gate — shows sign-in prompt if not authenticated
- [x] Navigation: "My Tatts" link in sidebar nav with BookMarked icon

## Drawing Board Page
- [x] Frontend: Full-screen canvas editor (native HTML5 Canvas)
- [x] Frontend: Load AI-generated image onto canvas as base layer
- [x] Frontend: Brush tool — adjustable size, opacity
- [x] Frontend: Colour picker with 28-colour palette + custom colour input
- [x] Frontend: Eraser tool with adjustable size
- [x] Frontend: Text tool — add custom text with font size and colour
- [x] Frontend: Shape tools — line, circle, rectangle overlays
- [x] Frontend: Undo / Redo (Ctrl+Z / Ctrl+Y, up to 30 steps)
- [x] Frontend: Clear canvas button
- [x] Frontend: Export as PNG
- [x] Frontend: Print from Drawing Board
- [x] Frontend: Mobile-friendly touch drawing support (iOS/Android)
- [x] Navigation: "Edit in Board" button on each My Tatts card
- [x] Navigation: Drawing Board link in sidebar nav with PenTool icon

## Stripe Credits System
- [x] DB: credits table (userId, balance, lifetimeTotal, updatedAt)
- [x] DB: credit_transactions table (userId, amount, type, stripeSessionId, description, createdAt)
- [x] Backend: Stripe checkout session procedure (buy credits packs)
- [x] Backend: Stripe webhook handler (fulfill credits on payment success)
- [x] Backend: Deduct 1 credit per generation, enforce gate (0 credits = blocked)
- [x] Backend: tRPC credits.balance, credits.transactions procedures
- [x] Backend: New users get 5 free credits on signup (freemium)
- [x] Frontend: Credits badge in sidebar (shows live balance)
- [x] Frontend: Pricing page with 3 tiers (Starter $9.99/50, Pro $24.99/150, Unlimited $49.99/mo)
- [x] Frontend: Generation blocked UI when credits = 0 (upgrade prompt)
- [x] Frontend: Stripe Checkout redirect flow (opens in new tab)
- [x] Frontend: Payment success page
- [x] Frontend: Login/Signup page (email + password, no Manus OAuth)
- [x] Tests: 14 tests passing (auth, credits, tattoo procedures, API keys)

## Password Reset (Resend Email)
- [x] Backend: password_reset_tokens table
- [x] Backend: tRPC auth.forgotPassword + auth.resetPassword procedures
- [x] Frontend: ForgotPassword + ResetPassword pages

## Tattoo Artist Directory
- [x] DB: artists table
- [x] Backend: tRPC artists.list, artists.contact procedures
- [x] Frontend: Artists page with card grid, filter by style/location
- [x] Frontend: Artist profile card (photo, bio, specialties, contact button)
- [x] Navigation: Artists link in sidebar

## Social Sharing + Watermark
- [x] Backend: Public share URL for each design
- [x] Frontend: Share button on My Tatts cards
- [x] Frontend: Public share page (/share?id=...)

## Admin Dashboard
- [x] Backend: admin.stats, admin.users, admin.generations, admin.artistApplications procedures
- [x] Frontend: /admin page with stats cards, users table, generations table
- [x] Frontend: Artist applications management panel
- [x] Frontend: Admin-only route guard

## Multi-Design Comparison + Studio Enhancements
- [x] Frontend: "Generate Variations" toggle in Studio (1-3 variations)
- [x] Frontend: Side-by-side comparison view for multiple variations
- [x] Frontend: Size ruler overlay on generated image
- [x] Frontend: Skin overlay / colour palette customiser controls in Studio

## Artist Marketplace + Stripe Booking
- [x] DB: bookings table
- [x] Backend: artists.requestBooking with Stripe deposit checkout session
- [x] Backend: Stripe webhook for booking payment confirmation
- [x] Frontend: Artists page with Book button and booking dialog
- [x] Frontend: My Bookings page (/bookings)

## Referral Programme
- [x] DB: referrals table
- [x] Backend: referral.getLink, referral.stats, referral.redeem procedures
- [x] Frontend: Referral page (/referral) with shareable link + stats
- [x] Navigation: Referral link in sidebar

## Animated Reveal Video
- [x] Backend: tattoo.generateVideo (RunwayML image-to-video, costs 5 credits)
- [x] DB: videoUrl column added to tattoo_generations
- [x] Frontend: "Animate (5 cr)" button on My Tatts cards
- [x] Frontend: "Watch Reveal" button when video is ready

## Artist Sign-Up Page (Annual Directory Fee)
- [x] Backend: artists.applyWithPayment procedure — creates Stripe checkout for $29/year annual fee
- [x] Backend: Stripe webhook fulfillment — on payment success, create artist profile (status: pending_review)
- [x] Backend: Admin can verify/reject artist applications
- [x] Frontend: /artist-signup page — multi-step form (profile details → payment → confirmation)
- [x] Frontend: Artist CTA button on /artists page links to /artist-signup
- [x] Navigation: /artist-signup route in App.tsx

## Autonomous Artist Outreach System
- [x] DB: outreach_campaigns table (name, region, country, language, status, sentCount, openCount, clickCount, signupCount)
- [x] DB: outreach_contacts table (email, name, studioName, country, language, campaignId, status, trackingPixelId)
- [x] Backend: admin.createCampaign (AI generates personalised email in native language)
- [x] Backend: admin.addOutreachContacts (bulk import artist emails per campaign)
- [x] Backend: admin.sendCampaign (batch send via Resend with tracking pixel + signup link)
- [x] Backend: admin.getCampaignContacts (list contacts per campaign)
- [x] Frontend: /outreach admin page with campaign creation, contact import, email preview, send controls
- [x] Frontend: Campaign stats dashboard (sent/opens/clicks/signups)
- [x] Frontend: Campaign status badges (draft/scheduled/sending/completed)
- [x] Navigation: Outreach link in admin sidebar section (admin-only)
- [x] Supported languages: 16 languages including Japanese, Korean, Arabic, Russian, Chinese, etc.

## Domain
- [ ] Connect tattooo.shop domain via GoDaddy DNS (instructions provided at delivery)

## Advertising System (from Archibald Titan)
- [x] Backend: advertising-orchestrator.ts — AI content generation, A/B testing, channel management
- [x] Backend: advertising-router.ts — tRPC procedures for dashboard, content queue, TikTok, video generation
- [x] Backend: marketing-channels.ts — Instagram, TikTok, Facebook, Google, Pinterest, Twitter channels
- [x] Backend: tiktok-content-service.ts — TikTok-specific content generation
- [x] Backend: blog-seed.ts — SEO blog content seeding
- [x] Frontend: /advertising page — admin dashboard with overview, ad creatives library, content queue, channels
- [x] Ad Creatives: 7 ad creatives uploaded to CDN (3 portrait + 4 landscape)
- [x] Navigation: Advertising link in admin sidebar section

## Affiliate System (from Archibald Titan)
- [x] Backend: affiliate-engine.ts + affiliate-engine-v2.ts — partner discovery, outreach, conversion tracking
- [x] Backend: affiliate-discovery-engine.ts — automated discovery of tattoo affiliate prospects
- [x] Backend: affiliate-signup-engine.ts — automated signup flow for discovered affiliates
- [x] Backend: affiliate-router.ts — tRPC procedures for stats, partners, discovery, payouts
- [x] Frontend: /affiliates page — admin dashboard with overview, partners list, discovery, payouts
- [x] Navigation: Affiliates link in admin sidebar section

## SEO Engine (from Archibald Titan)
- [x] Backend: seo-engine.ts — keyword tracking, meta generation, content optimization for tattoo keywords
- [x] Backend: seo-router.ts — tRPC procedures for SEO analysis

## Subscription / Membership System (from Archibald Titan)
- [x] Backend: subscription-gate.ts — plan gating logic (Free/Pro/Studio)
- [x] Backend: subscription-router.ts — Stripe subscription checkout, portal, status procedures
- [x] Frontend: /subscription page — pricing tiers (Free/Pro/Studio) with Stripe checkout
- [x] Navigation: Subscription link in main sidebar

## Credit System (from Archibald Titan)
- [x] Backend: credit-service.ts — credit balance, deduction, purchase, transaction history
- [x] Backend: credit-router.ts — tRPC procedures for credits

## Hero Wallpaper
- [x] Uploaded tatooo.shop cinematic banner wallpaper as hero background
- [x] Text contrast overlays ensure all hero text is visible against busy background

## GitHub Push
- [x] Repo created: https://github.com/leego972/tattooo
- [x] Code pushed to GitHub

## Tests
- [x] 24 tests passing (auth, credits, tattoo, outreach, features)
