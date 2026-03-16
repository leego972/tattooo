import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0a]/90 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to tattooo.shop
            </Button>
          </Link>
          <span className="text-sm text-gray-500">Est. 2026</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">Terms &amp; Conditions</h1>
          <p className="text-gray-400">Last updated: March 2026 — Effective immediately upon account creation.</p>
        </div>

        <div className="space-y-10 text-gray-300 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. About tattooo.shop</h2>
            <p>
              tattooo.shop ("the Platform", "we", "us") is a global online marketplace connecting tattoo enthusiasts
              with verified tattoo artists and studios. We provide AI-powered tattoo design tools, an artist discovery
              directory, and a booking facilitation service. tattooo.shop is not a tattoo studio and does not perform
              tattoo services directly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Acceptance of Terms</h2>
            <p>
              By creating an account, using the Platform, or making any purchase, you agree to these Terms &amp; Conditions
              in full. If you do not agree, you must not use the Platform. These terms apply to all users including
              members, artists, studios, and visitors.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. AI-Generated Designs — Important Disclaimer</h2>
            <p className="mb-3">
              The AI tattoo design tool generates conceptual artwork for inspiration and planning purposes only.
              <strong className="text-white"> AI-generated designs are not guaranteed to be unique, original, or free
              from similarity to existing works.</strong> You acknowledge that:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>AI designs are starting points for discussion with your chosen artist, not final tattoo blueprints.</li>
              <li>The final tattoo applied to your skin is the sole responsibility of the artist performing the work.</li>
              <li>tattooo.shop accepts no liability for the outcome, quality, or safety of any tattoo procedure.</li>
              <li>AI-generated images may not perfectly represent how a design will look on skin.</li>
              <li>You grant tattooo.shop a non-exclusive licence to display your generated designs for platform improvement and marketing purposes unless you opt out in settings.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Membership &amp; Payments</h2>
            <p className="mb-3">
              Membership fees are charged monthly ($6.99/month) or annually ($69.99/year) via Stripe. Memberships
              auto-renew unless cancelled before the renewal date. Refunds are not provided for partial billing periods.
            </p>
            <p>
              A platform booking fee of <strong className="text-white">13% of the agreed quote</strong> is charged
              when a client accepts an artist's quote and confirms a booking. This fee is non-refundable once the
              booking is confirmed and the artist has been notified. Multi-session tattoo pieces: the platform fee
              is charged once on the full quoted amount. Subsequent sessions are arranged directly between client
              and artist — tattooo.shop has no further involvement or liability.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Artist Listings &amp; Verification</h2>
            <p className="mb-3">
              Artists pay an annual directory fee to be listed on tattooo.shop. Listing does not constitute
              endorsement, certification, or guarantee of quality by tattooo.shop. We conduct basic verification
              of artist identity but do not verify qualifications, hygiene standards, insurance, or licensing.
            </p>
            <p>
              <strong className="text-white">Clients are solely responsible</strong> for verifying that their chosen
              artist holds any required local licences, maintains appropriate hygiene standards, and is insured.
              tattooo.shop accepts no liability for any harm, injury, infection, or dissatisfaction arising from
              tattoo services booked through the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Affiliate Programme</h2>
            <p>
              tattooo.shop operates an affiliate referral programme. Affiliates earn commissions on qualifying
              membership sign-ups and artist registrations referred via their unique link. Commission rates and
              payment schedules are published in the Affiliate Dashboard. tattooo.shop reserves the right to
              modify commission rates with 30 days' notice. Fraudulent referrals will result in immediate
              account termination and forfeiture of unpaid commissions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Prohibited Conduct</h2>
            <p className="mb-3">You must not use the Platform to:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Generate designs depicting hate symbols, illegal content, or content that promotes violence.</li>
              <li>Impersonate any artist, studio, or other user.</li>
              <li>Circumvent the booking system to avoid platform fees.</li>
              <li>Scrape, copy, or reproduce Platform content without written permission.</li>
              <li>Use the Platform if you are under 18 years of age.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, tattooo.shop, its directors, employees, and
              affiliates shall not be liable for any indirect, incidental, special, or consequential damages
              arising from your use of the Platform, including but not limited to: dissatisfaction with a tattoo,
              allergic reactions, infections, scarring, or any other physical or psychological harm resulting
              from tattoo procedures. Our total aggregate liability to you shall not exceed the amount you paid
              to tattooo.shop in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Privacy &amp; Data</h2>
            <p>
              We collect and process personal data in accordance with our Privacy Policy. By using the Platform
              you consent to this processing. We do not sell your personal data to third parties. Payment
              processing is handled by Stripe — we do not store card details.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Governing Law</h2>
            <p>
              These Terms are governed by the laws of Australia. Any disputes shall be subject to the exclusive
              jurisdiction of the courts of New South Wales, Australia.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Changes to These Terms</h2>
            <p>
              We may update these Terms at any time. Continued use of the Platform after changes constitutes
              acceptance of the revised Terms. We will notify registered users of material changes via email.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">12. Contact</h2>
            <p>
              For any questions regarding these Terms, contact us at{" "}
              <a href="mailto:legal@tattooo.shop" className="text-amber-400 hover:underline">
                legal@tattooo.shop
              </a>
            </p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">© 2026 tattooo.shop. All rights reserved.</p>
          <Link href="/">
            <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
