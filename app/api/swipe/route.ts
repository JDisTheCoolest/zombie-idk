import { NextResponse } from "next/server";
import { newId, readDb, writeDb } from "@/lib/db";
import { sameAgeGroup } from "@/lib/minecraft";

// Team up with (like) or skip (pass) someone. Body: { me, target, action: "like" | "pass" | "super" }
export async function POST(req: Request) {
  const { me, target, action } = await req.json().catch(() => ({}));
  if (!me || !target || me === target) {
    return NextResponse.json({ error: "Need me and a different target." }, { status: 400 });
  }

  // ZOMBIE: "Diamond invite" (the super like) is the paid feature. It is not built, and it is not locked to a plan either.
  // To do: build it (put the person first in their feed), then check the user's Stripe plan here.
  if (action === "super") {
    return NextResponse.json({ error: "Diamond invite: not built yet, see ZOMBIE.md" }, { status: 501 });
  }

  const db = await readDb();
  const self = db.profiles.find((p) => p.id === me);
  const other = db.profiles.find((p) => p.id === target);
  if (!self || !other) return NextResponse.json({ error: "No such profile." }, { status: 404 });
  // Teens and adults can never connect, even by calling the API directly.
  if (!sameAgeGroup(self, other)) return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  if (action === "pass") {
    db.passes.push({ from: me, to: target });
    await writeDb(db);
    return NextResponse.json({ matched: false });
  }

  if (action !== "like") return NextResponse.json({ error: "Unknown action." }, { status: 400 });

  if (!db.likes.some((l) => l.from === me && l.to === target)) db.likes.push({ from: me, to: target });

  // A mutual like makes a match.
  const theyLikeMe = db.likes.some((l) => l.from === target && l.to === me);
  const existing = db.matches.find((m) => (m.a === me && m.b === target) || (m.a === target && m.b === me));
  let match = existing;
  if (theyLikeMe && !existing) {
    match = { id: newId(), a: me, b: target };
    db.matches.push(match);
  }
  await writeDb(db);
  return NextResponse.json({ matched: Boolean(match), match: match ?? null });
}
