import { NextResponse } from "next/server";
import { cleanPrompts } from "@/lib/prompts";
import { newId, readDb, writeDb, type Profile } from "@/lib/db";
import { checkAge, cleanMinecraft } from "@/lib/minecraft";

const COLORS = ["#5d9b3a", "#8b5a2b", "#3aa6b9", "#c28a1c", "#7a4fb5", "#b8326f"];

export async function GET() {
  const db = await readDb();
  return NextResponse.json(db.profiles);
}

// Create a profile.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const age = Number(body.age);
  if (!name || !age) {
    return NextResponse.json({ error: "Name and age are required." }, { status: 400 });
  }
  const ageError = checkAge(age);
  if (ageError) return NextResponse.json({ error: ageError }, { status: 400 });
  const db = await readDb();
  const profile: Profile = {
    id: newId(),
    name,
    age,
    city: String(body.city ?? ""),
    bio: String(body.bio ?? ""),
    interests: Array.isArray(body.interests) ? body.interests.map(String) : [],
    lookingFor: String(body.lookingFor ?? ""),
    color: COLORS[db.profiles.length % COLORS.length],
    prompts: cleanPrompts(body.prompts),
    gamertag: "", edition: "Java", platforms: [], modes: [], playstyle: "Chill", mic: false,
    ...cleanMinecraft(body),
  };
  db.profiles.push(profile);
  await writeDb(db);
  return NextResponse.json(profile, { status: 201 });
}
