import { NextResponse } from "next/server";
import { db, must, toMessage } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

// ZOMBIE: SECURITY HOLE. Anyone can read any match's private messages by guessing the match id.
// There is no check that the caller is one of the two people in the match. Add sign-in, then
// check the signed-in user belongs to this match before returning anything.
// ZOMBIE: this also returns messages of an UNMATCHED chat. Unmatch only hides the chat in the page.
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const match = must(await db().from("matches").select("*").eq("id", id).maybeSingle());
  if (!match) return NextResponse.json({ error: "No such match." }, { status: 404 });
  const messages = must(await db().from("messages").select("*").eq("match_id", id).order("at"));
  return NextResponse.json({ match, messages: messages.map(toMessage) });
}

// Send a message. Body: { from, text }
export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const text = String(body.text ?? "").trim();
  if (!text) return NextResponse.json({ error: "Message is empty." }, { status: 400 });

  const match = must(await db().from("matches").select("*").eq("id", id).maybeSingle());
  if (!match) return NextResponse.json({ error: "No such match." }, { status: 404 });

  // ZOMBIE: "from" comes from the request body, so anyone can send as anyone.
  // ZOMBIE: no block or report, no spam or abuse filter on messages.
  const row = must(await db().from("messages").insert({
    match_id: id,
    from_id: String(body.from ?? ""),
    text: text.slice(0, 1000),
  }).select().single());
  return NextResponse.json(toMessage(row), { status: 201 });
}
