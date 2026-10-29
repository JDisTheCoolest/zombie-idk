import { NextResponse } from "next/server";
import { db, getProfile, must, toProfile, toProfileRow, type Profile } from "@/lib/db";
import { cleanPrompts } from "@/lib/prompts";
import { checkAge, cleanMinecraft } from "@/lib/minecraft";
import { checkSkin } from "@/lib/skin";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const profile = await getProfile(id);
  if (!profile) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json(profile);
}

// Edit a profile.
// ZOMBIE: nobody checks WHO is editing. Anyone can change any profile by id. Add sign-in first.
export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const change: Partial<Profile> = {};

  if (typeof body.name === "string" && body.name.trim()) change.name = body.name.trim().slice(0, 60);
  if (body.age) {
    const ageError = checkAge(Number(body.age));
    if (ageError) return NextResponse.json({ error: ageError }, { status: 400 });
    change.age = Number(body.age);
  }
  if (typeof body.city === "string") change.city = body.city;
  if (typeof body.bio === "string") change.bio = body.bio.slice(0, 500); // ZOMBIE: no text moderation.
  if (typeof body.lookingFor === "string") change.lookingFor = body.lookingFor.slice(0, 200);
  if (Array.isArray(body.interests)) change.interests = body.interests.map(String).slice(0, 10);
  if (Array.isArray(body.prompts)) change.prompts = cleanPrompts(body.prompts);
  Object.assign(change, cleanMinecraft(body));
  // A skin is optional: send a PNG data: URL to set it, or null to remove it.
  // ZOMBIE: skins are checked for size and format, but not moderated.
  if (body.skin === null) change.skin = null;
  else if (typeof body.skin === "string") {
    const skinError = checkSkin(body.skin);
    if (skinError) return NextResponse.json({ error: skinError }, { status: 400 });
    change.skin = body.skin;
  }

  const row = must(await db().from("profiles").update(toProfileRow(change)).eq("id", id).select().maybeSingle());
  if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json(toProfile(row));
}
