// Data lives in Supabase (Postgres). The tables are in supabase/setup.sql.
// Only the server talks to the database, with the secret key, so this file must never be
// imported from a "use client" component (types are fine).
import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type Edition = "Java" | "Bedrock" | "Both";
export type Profile = {
  id: string; name: string; age: number; city: string; bio: string;
  interests: string[]; lookingFor: string; color: string;
  prompts: Prompt[];
  // Minecraft stuff. "city" is used as the region (e.g. "US East") so people can find a good ping.
  gamertag: string; edition: Edition; platforms: string[];
  modes: string[]; playstyle: string; mic: boolean;
  skin: string | null; // a 64x64 Minecraft skin PNG as a data: URL
};
export type Prompt = { question: string; answer: string };
export type Message = { id: string; matchId: string; from: string; text: string; at: string };
export type Match = { id: string; a: string; b: string; unmatched: boolean };

let client: SupabaseClient | null = null;

export function db(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Set SUPABASE_URL and SUPABASE_SECRET_KEY (see .env.example).");
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

// Throw on a Supabase error so API routes don't quietly return empty data.
export function must<T>({ data, error }: { data: T; error: { message: string } | null }): NonNullable<T> {
  if (error) throw new Error(error.message);
  return data as NonNullable<T>;
}

// The database uses snake_case columns. These turn rows into the shapes the app uses.
type ProfileRow = Omit<Profile, "lookingFor"> & { looking_for: string };
export function toProfile(r: ProfileRow): Profile {
  return {
    id: r.id, name: r.name, age: r.age, city: r.city, bio: r.bio, interests: r.interests,
    lookingFor: r.looking_for, color: r.color, prompts: r.prompts, gamertag: r.gamertag,
    edition: r.edition, platforms: r.platforms, modes: r.modes, playstyle: r.playstyle, mic: r.mic,
    skin: r.skin ?? null,
  };
}

// Turn (part of) a Profile into a row to insert or update.
export function toProfileRow(p: Partial<Profile>): Partial<ProfileRow> {
  const { lookingFor, ...rest } = p;
  return lookingFor === undefined ? rest : { ...rest, looking_for: lookingFor };
}

type MessageRow = { id: string; match_id: string; from_id: string; text: string; at: string };
export function toMessage(r: MessageRow): Message {
  return { id: r.id, matchId: r.match_id, from: r.from_id, text: r.text, at: r.at };
}

export async function getProfile(id: string): Promise<Profile | null> {
  const row = must(await db().from("profiles").select("*").eq("id", id).maybeSingle());
  return row ? toProfile(row) : null;
}

export async function getProfiles(ids: string[]): Promise<Profile[]> {
  if (ids.length === 0) return [];
  return must(await db().from("profiles").select("*").in("id", ids)).map(toProfile);
}

// Every match (including unmatched ones) that this person is in.
export async function matchesOf(me: string): Promise<Match[]> {
  const [asA, asB] = await Promise.all([
    db().from("matches").select("*").eq("a", me),
    db().from("matches").select("*").eq("b", me),
  ]);
  return [...must(asA), ...must(asB)];
}

export function otherIn(m: Match, me: string): string {
  return m.a === me ? m.b : m.a;
}
