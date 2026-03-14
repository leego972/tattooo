# tatt-ooo TODO

## Core Features
- [x] Database schema: tattoo_generations table with bodyPlacement, sizeInCm, sizeLabel fields
- [x] Backend: File upload endpoint (reference images → S3)
- [x] Backend: OpenAI prompt refinement procedure (takes user message + reference image + body placement + size → enhanced tattoo prompt)
- [x] Backend: RunwayML image generation procedure (takes refined prompt → tattoo image URL)
- [x] Backend: Save generation to DB + fetch history procedures
- [x] Frontend: Dark elegant global theme (black/silver/blue accent, custom fonts)
- [x] Frontend: Landing page with logo, tagline, CTA + wallpaper hero background
- [x] Frontend: Chat interface with text input + image upload button (wide, full-width like ChatGPT)
- [x] Frontend: Body placement selector (full body map: face, neck, hands, feet, fingers, arms, chest, back, leg, etc.)
- [x] Frontend: Interactive avatar panel — gender selector (male/female) + body shape (slim, athletic, average, plus-size)
- [x] Frontend: SVG avatar body with clickable placement zones that highlight on hover/select
- [x] Frontend: Tattoo overlay on avatar — generated image composited onto the selected body zone at correct scale
- [x] Frontend: Avatar rotates front/back view to show placement on both sides
- [x] Frontend: Size preference picker (XS/S/M/L/XL with cm guide) with body-part-aware sizing hints
- [x] Frontend: AI typing indicator / generation progress state
- [x] Frontend: Generated tattoo image displayed inline in chat
- [x] Frontend: Gallery page showing all generated designs with download (high-res PNG) and print buttons
- [x] Frontend: History page for authenticated users
- [x] Frontend: Auth (login/logout) integrated into sidebar nav
- [x] Frontend: Responsive design (mobile-first, iOS/Android optimized)
- [x] Frontend: Sidebar nav with LEEGO creator logo at bottom (double size)
- [x] Frontend: Global tattoo style selector (40+ styles across 8 categories)

## Print-Ready Export
- [x] Backend: Calculate pixel dimensions from physical size (cm) at 300 DPI
- [x] Backend: Generate image at correct pixel dimensions (e.g. 10cm = 1181px at 300 DPI)
- [x] Backend: Embed 300 DPI metadata into PNG using sharp before saving to S3
- [x] Backend: Return printWidthPx, printHeightPx, dpi, physicalSizeCm in generation response
- [x] Frontend: Show print spec badge on generated image (e.g. "10×10cm · 300 DPI · 1181×1181px")
- [x] Frontend: Download produces full-res print-ready PNG with DPI metadata
- [x] Frontend: Print dialog shows physical size guide and artist instructions

## Tests & Deployment
- [x] Tests: API key validation tests (OpenAI + RunwayML)
- [x] Tests: Auth logout tRPC procedure unit tests
- [ ] GitHub: Create repo via PAT and push all code
- [x] Railway: Add railway.json config + environment variable documentation (RAILWAY_DEPLOY.md)
- [x] Railway: Health check endpoint at /api/health
