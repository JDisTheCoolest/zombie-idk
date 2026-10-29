"use client";
// Discover: one player at a time. Drag right (or →) to team up, left (or ←) to skip.
// A Diamond invite is a button only.
import { useCallback, useEffect, useRef, useState } from "react";
import ProfileCard from "@/components/ProfileCard";
import SwipeCard, { type Direction, type SwipeHandle } from "@/components/SwipeCard";
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
  const swipeRef = useRef<SwipeHandle>(null);

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

  // Returns true if the card should leave the screen.
  async function swipe(action: "like" | "pass" | "super"): Promise<boolean> {
    const card = feed[0];
    if (!card || !me) return false;
    const res = await fetch("/api/swipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ me, target: card.id, action }),
    }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    if (!res?.ok) { setNote(data?.error ?? "Could not reach the server. Try again."); return false; } // e.g. Diamond invite: not built yet
    setNote(data.matched && action === "like" ? `You and ${card.name} want to team up! Check your Squad.` : "");
    setFeed((f) => f.slice(1));
    return true;
  }

  const onSwipe = (dir: Direction) => swipe(dir === "right" ? "like" : "pass");

  // Arrow keys swipe too (but not while typing in a box).
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if ((e.target as HTMLElement).closest("input, select, textarea")) return;
      if (e.key === "ArrowRight") swipeRef.current?.swipe("right");
      if (e.key === "ArrowLeft") swipeRef.current?.swipe("left");
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  const card = feed[0];
  const common = card && self ? self.modes.filter((m) => card.modes.includes(m)) : [];
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Find players</h1>
          <p className="sub">Swipe right to team up, left to skip (or use the arrow keys). If you both team up, you join each other&apos;s squad and can chat.</p>
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
        <SwipeCard key={card.id} ref={swipeRef} onSwipe={onSwipe}>
          <ProfileCard profile={card} common={common}>
            <button className="ghost" onClick={() => swipeRef.current?.swipe("left")}>← Skip</button>
            {/* ZOMBIE: Diamond invite is the paid feature. It is not built and not locked to a plan. */}
            <button className="ghost diamond" onClick={() => swipe("super")}>💎 Diamond</button>
            <button onClick={() => swipeRef.current?.swipe("right")}>Team up →</button>
          </ProfileCard>
        </SwipeCard>
      )}
      {note && <p className="note">{note}</p>}
    </>
  );
}
