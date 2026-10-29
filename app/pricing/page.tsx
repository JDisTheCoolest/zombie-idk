"use client";
import { useState } from "react";

// Prices are placeholders.
// ZOMBIE: no prices yet. Pick your prices, create matching Prices in Stripe (test mode),
// and show them here.
const PLANS = [
  { id: "plus", name: "Iron", price: "Set your price", perks: ["Unlimited team-ups", "5 Diamond invites a week", "Featured on Find players"] },
  { id: "premium", name: "Netherite", price: "Set your price", perks: ["Everything in Iron", "See who wants to team up", "Unlimited Diamond invites"] },
];

export default function PricingPage() {
  const [error, setError] = useState("");

  async function buy(plan: string) {
    setError("");
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setError(data.error ?? "Checkout failed.");
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Pricing</h1>
          <p className="sub">Free to play. Upgrades unlock once Stripe works.</p>
        </div>
      </div>
      <div className="grid">
        {PLANS.map((p) => (
          <div key={p.id} className="card stack">
            <strong>{p.name}</strong>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{p.price}</div>
            <ul className="muted" style={{ margin: 0, paddingLeft: 18 }}>
              {p.perks.map((perk) => <li key={perk}>{perk}</li>)}
            </ul>
            <button onClick={() => buy(p.id)}>Buy {p.name}</button>
          </div>
        ))}
      </div>
      {error && <p className="error">{error}</p>}
    </>
  );
}
