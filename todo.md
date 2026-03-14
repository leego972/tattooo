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
