import { NextResponse } from "next/server";
import { db, getProfile, getProfiles, matchesOf, must, otherIn } from "@/lib/db";
import { sameAgeGroup } from "@/lib/minecraft";

// Everyone who liked ?me=<profile id> and is not a match yet. This is the paid "Requests" feature.
// ZOMBIE: BUG. The page blurs the cards, but this response has the real names, ages, cities and
// prompts in plain JSON. Open the Network tab and read them for free. Also nothing checks that
// the caller paid. Fix: only send the real data after a paid plan is confirmed (send a count or
// blank cards to free users), and check the signed-in user server side.
export async function GET(req: Request) {
  const me = new URL(req.url).searchParams.get("me");
  if (!me) return NextResponse.json({ error: "Missing ?me=" }, { status: 400 });

  const self = await getProfile(me);
  if (!self) return NextResponse.json({ error: "No such profile." }, { status: 404 });
  const [likes, matches] = await Promise.all([
    db().from("likes").select("from_id").eq("to_id", me).order("created_at", { ascending: false }),
    matchesOf(me),
  ]);
  const matched = new Set(matches.map((m) => otherIn(m, me)));
  const ids = must(likes).map((l) => l.from_id).filter((id) => !matched.has(id));
  const fans = (await getProfiles(ids)).filter((p) => sameAgeGroup(self, p));
  return NextResponse.json(fans);
}
