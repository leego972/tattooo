import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Sparkles, ChevronRight, Zap, Palette, Download } from "lucide-react";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663418605762/Pa7E4RBX4UbpFBvKpz2nxk/tatt-ooo-logo_244a108c.png";

const WALLPAPER_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663418605762/Pa7E4RBX4UbpFBvKpz2nxk/tatt-ooo-wallpaper_412a38be.png";

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Design",
    desc: "Describe your vision in plain language. Our AI refines your idea into a professional tattoo prompt.",
  },
  {
    icon: Palette,
    title: "Body Placement Preview",
    desc: "Choose your gender, body shape, and placement. See exactly how your tattoo looks on your body.",
  },
  {
    icon: Zap,
    title: "Instant Generation",
    desc: "RunwayML generates studio-quality tattoo artwork in seconds, tailored to your exact specifications.",
  },
  {
    icon: Download,
    title: "Download & Print",
    desc: "Save your design as a high-resolution PNG or send it straight to print — ready for your artist.",
  },
];

const styles = [
  "Black & Grey Realism",
  "Neo-Traditional",
  "Geometric",
  "Watercolor",
  "Japanese",
  "Tribal",
  "Fine Line",
  "Biomechanical",
];

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative min-h-[88vh] flex items-center justify-center overflow-hidden">
        {/* Wallpaper background */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${WALLPAPER_URL})` }}
        />
        {/* Dark gradient overlay for text readability — left side darker, right side shows art */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, oklch(0.05 0.006 250 / 0.97) 0%, oklch(0.05 0.006 250 / 0.88) 35%, oklch(0.05 0.006 250 / 0.55) 60%, oklch(0.05 0.006 250 / 0.25) 100%)",
          }}
        />
        {/* Bottom fade to background */}
        <div
          className="absolute bottom-0 left-0 right-0 h-40"
          style={{
            background: "linear-gradient(to bottom, transparent, oklch(0.07 0.006 250))",
          }}
        />

        <div className="container relative z-10 flex flex-col items-start text-left gap-8 py-20 max-w-3xl">
          <div className="relative">
            <div
              className="absolute inset-0 rounded-full blur-2xl opacity-30"
              style={{ background: "oklch(0.62 0.19 220)" }}
            />
            <img
              src={LOGO_URL}
              alt="tatt-ooo"
              className="relative w-32 h-32 rounded-full object-cover ring-2 ring-primary/40 glow-ink"
            />
          </div>

          <div className="flex flex-col gap-3 max-w-3xl">
            <p className="text-sm font-mono tracking-[0.3em] text-primary uppercase opacity-80">
              AI Tattoo Designer
            </p>
            <h1
              className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight gradient-text"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Your Vision,
              <br />
              <em>Inked Perfectly.</em>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Describe your tattoo idea, upload references, choose your body placement — and watch
              our AI generate stunning, print-ready tattoo artwork in seconds.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <Link href="/studio">
              <Button
                size="lg"
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 glow-ink text-base px-8 py-6"
              >
                <Sparkles size={18} />
                Start Designing
                <ChevronRight size={16} />
              </Button>
            </Link>
            <Link href="/gallery">
              <Button
                variant="outline"
                size="lg"
                className="gap-2 border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40 text-base px-8 py-6"
              >
                View Gallery
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap justify-start gap-2 max-w-2xl">
            {styles.map((s) => (
              <span
                key={s}
                className="px-3 py-1 text-xs rounded-full border border-border/50 text-muted-foreground bg-card/50"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 border-t border-border/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2
              className="text-3xl sm:text-4xl font-bold gradient-text mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Everything You Need
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              From concept to print-ready artwork — tatt-ooo handles every step of your tattoo design journey.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="glass rounded-xl p-6 flex flex-col gap-4 tattoo-card border border-border/30"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center glow-ink">
                  <Icon size={20} className="text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 border-t border-border/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2
              className="text-3xl sm:text-4xl font-bold gradient-text mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              How It Works
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "01", title: "Describe Your Idea", desc: "Type your tattoo concept in the chat. Upload reference images for inspiration. Choose your style." },
              { step: "02", title: "Choose Placement & Size", desc: "Select your body part — even hands, feet, and face. Pick your size. Preview on your avatar." },
              { step: "03", title: "Generate & Download", desc: "AI refines your prompt and generates studio-quality artwork. Download or print instantly." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col gap-4 text-center">
                <div className="mx-auto w-14 h-14 rounded-full border border-primary/30 bg-primary/5 flex items-center justify-center">
                  <span className="text-primary font-mono font-bold text-lg">{step}</span>
                </div>
                <h3 className="font-semibold text-lg text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-border/30">
        <div className="container text-center flex flex-col items-center gap-6">
          <h2
            className="text-3xl sm:text-4xl font-bold gradient-text"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Ready to Design Your Tattoo?
          </h2>
          <p className="text-muted-foreground max-w-md">
            Join thousands of tattoo enthusiasts who use tatt-ooo to bring their ink ideas to life.
          </p>
          <Link href="/studio">
            <Button
              size="lg"
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 glow-ink text-base px-10 py-6"
            >
              <Sparkles size={18} />
              Open the Studio
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="" className="w-6 h-6 rounded-full" />
            <span>tatt-ooo — AI Tattoo Designer</span>
          </div>
          <span>Powered by RunwayML &amp; OpenAI</span>
        </div>
      </footer>
    </div>
  );
}
