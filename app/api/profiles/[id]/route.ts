import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import { cleanPrompts } from "@/lib/prompts";
import { checkAge, cleanMinecraft } from "@/lib/minecraft";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const db = await readDb();
  const profile = db.profiles.find((p) => p.id === id);
  if (!profile) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json(profile);
}

// Edit a profile.
// ZOMBIE: nobody checks WHO is editing. Anyone can change any profile by id. Add sign-in first.
export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const db = await readDb();
  const profile = db.profiles.find((p) => p.id === id);
  if (!profile) return NextResponse.json({ error: "Not found." }, { status: 404 });

  if (typeof body.name === "string" && body.name.trim()) profile.name = body.name.trim();
  if (body.age) {
    const ageError = checkAge(Number(body.age));
    if (ageError) return NextResponse.json({ error: ageError }, { status: 400 });
    profile.age = Number(body.age);
  }
  if (typeof body.city === "string") profile.city = body.city;
  if (typeof body.bio === "string") profile.bio = body.bio; // ZOMBIE: no text moderation.
  if (typeof body.lookingFor === "string") profile.lookingFor = body.lookingFor;
  if (Array.isArray(body.interests)) profile.interests = body.interests.map(String);
  if (Array.isArray(body.prompts)) profile.prompts = cleanPrompts(body.prompts);
  Object.assign(profile, cleanMinecraft(body));

  await writeDb(db);
  return NextResponse.json(profile);
}
