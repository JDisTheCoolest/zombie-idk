// Landing page: what Miner Finder is, with the animated world up top.
import Link from "next/link";
import PixelWorld from "@/components/PixelWorld";
import Reveal from "@/components/Reveal";
import { MODES } from "@/lib/minecraft";

const STEPS = [
  { icon: "🪪", title: "Make your player card", text: "Upload your skin, add your gamertag, edition, platforms, the modes you love, and a short bio." },
  { icon: "↔", title: "Swipe through players", text: "Swipe right to team up, left to skip. Players who share the most modes with you show up first." },
  { icon: "💎", title: "Team up and play", text: "When you both swipe right, you join each other's squad. Chat, share a server IP, and hop on." },
];

const FLOATERS = [
  { kind: "grass", left: "6%", top: "18%", size: 46, delay: 0 },
  { kind: "diamond", left: "88%", top: "12%", size: 38, delay: 1.2 },
  { kind: "gold", left: "80%", top: "62%", size: 30, delay: 2.1 },
  { kind: "stone", left: "12%", top: "70%", size: 34, delay: 0.6 },
  { kind: "tnt", left: "50%", top: "4%", size: 26, delay: 1.7 },
];

export default function Landing() {
  return (
    <div className="landing">
      <section className="hero">
        {FLOATERS.map((f) => (
          <span key={f.kind} className={`floater block-${f.kind}`} aria-hidden="true"
            style={{ left: f.left, top: f.top, width: f.size, height: f.size, animationDelay: `${f.delay}s` }} />
        ))}
        <p className="eyebrow rise" style={{ animationDelay: "0ms" }}>Java · Bedrock · every platform</p>
        <h1 className="hero-title rise" style={{ animationDelay: "120ms" }}>
          {"Miner Finder".split("").map((ch, i) => (
            <span key={i} className="hero-letter" style={{ animationDelay: `${300 + i * 60}ms` }}>{ch === " " ? " " : ch}</span>
          ))}
        </h1>
        <p className="hero-sub rise" style={{ animationDelay: "260ms" }}>
          Stop playing alone. Find people to play Minecraft with: survival partners, SMP crews, Bedwars squads, modded teams and builders.
        </p>
        <div className="row hero-cta rise" style={{ animationDelay: "400ms" }}>
          <Link href="/find" className="btn big">Start finding players</Link>
          <Link href="/profile" className="btn ghost big">Make your player card</Link>
        </div>
      </section>

      <div className="world-frame rise" style={{ animationDelay: "550ms" }}>
        <PixelWorld />
      </div>

      <section className="marquee" aria-label="Modes you can find players for">
        {[0, 1].map((row) => (
          <div key={row} className={`marquee-track${row ? " reverse" : ""}`}>
            {[...MODES, ...MODES].map((m, i) => <span key={i} className="pill mode">{m}</span>)}
          </div>
        ))}
      </section>

      <section className="steps">
        <Reveal><h2 className="section-title">How it works</h2></Reveal>
        <div className="steps-grid">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 140}>
              <div className="card step">
                <span className="step-icon" aria-hidden="true">{s.icon}</span>
                <span className="step-num">Step {i + 1}</span>
                <strong>{s.title}</strong>
                <p className="muted">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <Reveal>
        <section className="card safety">
          <div className="safety-icon" aria-hidden="true">🛡</div>
          <div>
            <h2>Safe by design</h2>
            <p className="muted">
              You must be 13 or older. Players under 18 only ever see other players under 18, and adults only see adults.
              That is checked on our server, not just in the page.
            </p>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="final-cta">
          <h2>Your next teammate is one swipe away</h2>
          <Link href="/find" className="btn big">Find players now</Link>
        </section>
      </Reveal>
    </div>
  );
}
