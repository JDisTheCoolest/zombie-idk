import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";
import { canCrossPlay, sameAgeGroup, sharedModes } from "@/lib/minecraft";

// The discover feed for ?me=<profile id>.
// Optional filters: &mode=<mode> (they play that mode) and &crossplay=1 (their edition works with mine).
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const me = params.get("me");
  if (!me) return NextResponse.json({ error: "Missing ?me=" }, { status: 400 });
  const mode = params.get("mode");
  const crossplay = params.get("crossplay") === "1";

  const db = await readDb();
  const self = db.profiles.find((p) => p.id === me);
  if (!self) return NextResponse.json({ error: "No such profile." }, { status: 404 });

  const seen = new Set([
    ...db.likes.filter((l) => l.from === me).map((l) => l.to),
    ...db.passes.filter((l) => l.from === me).map((l) => l.to),
    ...db.matches.flatMap((m) => (m.a === me ? [m.b] : m.b === me ? [m.a] : [])),
  ]);

  // Teens only see teens and adults only see adults. Most modes in common come first.
  const feed = db.profiles
    .filter((p) => p.id !== me && !seen.has(p.id) && sameAgeGroup(self, p))
    .filter((p) => !mode || p.modes.includes(mode))
    .filter((p) => !crossplay || canCrossPlay(self.edition, p.edition))
    .sort((a, b) => sharedModes(self, b).length - sharedModes(self, a).length);
  return NextResponse.json(feed);
}
