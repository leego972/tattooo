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
- [ ] Install resend npm package
- [ ] Backend: password_reset_tokens table (token, userId, expiresAt, usedAt)
- [ ] Backend: tRPC auth.forgotPassword procedure (generates token, sends email via Resend)
- [ ] Backend: tRPC auth.resetPassword procedure (validates token, updates passwordHash)
- [ ] Frontend: "Forgot password?" link on Login page
- [ ] Frontend: ForgotPassword page (email input form)
- [ ] Frontend: ResetPassword page (new password form, reads token from URL)
- [ ] Email: Branded HTML email template with tatt-ooo logo and reset link

## Tattoo Artist Directory
- [ ] DB: artists table (name, bio, location, specialties, instagram, website, contactEmail, avatarUrl, verified)
- [ ] Backend: tRPC artists.list procedure (filter by specialty/location)
- [ ] Backend: tRPC artists.contact procedure (sends inquiry email via Resend)
- [ ] Frontend: Artists page with card grid, filter by style/location
- [ ] Frontend: Artist profile card (photo, bio, specialties, contact button)
- [ ] Frontend: "Find an Artist" button on My Tatts cards (passes design URL)
- [ ] Frontend: Contact artist modal (pre-fills with design image URL)
- [ ] Navigation: Artists link in sidebar

## Social Sharing + Watermark
- [ ] Frontend: Canvas watermark utility (overlays tatt-ooo logo bottom-right on generated image)
- [ ] Frontend: Share button on each generated image in chat and My Tatts
- [ ] Frontend: Share modal with platform options (Instagram, TikTok, Twitter/X, WhatsApp, copy link)
- [ ] Frontend: Download with watermark option (separate from print-ready download)
- [ ] Backend: Public share URL for each design (short shareable link)
- [ ] Frontend: Public share page (/share/:id) showing design with branding
