"use client";
// Requests: who wants to team up with you. The paid feature. Free users see blurred cards and an upgrade button.
import { useEffect, useState } from "react";
import ProfileCard from "@/components/ProfileCard";
import { useMe } from "@/lib/useMe";
import type { Profile } from "@/lib/db";

export default function LikesPage() {
  const me = useMe();
  const [fans, setFans] = useState<Profile[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!me) return;
    fetch(`/api/likes?me=${me}`).then((r) => r.json()).then(setFans);
  }, [me]);

  async function upgrade() {
    setError("");
    const res = await fetch("/api/checkout", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: "premium" }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setError(data.error ?? "Checkout failed.");
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Team-up requests</h1>
          <p className="sub">Players who want to team up with you. Team up back on Find players to join squads.</p>
        </div>
        <button onClick={upgrade}>Upgrade to see who wants to team up</button>
      </div>
      <div className="stats">
        <div className="stat"><span className="stat-num">{fans ? fans.length : "-"}</span><span className="stat-label">Requests waiting</span></div>
        <div className="stat"><span className="stat-num">Premium</span><span className="stat-label">Plan needed</span></div>
      </div>
      {error && <p className="error">{error}</p>}
      {fans && fans.length === 0 && (
        <div className="card empty">
          <strong>No requests right now</strong>
          <span className="muted">When someone wants to team up with you, they show up here.</span>
        </div>
      )}
      <div className="grid cards">
        {fans?.map((p) => <ProfileCard key={p.id} profile={p} blurred compact />)}
      </div>
    </>
  );
}
