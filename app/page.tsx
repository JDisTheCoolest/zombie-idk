"use client";
// Discover: one player at a time. Team up, Skip or send a Diamond invite.
import { useCallback, useEffect, useState } from "react";
import ProfileCard from "@/components/ProfileCard";
import { useMe } from "@/lib/useMe";
import { MODES } from "@/lib/minecraft";
import type { Profile } from "@/lib/db";

export default function Discover() {
  const me = useMe();
  const [self, setSelf] = useState<Profile | null>(null);
  const [feed, setFeed] = useState<Profile[]>([]);
  const [note, setNote] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState("");
  const [crossplay, setCrossplay] = useState(false);

  const load = useCallback(async () => {
    if (!me) return;
    const query = new URLSearchParams({ me });
    if (mode) query.set("mode", mode);
    if (crossplay) query.set("crossplay", "1");
    const [feedRes, selfRes] = await Promise.all([fetch(`/api/feed?${query}`), fetch(`/api/profiles/${me}`)]);
    setFeed(feedRes.ok ? await feedRes.json() : []);
    setSelf(selfRes.ok ? await selfRes.json() : null);
    setLoaded(true);
  }, [me, mode, crossplay]);

  useEffect(() => { load(); }, [load]);

  async function swipe(action: "like" | "pass" | "super") {
    const card = feed[0];
    if (!card || !me) return;
    const res = await fetch("/api/swipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ me, target: card.id, action }),
    });
    const data = await res.json();
    if (!res.ok) { setNote(data.error); return; } // e.g. Diamond invite: not built yet
    setNote(data.matched && action === "like" ? `You and ${card.name} want to team up! Check your Squad.` : "");
    setFeed(feed.slice(1));
  }

  const card = feed[0];
  const common = card && self ? self.modes.filter((m) => card.modes.includes(m)) : [];
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Find players</h1>
          <p className="sub">Team up or skip. If you both team up, you join each other&apos;s squad and can chat.</p>
        </div>
      </div>
      <div className="filters card">
        <label>Mode
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="">Any mode</option>
            {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <label className="check">
          <input type="checkbox" checked={crossplay} onChange={(e) => setCrossplay(e.target.checked)} />
          Only players I can join{self ? ` (${self.edition === "Both" ? "Java + Bedrock" : self.edition})` : ""}
        </label>
      </div>
      <div className="stats">
        <div className="stat"><span className="stat-num">{loaded ? feed.length : "-"}</span><span className="stat-label">Players to see</span></div>
      </div>
      {!loaded && <p className="muted">Loading chunks...</p>}
      {loaded && !card && (
        <div className="card empty">
          <strong>No players left to show</strong>
          <span className="muted">Try a different mode filter, or switch who you are with the dropdown at the top.</span>
        </div>
      )}
      {card && (
        <ProfileCard profile={card} common={common}>
          <button className="ghost" onClick={() => swipe("pass")}>Skip</button>
          {/* ZOMBIE: Diamond invite is the paid feature. It is not built and not locked to a plan. */}
          <button className="ghost diamond" onClick={() => swipe("super")}>💎 Diamond</button>
          <button onClick={() => swipe("like")}>Team up</button>
        </ProfileCard>
      )}
      {note && <p className="note">{note}</p>}
    </>
  );
}
