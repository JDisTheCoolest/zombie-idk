import { NextResponse } from "next/server";
import { db, getProfile, matchesOf, must, otherIn, toProfile } from "@/lib/db";
import { canCrossPlay, sharedModes } from "@/lib/minecraft";

// The discover feed for ?me=<profile id>.
// Optional filters: &mode=<mode> (they play that mode) and &crossplay=1 (their edition works with mine).
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const me = params.get("me");
  if (!me) return NextResponse.json({ error: "Missing ?me=" }, { status: 400 });
  const mode = params.get("mode");
  const crossplay = params.get("crossplay") === "1";

  const self = await getProfile(me);
  if (!self) return NextResponse.json({ error: "No such profile." }, { status: 404 });

  // Teens only see teens and adults only see adults.
  let query = db().from("profiles").select("*").neq("id", me);
  query = self.age >= 18 ? query.gte("age", 18) : query.lt("age", 18);
  if (mode) query = query.contains("modes", [mode]);

  const [people, likes, passes, matches] = await Promise.all([
    query,
    db().from("likes").select("to_id").eq("from_id", me),
    db().from("passes").select("to_id").eq("from_id", me),
    matchesOf(me),
  ]);
  const seen = new Set([
    ...must(likes).map((l) => l.to_id),
    ...must(passes).map((l) => l.to_id),
    ...matches.map((m) => otherIn(m, me)),
  ]);

  // Most modes in common come first.
  const feed = must(people).map(toProfile)
    .filter((p) => !seen.has(p.id))
    .filter((p) => !crossplay || canCrossPlay(self.edition, p.edition))
    .sort((a, b) => sharedModes(self, b).length - sharedModes(self, a).length);
  return NextResponse.json(feed);
}
