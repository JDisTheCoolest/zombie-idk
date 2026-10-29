import { NextResponse } from "next/server";
import { db, getProfiles, matchesOf, must, otherIn, toMessage } from "@/lib/db";

// My matches for ?me=<profile id>. Each has the other person's profile and the last message.
// Sorted by the latest message, newest first. Unmatched people are left out.
export async function GET(req: Request) {
  const me = new URL(req.url).searchParams.get("me");
  if (!me) return NextResponse.json({ error: "Missing ?me=" }, { status: 400 });

  const live = (await matchesOf(me)).filter((m) => !m.unmatched);
  if (live.length === 0) return NextResponse.json([]);
  const [people, messages] = await Promise.all([
    getProfiles(live.map((m) => otherIn(m, me))),
    db().from("messages").select("*").in("match_id", live.map((m) => m.id)).order("at", { ascending: false }),
  ]);
  const all = must(messages).map(toMessage);

  const mine = live.map((m) => {
    const other = people.find((p) => p.id === otherIn(m, me));
    const last = all.find((x) => x.matchId === m.id); // newest first, so the first one is the last message
    return { id: m.id, other, last: last ? { text: last.text, at: last.at, from: last.from } : null };
  }).filter((row) => row.other);
  mine.sort((x, y) => (y.last?.at ?? "").localeCompare(x.last?.at ?? ""));
  return NextResponse.json(mine);
}
