"use client";
// Create a new player profile, or edit the one you are pretending to be.
import { useEffect, useState } from "react";
import ProfileCard from "@/components/ProfileCard";
import { PROMPTS } from "@/lib/prompts";
import { EDITIONS, MIN_AGE, MODES, PLATFORMS, PLAYSTYLES, REGIONS } from "@/lib/minecraft";
import { setMe, useMe } from "@/lib/useMe";
import type { Edition, Prompt } from "@/lib/db";

const EMPTY = { name: "", age: "", city: REGIONS[0], bio: "", interests: "", lookingFor: "", gamertag: "", playstyle: PLAYSTYLES[0] };
const EMPTY_MC = { edition: "Java" as Edition, platforms: [] as string[], modes: [] as string[], mic: false };
// Three prompt slots. Each starts on a different question.
const EMPTY_PROMPTS: Prompt[] = [0, 1, 2].map((i) => ({ question: PROMPTS[i], answer: "" }));

export default function ProfilePage() {
  const me = useMe();
  const [form, setForm] = useState(EMPTY);
  const [prompts, setPrompts] = useState<Prompt[]>(EMPTY_PROMPTS);
  const [mc, setMc] = useState(EMPTY_MC);
  const [color, setColor] = useState("#5d9b3a");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!me) return;
    fetch(`/api/profiles/${me}`).then((r) => r.json()).then((p) => {
      setForm({ ...EMPTY, ...p, age: String(p.age), interests: (p.interests ?? []).join(", ") });
      setMc({ edition: p.edition ?? "Java", platforms: p.platforms ?? [], modes: p.modes ?? [], mic: Boolean(p.mic) });
      setColor(p.color ?? "#5d9b3a");
      const saved: Prompt[] = p.prompts ?? [];
      setPrompts([0, 1, 2].map((i) => saved[i] ?? EMPTY_PROMPTS[i]));
    });
  }, [me]);

  function set(key: keyof typeof EMPTY, value: string) {
    setForm({ ...form, [key]: value });
  }

  // Tick or untick one item in a multi-pick list (platforms, modes).
  function toggle(key: "platforms" | "modes", value: string) {
    const list = mc[key];
    setMc({ ...mc, [key]: list.includes(value) ? list.filter((x) => x !== value) : [...list, value] });
  }

  function setPrompt(i: number, change: Partial<Prompt>) {
    setPrompts(prompts.map((p, n) => (n === i ? { ...p, ...change } : p)));
  }

  function payload() {
    return {
      ...form,
      age: Number(form.age),
      interests: form.interests.split(",").map((s) => s.trim()).filter(Boolean),
      prompts,
      ...mc,
    };
  }

  async function save() {
    setMsg("");
    const res = await fetch(`/api/profiles/${me}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload()),
    });
    const data = await res.json();
    setMsg(res.ok ? "Saved." : data.error ?? "Could not save.");
  }

  async function createNew() {
    setMsg("");
    const res = await fetch("/api/profiles", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload()),
    });
    const data = await res.json();
    if (!res.ok) return setMsg(data.error);
    setMe(data.id); // switch to the new profile
    setMsg("Created. You are now this person.");
    setTimeout(() => window.location.reload(), 600); // refresh the dropdown list
  }

  const preview = {
    id: "preview", color, name: form.name || "Your name", age: Number(form.age) || 0, city: form.city,
    gamertag: form.gamertag, playstyle: form.playstyle, ...mc,
    bio: form.bio, lookingFor: form.lookingFor, prompts: prompts.filter((p) => p.answer.trim()),
    interests: form.interests.split(",").map((s) => s.trim()).filter(Boolean),
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>My profile</h1>
          <p className="sub">Edit the player you are pretending to be, or fill the form and create a new one.</p>
        </div>
      </div>
      <div className="two-col">
        <div className="card stack">
          <label>Name<input value={form.name} onChange={(e) => set("name", e.target.value)} /></label>
          <label>Gamertag / IGN<input value={form.gamertag} onChange={(e) => set("gamertag", e.target.value)} placeholder="Steve" /></label>
          <label>Age<input type="number" min={MIN_AGE} value={form.age} onChange={(e) => set("age", e.target.value)} /></label>
          <p className="muted small" style={{ margin: 0 }}>
            You must be {MIN_AGE}+. Players under 18 only see other players under 18, and adults only see adults.
          </p>
          <label>Region
            <select value={form.city} onChange={(e) => set("city", e.target.value)}>
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <div className="row">
            <label style={{ flex: 1 }}>Edition
              <select value={mc.edition} onChange={(e) => setMc({ ...mc, edition: e.target.value as Edition })}>
                {EDITIONS.map((x) => <option key={x} value={x}>{x === "Both" ? "Java + Bedrock" : x}</option>)}
              </select>
            </label>
            <label style={{ flex: 1 }}>Playstyle
              <select value={form.playstyle} onChange={(e) => set("playstyle", e.target.value)}>
                {PLAYSTYLES.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
            </label>
          </div>
          <fieldset className="chips">
            <legend>Platforms</legend>
            {PLATFORMS.map((x) => (
              <button type="button" key={x} className={mc.platforms.includes(x) ? "chip on" : "chip"}
                aria-pressed={mc.platforms.includes(x)} onClick={() => toggle("platforms", x)}>{x}</button>
            ))}
          </fieldset>
          <fieldset className="chips">
            <legend>Modes you play</legend>
            {MODES.map((x) => (
              <button type="button" key={x} className={mc.modes.includes(x) ? "chip on" : "chip"}
                aria-pressed={mc.modes.includes(x)} onClick={() => toggle("modes", x)}>{x}</button>
            ))}
          </fieldset>
          <label className="check">
            <input type="checkbox" checked={mc.mic} onChange={(e) => setMc({ ...mc, mic: e.target.checked })} />
            I use voice chat
          </label>
          <label>Bio<textarea rows={3} value={form.bio} onChange={(e) => set("bio", e.target.value)} /></label>
          <label>Favorite things (comma separated)<input value={form.interests} placeholder="shaders, villager trading, Create mod" onChange={(e) => set("interests", e.target.value)} /></label>
          <label>Looking for<input value={form.lookingFor} placeholder="A duo for a hardcore world" onChange={(e) => set("lookingFor", e.target.value)} /></label>
          <h2 style={{ margin: "10px 0 0" }}>Prompts</h2>
          <p className="muted" style={{ margin: 0 }}>Pick 3 and answer them. These show on your card.</p>
          {prompts.map((p, i) => (
            <div key={i} className="stack">
              <select value={p.question} onChange={(e) => setPrompt(i, { question: e.target.value })}>
                {PROMPTS.map((q) => <option key={q} value={q}>{q}</option>)}
              </select>
              <textarea rows={2} value={p.answer} placeholder="Your answer"
                onChange={(e) => setPrompt(i, { answer: e.target.value })} />
            </div>
          ))}
          {/* ZOMBIE: the age is whatever people type. Nobody verifies it yet. */}
          <div className="row">
            <button onClick={save}>Save changes</button>
            <button className="ghost" onClick={createNew}>Create as new profile</button>
          </div>
          {msg && <p className="note">{msg}</p>}
        </div>
        <div className="stack" style={{ alignContent: "start" }}>
          <strong>How your player card looks</strong>
          <ProfileCard profile={preview} />
        </div>
      </div>
    </>
  );
}
