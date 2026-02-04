import Image from "next/image";
import Link from "next/link";

const sponsors = [
  { name: "Frontier Tower", contribution: "Venue", logo: "/sponsors/frontiertower.png", url: "https://frontiertower.io", invert: false, isPng: true },
  { name: "Amazon AGI Labs", contribution: "Project Sponsor", logo: "/sponsors/amazon.svg", url: "https://labs.amazon.science/", invert: true },
  { name: "Bee", contribution: "Lobster Rolls", logo: "/sponsors/bee.svg", url: "https://www.bee.computer/", invert: false },
  { name: "Convex", contribution: "Pizza", logo: "/sponsors/convex.svg", url: "https://convex.dev", invert: false },
  { name: "CRS Credit API", contribution: "Mediterranean", logo: "/sponsors/crs.svg", url: "https://crscreditapi.com/", invert: true },
  { name: "Kilo.ai", contribution: "Crab", logo: "/sponsors/kilo.svg", url: "https://kilo.ai", invert: false },
  { name: "Greycroft", contribution: "Drinks & Snacks", logo: "/sponsors/greycroft.svg", url: "https://www.greycroft.com/", invert: true },
  { name: "CodeRabbit", contribution: "Drinks & Snacks", logo: "/sponsors/coderabbit.svg", url: "https://www.coderabbit.ai/", invert: true },
  { name: "Cua", contribution: "Drinks & Snacks", logo: "/sponsors/cua.svg", url: "https://cua.ai/", invert: false },
  { name: "Cline", contribution: "Drinks & Utensils", logo: "/sponsors/cline.svg", url: "https://cline.bot/", invert: true },
  { name: "Render", contribution: "Drinks & Chips", logo: "/sponsors/render.svg", url: "https://render.com", invert: false },
  { name: "ElevenLabs", contribution: "Drinks & Snacks", logo: "/sponsors/elevenlabs.svg", url: "https://elevenlabs.io/", invert: false },
  { name: "DigitalOcean", contribution: "Drinks", logo: "/sponsors/digitalocean.svg", url: "https://www.digitalocean.com/", invert: false },
  { name: "Rippling", contribution: "Lobster Plushies", logo: "/sponsors/rippling.svg", url: "https://www.rippling.com/", invert: true },
  { name: "Dabl Club", contribution: "Event Support", logo: "/sponsors/dabl.svg", url: "https://dabl.club", invert: false },
];

export const metadata = {
  title: "Sponsors – ClawCon SF",
  description: "Thank you to the sponsors of the 1st OpenClaw SF Show & Tell.",
};

export default function SponsorsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0b0b12", fontFamily: "'Inter', -apple-system, system-ui, sans-serif" }}>
      {/* Header bar matching main site */}
      <header
        style={{
          background: "#ff6600",
          padding: "4px 8px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontWeight: "bold",
            textDecoration: "none",
            color: "#000",
            fontFamily: "Verdana, Geneva, sans-serif",
            fontSize: "11pt",
          }}
        >
          <span style={{ fontSize: "14pt" }}>🦞</span>
          <span>Claw Con</span>
        </Link>
        <Link
          href="/"
          style={{
            color: "#000",
            textDecoration: "none",
            fontFamily: "Verdana, Geneva, sans-serif",
            fontSize: "10pt",
          }}
        >
          submissions
        </Link>
        <span style={{ color: "#000", fontFamily: "Verdana, Geneva, sans-serif", fontSize: "10pt" }}>|</span>
        <span
          style={{
            color: "#fff",
            fontWeight: "bold",
            fontFamily: "Verdana, Geneva, sans-serif",
            fontSize: "10pt",
          }}
        >
          sponsors
        </span>
      </header>

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "60px 24px 40px" }}>
        <div style={{ fontSize: "56px", marginBottom: "8px" }}>🦞</div>
        <h1
          style={{
            fontSize: "clamp(28px, 5vw, 48px)",
            fontWeight: 900,
            letterSpacing: "-1.5px",
            background: "linear-gradient(135deg, #ff6b5a 0%, #ff4530 50%, #ff6b5a 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            lineHeight: 1.15,
            margin: "0 0 12px",
          }}
        >
          ClawCon: 1st OpenClaw SF Show & Tell
        </h1>
        <p
          style={{
            fontSize: "18px",
            fontWeight: 500,
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "6px",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          Thank You to Our Sponsors
        </p>
      </div>

      {/* Sponsors Grid */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 24px 60px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "20px",
        }}
      >
        {sponsors.map((sponsor) => (
          <a
            key={sponsor.name}
            href={sponsor.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: "rgba(255,255,255,0.035)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "14px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "28px 16px 20px",
              minHeight: "160px",
              textDecoration: "none",
              transition: "background 0.2s, border-color 0.2s, transform 0.2s",
            }}
            onMouseEnter={(e) => {
              // @ts-expect-error direct style mutation for hover
              e.currentTarget.style.background = "rgba(255,255,255,0.07)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              // @ts-expect-error direct style mutation for hover
              e.currentTarget.style.background = "rgba(255,255,255,0.035)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div
              style={{
                width: "160px",
                height: "70px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "12px",
                position: "relative",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sponsor.logo}
                alt={sponsor.name}
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                  filter: sponsor.invert ? "brightness(0) invert(1)" : "none",
                  opacity: sponsor.invert ? 0.85 : 0.9,
                }}
              />
            </div>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "rgba(255,255,255,0.7)",
                textAlign: "center",
              }}
            >
              {sponsor.name}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "rgba(255,255,255,0.35)",
                marginTop: "4px",
                textAlign: "center",
              }}
            >
              {sponsor.contribution}
            </div>
          </a>
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          textAlign: "center",
          padding: "24px",
          fontSize: "13px",
          color: "rgba(255,255,255,0.2)",
          letterSpacing: "1px",
        }}
      >
        February 4, 2026 · Frontier Tower · San Francisco
      </div>
    </div>
  );
}
