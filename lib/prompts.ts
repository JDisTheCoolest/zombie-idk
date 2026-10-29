import type { Prompt } from "@/lib/db";

// The list of profile prompts people can pick from. Each profile answers 3 of them.
export const PROMPTS = [
  "My dream build",
  "My first night strategy",
  "I'm weirdly good at",
  "We'll get along if",
  "My worst creeper disaster",
  "Server I keep going back to",
  "The mod I can't play without",
];

// A short "Oct 28, 6:07 PM" style time for lists and chat.
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

// Keep up to 3 prompt answers: [{ question, answer }].
// ZOMBIE: the question is not checked against the list in lib/prompts.ts, and the answer has no moderation.
export function cleanPrompts(input: unknown): Prompt[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((p) => ({ question: String(p?.question ?? ""), answer: String(p?.answer ?? "").slice(0, 300) }))
    .filter((p) => p.question && p.answer.trim())
    .slice(0, 3);
}

