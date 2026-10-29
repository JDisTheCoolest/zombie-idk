import { NextResponse } from "next/server";
import { cleanPrompts } from "@/lib/prompts";
import { db, must, toProfile, toProfileRow, type Profile } from "@/lib/db";
import { checkAge, cleanMinecraft } from "@/lib/minecraft";
import { checkSkin } from "@/lib/skin";

const COLORS = ["#5d9b3a", "#8b5a2b", "#3aa6b9", "#c28a1c", "#7a4fb5", "#b8326f"];

export async function GET() {
  const rows = must(await db().from("profiles").select("*").order("created_at"));
  return NextResponse.json(rows.map(toProfile));
}

// Create a profile.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim().slice(0, 60);
  const age = Number(body.age);
  if (!name || !age) {
    return NextResponse.json({ error: "Name and age are required." }, { status: 400 });
  }
  const ageError = checkAge(age);
  if (ageError) return NextResponse.json({ error: ageError }, { status: 400 });
  const skin = typeof body.skin === "string" ? body.skin : null;
  const skinError = skin && checkSkin(skin);
  if (skinError) return NextResponse.json({ error: skinError }, { status: 400 });

  const profile: Omit<Profile, "id"> = {
    name,
    age,
    city: String(body.city ?? ""),
    bio: String(body.bio ?? "").slice(0, 500),
    interests: Array.isArray(body.interests) ? body.interests.map(String).slice(0, 10) : [],
    lookingFor: String(body.lookingFor ?? "").slice(0, 200),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    prompts: cleanPrompts(body.prompts),
    gamertag: "", edition: "Java", platforms: [], modes: [], playstyle: "Chill", mic: false, skin,
    ...cleanMinecraft(body),
  };
  // The database picks a random id.
  const row = must(await db().from("profiles").insert(toProfileRow(profile)).select().single());
  return NextResponse.json(toProfile(row), { status: 201 });
}
