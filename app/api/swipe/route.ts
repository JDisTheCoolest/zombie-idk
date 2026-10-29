import { NextResponse } from "next/server";
import { db, getProfiles, must } from "@/lib/db";
import { sameAgeGroup } from "@/lib/minecraft";

// Team up with (like) or skip (pass) someone. Body: { me, target, action: "like" | "pass" | "super" }
export async function POST(req: Request) {
  const { me, target, action } = await req.json().catch(() => ({}));
  if (typeof me !== "string" || typeof target !== "string" || me === target) {
    return NextResponse.json({ error: "Need me and a different target." }, { status: 400 });
  }

  // ZOMBIE: "Diamond invite" (the super like) is the paid feature. It is not built, and it is not locked to a plan either.
  // To do: build it (put the person first in their feed), then check the user's Stripe plan here.
  if (action === "super") {
    return NextResponse.json({ error: "Diamond invite: not built yet, see ZOMBIE.md" }, { status: 501 });
  }
  if (action !== "like" && action !== "pass") return NextResponse.json({ error: "Unknown action." }, { status: 400 });

  const both = await getProfiles([me, target]);
  const self = both.find((p) => p.id === me);
  const other = both.find((p) => p.id === target);
  if (!self || !other) return NextResponse.json({ error: "No such profile." }, { status: 404 });
  // Teens and adults can never connect, even by calling the API directly.
  if (!sameAgeGroup(self, other)) return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  const pair = { from_id: me, to_id: target };
  if (action === "pass") {
    must(await db().from("passes").upsert(pair, { ignoreDuplicates: true }));
    return NextResponse.json({ matched: false });
  }

  must(await db().from("likes").upsert(pair, { ignoreDuplicates: true }));

  // A mutual like makes a match.
  const theyLikeMe = must(await db().from("likes").select("from_id").eq("from_id", target).eq("to_id", me));
  const findMatch = async () =>
    must(await db().from("matches").select("*").in("a", [me, target]).in("b", [me, target]).maybeSingle());
  let match = await findMatch();
  if (theyLikeMe.length > 0 && !match) {
    const { error } = await db().from("matches").insert({ a: me, b: target });
    // 23505 = the other person's like made the match at the same moment. Use theirs.
    if (error && error.code !== "23505") throw new Error(error.message);
    match = await findMatch();
  }
  return NextResponse.json({ matched: Boolean(match), match: match ?? null });
}
