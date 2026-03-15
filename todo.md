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
- [x] 29 tests passing (auth, credits, tattoo, outreach, features, promo, referral)

## Enhanced Promo Code & Referral System
- [x] DB: Added appliedPromoCode/promoDiscountUsed to users table
- [x] DB: Added successfulReferrals/bonusCreditsEarned to referral_codes table
- [x] DB: New referral_tracking table for per-referral audit trail
- [x] DB: New promo_codes table with discount/bonus/usage fields
- [x] Backend: promoRouter — validate (public) and applyCode (protected) procedures
- [x] Backend: Seeded 3 built-in promo codes (TATTOO50, WELCOME25, INKED2025)
- [x] Backend: Register flow upgraded to use referral_codes + referral_tracking + milestone bonuses
- [x] Backend: Checkout procedure reads user's applied promo and passes discount to Stripe
- [x] Backend: createCheckoutSession accepts optional discountPercent
- [x] Frontend: Referral page rebuilt with milestone progress bar, stats, promo code input, share tools
- [x] Tests: promo.validate, referral.validate, referral.getMyCode, referral.getStats coverage added

## Admin Promo Code Manager + One-Time Enforcement
- [x] Backend: admin.promo.list — list all promo codes with usage stats
- [x] Backend: admin.promo.create — create new promo code
- [x] Backend: admin.promo.update — toggle active, change discount/bonus/limits
- [x] Backend: admin.promo.delete — deactivate/remove a promo code
- [x] Frontend: /admin/promos page — table with create/edit/deactivate actions
- [x] Backend: Stripe webhook clears appliedPromoCode after checkout.session.completed

## Auth Gating — No Features Without Signup
- [x] Create ProtectedRoute wrapper component that redirects to /login if not authenticated
- [x] Gate: Studio (/studio)
- [x] Gate: My Tatts (/my-tatts)
- [x] Gate: Drawing Board (/draw)
- [x] Gate: History (/history)
- [x] Gate: Gallery (/gallery)
- [x] Gate: Artists (/artists)
- [x] Gate: Referral (/referral)
- [x] Gate: Pricing (/pricing)
- [x] Gate: Bookings (/bookings)
- [x] Gate: Subscription (/subscription)
- [x] Navbar: only show Login, Sign Up, Join as Artist when logged out (hide all other nav items)
- [x] Leego logo: black background panel, enlarged but tasteful, better visibility in sidebar

## Landing Page CTA + Promo Expiry + Promo Email
- [x] Landing page: logged-out hero shows Sign Up Free (primary) + Sign In (secondary) CTAs
- [x] Landing page: logged-in hero keeps Start Designing CTA unchanged
- [x] Backend: promo.validate checks expiresAt and rejects expired codes
- [x] Backend: promo.applyCode sends confirmation email via Resend with discount + bonus summary
- [x] Backend: subscription-router fixed to read from credits table (not users)
- [x] Backend: subscription checkout uses correct Stripe API (no 'as any' cast)
- [x] Backend: webhook handles subscription_upgrade event — grants credits + updates plan
- [x] Backend: sendPromoConfirmationEmail added to emailService

## Full Stripe Setup (Live Keys)
- [ ] Create Stripe products: Starter Credits, Pro Credits, Unlimited Credits, Pro Subscription, Studio Subscription, Artist Directory Fee
- [ ] Create Stripe prices: one-time for credit packs, recurring monthly for subscriptions, one-time for artist fee
- [ ] Store price IDs in products.ts / env
- [ ] Fix credit pack checkout to use Stripe price IDs (not manual amount)
- [ ] Fix subscription checkout to use recurring price IDs
- [ ] Fix artist signup checkout to use price ID
- [ ] Fix booking deposit checkout (dynamic amount stays as-is)
- [ ] Fix webhook: handle customer.subscription.updated for plan changes
- [ ] Fix payment success page: show plan-specific message based on ?type= param
- [ ] End-to-end test all payment flows with live keys

## Credit & Membership Sync
- [ ] Create Stripe products and prices via API script
- [ ] Store price IDs in server/products.ts
- [ ] Credit packs use Stripe price IDs (not price_data)
- [ ] Subscription plans use recurring price IDs
- [ ] Artist fee uses price ID
- [ ] Webhook handles all event types correctly
- [ ] Plan field stays in sync with subscription status
- [ ] Monthly credit refresh on subscription renewal
- [ ] Payment success page shows plan-specific message
- [ ] UI: credits badge shows balance + plan tier

## Credit & Membership Sync Audit
- [ ] Audit: signup free credits (amount correct?)
- [ ] Audit: credit pack purchase webhook awards correct amount
- [ ] Audit: subscription upgrade awards correct monthly credits
- [ ] Audit: generation deducts exactly 1 credit (or correct amount per action)
- [ ] Audit: video generation deducts 5 credits
- [ ] Audit: referral bonus credits awarded correctly
- [ ] Audit: promo bonus credits awarded correctly
- [ ] Audit: subscription cancellation does NOT wipe remaining balance
- [ ] Audit: plan field on credits table stays in sync with subscription status
- [ ] Fix: subscription monthly credit refresh (cron or webhook trigger)
- [ ] Fix: plan limits enforced in generation gate (free=5/mo, pro=50/mo, studio=200/mo vs balance)
- [ ] UI: credits badge shows balance + plan tier
- [ ] UI: pricing page shows correct credit amounts per tier

## Credit & Membership Sync (Full Audit Pass)
- [x] DB: credits table was missing plan/stripeCustomerId/stripeSubscriptionId/subscriptionStatus — migrated
- [x] DB: credits schema updated to include studio plan enum value
- [x] DB: subscription data synced from subscriptions table to credits table
- [x] Backend: signup grants 500 free credits (getOrCreateCredits)
- [x] Backend: credit pack webhook awards correct amount from metadata
- [x] Backend: subscription upgrade grants pro=50 / studio=200 credits + sets plan
- [x] Backend: generation deducts 1 credit; unlimited plan bypasses gate
- [x] Backend: subscription cancellation keeps remaining balance, downgrades plan to free
- [x] Backend: all checkout success_urls pass ?type= and ?plan= or ?pack= params
- [x] Backend: booking and artist success_url points to /payment-success with correct type
- [x] Frontend: PaymentSuccess page shows plan-specific messages (subscription/artist/booking/credits)
- [x] Frontend: subscription page uses monthlyCredits from products.ts

## Monthly Credit Refresh + Credit Usage Page
- [x] Backend: invoice.paid webhook handler — top up credits on subscription renewal (pro=50, studio=200)
- [x] Backend: invoice.paid handler sets plan and subscriptionStatus in credits table
- [x] Frontend: /credits page — transaction history table (date, action, amount, running balance)
- [x] Frontend: /credits page — summary card (current balance, plan, lifetime total)
- [x] Frontend: /credits page — link from sidebar credits badge (badge now links to /credits)
- [x] Navigation: Credits badge links to /credits; plan tier shown in badge

## Low-Credit Alert + Admin Gift Credits + Stripe Portal
- [ ] Backend: sendLowCreditAlert email in emailService.ts
- [ ] Backend: deductCredit triggers low-credit email when balance drops below 5
- [ ] Backend: admin.giftCredits procedure (userId, amount, reason)
- [ ] Frontend: Admin Panel — Gift Credits dialog (user search by email, amount, reason)
- [ ] Backend: credits.createPortalSession procedure — creates Stripe billing portal session
- [ ] Frontend: Credits page — "Manage Subscription" button opens Stripe portal
- [ ] Frontend: Subscription page — "Manage Subscription" button opens Stripe portal

## Low-Credit Alert + Admin Gift Credits + Stripe Portal
- [x] Backend: sendLowCreditAlert email function added to emailService.ts
- [x] Backend: deductCredit fires low-credit alert when balance drops below 5
- [x] Backend: admin.giftCredits procedure — gift credits to user by email
- [x] Admin UI: Gift Credits tab with email input, amount, reason, and 6 quick presets
- [x] Frontend: Credits page — Manage Subscription button opens Stripe portal for paid users
- [x] Frontend: Subscription page already had portal button (confirmed working)
- [x] Fix: emailService.ts box-drawing UTF-8 chars replaced with plain ASCII (esbuild error resolved)

## Auth Gate Bug Fix
- [ ] Bug: All features accessible without login — ProtectedRoute not blocking unauthenticated users
- [ ] Fix: Diagnose ProtectedRoute component and App.tsx routing
- [ ] Fix: Ensure redirect to /login for all protected routes when not authenticated

## Auth Gate + Logo Fix (Round 2)
- [x] Bug: ProtectedRoute allows access when auth.me returns null (loading=false, user=null)
- [x] Fix: ProtectedRoute now uses <Redirect> (synchronous) instead of useEffect — no content flash
- [x] Fix: Home / route is now protected — unauthenticated users redirected to /login immediately
- [x] Fix: Navbar shows ONLY Login, Sign Up, Join as Artist when logged out (no other nav items)
- [x] Fix: Leego logo enlarged to w-36 h-36 with solid black rounded panel in both logged-in and logged-out sidebar

## Artist Profile System + Team Tier
- [x] DB: Extend artists table with photo, address, phone, businessHours, bio, specialties, instagram, website, isVerified, teamId
- [x] DB: New artist_teams table (id, ownerId, name, studioName, plan, memberCount, stripeCustomerId, stripeSubscriptionId)
- [x] DB: New artist_team_members table (teamId, artistId, role: owner/member, joinedAt)
- [ ] DB: Stripe: add Team plan to products.ts (monthly recurring, up to 10 artists)
- [x] Backend: artist.getById — public, returns full profile with team members
- [x] Backend: artist.list — public, returns all verified artists with name/country/location/specialty filters
- [x] Backend: team.create — protected, creates team + sets owner
- [x] Backend: team.getMembers — protected owner
- [x] Frontend: /artist-signup — 5-step form (profile, location, portfolio, hours/pricing, payment)
- [x] Frontend: /artists/:id — full public profile page (photo, bio, specialties, hours, location, portfolio, team, booking CTA)
- [x] Frontend: /artists — listing with profile photos, specialties, location, link to profile

## Artist Profile + Search System
- [x] Backend: artists.list supports name search (partial match on name field)
- [x] Backend: artists.list supports country filter
- [x] Frontend: Artists page — name search bar
- [x] Frontend: Artists page — country dropdown filter
- [x] Frontend: Artists page — artist cards link to /artists/:id
- [x] Frontend: ArtistProfile page (/artists/:id) — full public profile with photo, bio, hours, portfolio, team info, book button
- [x] Frontend: ArtistSignup — 5-step form with photo, address, phone, hours, team option
- [x] Frontend: App.tsx — add /artists/:id route

## Studio Mailing List System
- [x] DB: studio_mailing_list table (100 studios seeded with researched emails)
- [x] DB: weekly_ad_sends table (tracks per-studio weekly send history)
- [x] DB: info_pack_attachments table (stores uploaded PDF info packs per language)
- [x] Email research: 76/100 emails found, 2 studios closed, 22 no email found
- [x] Backend: mailingList.list — admin, filter by country/email status/info pack status/search
- [x] Backend: mailingList.stats — summary counts
- [x] Backend: mailingList.updateEmail — update email + status
- [x] Backend: mailingList.delete — remove studio from list
- [x] Backend: mailingList.add — add studio manually
- [x] Backend: mailingList.sendInfoPack — send AI-generated multilingual info pack to single studio
- [x] Backend: mailingList.sendInfoPackBatch — send to all eligible studios at once
- [x] Backend: mailingList.sendWeeklyAd — AI-generated picture ad to all opted-in studios
- [x] Backend: mailingList.previewInfoPack — preview without sending
- [x] Backend: mailingList.previewWeeklyAd — preview with AI image without sending
- [x] Backend: GET /api/unsubscribe/:token — one-click unsubscribe endpoint (GDPR/CAN-SPAM)
- [x] Frontend: /mailing-list — admin page with Contacts, Send Campaigns, Preview tabs
- [x] Frontend: Navbar — Mailing List link in admin section
- [x] Email: unsubscribe footer on all outreach emails

## Send Design to Artist Feature
- [x] Backend: tattoo.sendDesignToArtist procedure — sends print-ready design email to artist/studio
- [x] Backend: Professional HTML email template with design image, print specs table, body placement, style, booking details
- [x] Frontend: "Send to Artist" button on My Tatts cards and design complete screen
- [x] Frontend: Artist picker dialog (search by name/country from directory)
- [x] Frontend: Booking details form (preferred date, contact info, notes)
- [x] Frontend: Success confirmation toast after send

## Booking Notification & Appointment Scheduler
- [x] DB: artist_availability table (date, timeSlot, isBooked)
- [x] DB: in_app_notifications table (userId, title, body, type, isRead, link)
- [x] DB: bookings table extended with declineReason, nextAvailableDate, alternativeArtistIds
- [x] Backend: booking.request — user sends booking request to artist
- [x] Backend: booking.confirm — artist confirms booking, marks slot as booked
- [x] Backend: booking.decline — artist declines with reason + next available date
- [x] Backend: booking.artistInbox — artist sees all pending/confirmed bookings
- [x] Backend: booking.myBookings — user sees all their bookings
- [x] Backend: availability.setSlots — artist sets available dates
- [x] Backend: availability.removeSlot — artist removes a slot
- [x] Backend: availability.mySlots — artist views own slots
- [x] Backend: availability.getSlots — public, get artist open slots
- [x] Backend: notifications.list / unreadCount / markRead / markAllRead
- [x] Frontend: /artist-dashboard — booking inbox (Accept/Decline), availability calendar, notification bell
- [x] Frontend: /my-bookings — user booking status, declined reason + next date + rebook + alternative artists
- [x] Frontend: Navbar — My Bookings + Artist Dashboard links
- [x] Email: booking request email to artist, confirmation/decline email to user
- [x] Theme: tattoo studio aesthetic (crimson red, aged gold, Bebas Neue, noise texture)
