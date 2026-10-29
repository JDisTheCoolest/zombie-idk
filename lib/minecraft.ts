import type { Edition, Profile } from "@/lib/db";

// The choices people pick from on their profile. The server only accepts values from these lists.
export const EDITIONS: Edition[] = ["Java", "Bedrock", "Both"];
export const PLATFORMS = ["PC", "Mac", "Xbox", "PlayStation", "Switch", "Mobile"];
export const MODES = [
  "Survival", "Hardcore", "Creative", "SMP", "Modded", "Redstone", "Skyblock",
  "Bedwars", "PvP", "Minigames", "Speedrunning", "Roleplay",
];
export const PLAYSTYLES = ["Builder", "Explorer", "Redstoner", "Fighter", "Farmer", "Miner", "Speedrunner", "Chill"];
export const REGIONS = ["US East", "US West", "US Central", "Canada", "Latin America", "Europe", "UK", "Asia", "Oceania", "Africa"];

// Who can see whom. Kids under 13 can't sign up at all (COPPA), teens only ever see teens,
// and adults only ever see adults. This is checked on the server for the feed, swipes and likes.
export const MIN_AGE = 13;
export type AgeGroup = "teen" | "adult";
export function ageGroup(age: number): AgeGroup {
  return age >= 18 ? "adult" : "teen";
}
export function sameAgeGroup(a: Profile, b: Profile): boolean {
  return ageGroup(a.age) === ageGroup(b.age);
}

// Modes two players both like, for "3 modes in common" on the card and to sort the feed.
export function sharedModes(a: Profile, b: Profile): string[] {
  return a.modes.filter((m) => b.modes.includes(m));
}

// Two editions can play together if they match, or if either side plays both.
export function canCrossPlay(a: Edition, b: Edition): boolean {
  return a === b || a === "Both" || b === "Both";
}

const pick = (list: string[], input: unknown): string[] =>
  Array.isArray(input) ? list.filter((x) => input.map(String).includes(x)) : [];

// Clean the Minecraft fields from a request body. Only set the keys that were sent,
// so PATCH can send part of a profile.
export function cleanMinecraft(body: Record<string, unknown>): Partial<Profile> {
  const out: Partial<Profile> = {};
  if (typeof body.gamertag === "string") out.gamertag = body.gamertag.trim().slice(0, 32);
  if (EDITIONS.includes(body.edition as Edition)) out.edition = body.edition as Edition;
  if (body.platforms !== undefined) out.platforms = pick(PLATFORMS, body.platforms);
  if (body.modes !== undefined) out.modes = pick(MODES, body.modes);
  if (PLAYSTYLES.includes(String(body.playstyle))) out.playstyle = String(body.playstyle);
  if (typeof body.mic === "boolean") out.mic = body.mic;
  return out;
}

// Returns an error message if the age is not allowed, or null if it is fine.
// ZOMBIE: this trusts the number people type. A real launch needs age verification
// and parental consent rules for teens (see ZOMBIE.md section 3).
export function checkAge(age: number): string | null {
  if (!Number.isInteger(age) || age < 1 || age > 120) return "Enter a real age.";
  if (age < MIN_AGE) return `You need to be ${MIN_AGE} or older to use Mine Match.`;
  return null;
}
