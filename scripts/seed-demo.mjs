// Adds the 30 demo players (with skins) to a running Miner Finder, through its own API,
// and gives the 10 starter players skins. Safe to run twice: players that already exist are skipped.
//   node scripts/seed-demo.mjs                              (local, http://localhost:3105)
//   node scripts/seed-demo.mjs https://zombie-idk.vercel.app  (the live site)
import { readFileSync } from "node:fs";

const base = (process.argv[2] ?? "http://localhost:3105").replace(/\/$/, "");
const { create, update } = JSON.parse(readFileSync(new URL("../data/demo-players.json", import.meta.url), "utf8"));

async function call(method, path, body) {
  const res = await fetch(base + path, {
    method, headers: { "Content-Type": "application/json" }, body: body && JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path}: ${res.status} ${data.error ?? ""}`);
  return data;
}

const existing = await call("GET", "/api/profiles");
const tags = new Set(existing.map((p) => p.gamertag));

let added = 0;
const newIds = [];
for (const player of create) {
  if (tags.has(player.gamertag)) continue;
  const made = await call("POST", "/api/profiles", player);
  newIds.push(made.id);
  added++;
}

let skinned = 0;
for (const p of existing) {
  if (update[p.id] && !p.skin) { await call("PATCH", `/api/profiles/${p.id}`, { skin: update[p.id] }); skinned++; }
}

// So the demo has something to show: the first 8 new players want to team up with Avery Stone (p1).
// Pretend to be Avery and swipe right on them to make instant teammates.
for (const id of newIds.slice(0, 8)) await call("POST", "/api/swipe", { me: id, target: "p1", action: "like" });

console.log(`${base}: added ${added} players, gave ${skinned} starter players skins, ${Math.min(newIds.length, 8)} want to team up with Avery.`);
