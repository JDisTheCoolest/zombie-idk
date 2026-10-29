// ZOMBIE: this "database" is a JSON file on disk. It works on your laptop and
// dies on any real host (Vercel's disk is read-only and wiped on every deploy).
// Replace it with a real database (Supabase, Neon, Postgres...) before you ship.
import { promises as fs } from "fs";
import path from "path";
import seed from "@/data/seed.json";

export type Edition = "Java" | "Bedrock" | "Both";
export type Profile = {
  id: string; name: string; age: number; city: string; bio: string;
  interests: string[]; lookingFor: string; color: string;
  prompts: Prompt[];
  // Minecraft stuff. "city" is used as the region (e.g. "US East") so people can find a good ping.
  gamertag: string; edition: Edition; platforms: string[];
  modes: string[]; playstyle: string; mic: boolean;
};
export type Prompt = { question: string; answer: string };
export type Message = { id: string; matchId: string; from: string; text: string; at: string };
export type Db = {
  profiles: Profile[];
  likes: { from: string; to: string }[];
  passes: { from: string; to: string }[];
  matches: { id: string; a: string; b: string; unmatched?: boolean }[];
  messages: Message[];
};

// ZOMBIE: the live site (Vercel) can't write to the app folder, so it writes to /tmp instead.
// /tmp is wiped whenever the server restarts, and each server copy keeps its own. Use a real database.
const DB_PATH = process.env.VERCEL
  ? path.join("/tmp", "db.json")
  : path.join(process.cwd(), "data", "db.json");

export async function readDb(): Promise<Db> {
  try {
    return JSON.parse(await fs.readFile(DB_PATH, "utf8")) as Db;
  } catch {
    const fresh = structuredClone(seed) as Db;
    await writeDb(fresh);
    return fresh;
  }
}

export async function writeDb(db: Db): Promise<void> {
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
}

export function newId(): string {
  // ZOMBIE: guessable ids. Anyone can walk the list by trying id+1.
  return String(Date.now());
}
