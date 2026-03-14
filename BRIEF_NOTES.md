# AI Tattoo App — Monetization & Builder Brief

## Revenue Streams
1. **User revenue** — Freemium membership with paid upgrade (Free / Pro Monthly / Pro Annual)
2. **Artist revenue** — Low annual listing fee (editable in admin) to stay listed and eligible for referrals
3. **Transaction revenue** — 15% commission on first-time client bookings paid through the platform; 0% on repeat clients

## User Membership Plans
| Plan | Price | Features |
|------|-------|----------|
| Free | $0 | Limited AI generations, limited saved designs, lower export quality, basic artist recommendations |
| Pro Monthly | Set by admin | More generations, saved collections, better export, placement previews, faster iterations, stronger artist matching |
| Pro Annual | Discounted vs monthly | Same as Pro Monthly with annual discount |

> **Builder note:** Pricing values must be editable in admin panel without code changes.

## Artist Commercial Structure
- Annual listing fee: low-cost, editable in admin
- Booking commission: 15% of first-time client job value
- Repeat client commission: 0%
- Commission cap: recommended (editable in admin)
- Activation: artist must be paid AND approved to be match-eligible

## Booking & Commission Rules
- Booking must go through platform checkout to qualify for commission
- Payment = deposit or full payment depending on artist settings
- Commission applies only after payment is successful and booking is confirmed
- Refunds/cancellations/no-shows: admin can reverse or withhold commission
- Repeat-client detection: tied to customer account, email, phone, booking history
- **All commission %, cap, deposit rules, payout timing = configurable in admin**

## Artist Profile Fields
- Artist name / studio name
- City, state, country
- Traveling guest spots / service regions
- Tattoo styles and specialties
- Portfolio images
- Years of experience
- Price range / minimum charge
- Availability settings
- Booking link / direct booking status
- Languages spoken
- Verification status
- Annual fee status
- Commission eligibility status
- Ratings / review display

## Admin Panel Requirements
- [ ] Manage user subscription plans and usage limits
- [ ] Approve, reject, suspend, or feature artist accounts
- [ ] Edit annual listing fee amounts
- [ ] Edit commission percentage and optional commission cap
- [ ] Track all bookings, payments, refunds, and commissions
- [ ] Override first-time vs repeat-client status
- [ ] See artist revenue generated and client acquisition history
- [ ] Control homepage featured artists and AI match priority rules
- [ ] Export transaction and payout records

## Suggested Launch Defaults
| Setting | Default |
|---------|---------|
| Artist listing fee | Low annual fee; exact amount adjustable in admin |
| Commission rate | 15% |
| Commission scope | First-time client booking only |
| Repeat bookings | 0% commission |
| Payment collection | Handled on platform |
| Artist eligibility | Only active, approved, fee-paid artists can receive referrals |

## Core Product Flows
1. User creates design → AI generation, save states, usage limits by plan
2. User chooses preferred design → Save versions, favourites, design history
3. AI recommends artists → Matching engine: style tags, city/country filters, ranking logic
4. User views artist profile → Portfolio, pricing, bio, reviews, booking options
5. User books through platform → Checkout, payment processing, booking confirmation
6. Platform applies commission → System records 15% first-time commission and payout split
7. Artist is paid out → Net amount released after rules satisfied; payout scheduling and status tracking

## Key Principle
**The commercial model must be configurable.** Do not hard-code pricing, commission percentages, commission caps, deposit rules, or membership limits. All editable from admin.
