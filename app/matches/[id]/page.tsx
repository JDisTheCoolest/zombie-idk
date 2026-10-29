"use client";
// A simple chat thread with one teammate.
import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import Avatar from "@/components/Avatar";
import { useMe } from "@/lib/useMe";
import { formatTime } from "@/lib/prompts";
import type { Message, Profile } from "@/lib/db";

type MatchInfo = { id: string; a: string; b: string; unmatched?: boolean };

export default function Chat({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const me = useMe();
  const [messages, setMessages] = useState<Message[]>([]);
  const [match, setMatch] = useState<MatchInfo | null>(null);
  const [other, setOther] = useState<Profile | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/matches/${id}/messages`);
    if (!res.ok) return setError("No such match.");
    const data = await res.json();
    setMessages(data.messages);
    setMatch(data.match);
  }, [id]);

  // ZOMBIE: chat does not update live. It loads once. You must refresh the page to see new
  // messages. To do: poll every few seconds, or use websockets / Supabase Realtime.
  useEffect(() => { load(); }, [load]);

  // Find out who the other person is.
  useEffect(() => {
    if (!match || !me) return;
    const otherId = match.a === me ? match.b : match.a;
    fetch(`/api/profiles/${otherId}`).then((r) => r.json()).then(setOther);
  }, [match, me]);

  async function send() {
    if (!text.trim() || !me) return;
    await fetch(`/api/matches/${id}/messages`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from: me, text }),
    });
    setText("");
    load();
  }

  async function unmatch() {
    if (!window.confirm("Remove from your squad? The chat will be hidden.")) return;
    await fetch(`/api/matches/${id}`, { method: "DELETE" });
    load();
  }

  // ZOMBIE: no block or report button here. Every app where strangers chat needs both.
  return (
    <>
      <p style={{ margin: "0 0 12px" }}><Link href="/matches">Back to squad</Link></p>
      <div className="page-head">
        <div className="row">
          {other && <Avatar name={other.name} color={other.color} size={52} />}
          <div>
            <h1>{other ? other.name : "Chat"}</h1>
            <p className="sub" style={{ margin: 0 }}>Refresh the page to see new messages (not live yet).</p>
          </div>
        </div>
        {match && !match.unmatched && <button className="ghost" onClick={unmatch}>Remove</button>}
      </div>
      {error && <p className="error">{error}</p>}
      {match?.unmatched ? (
        <div className="card empty" style={{ maxWidth: 520 }}>
          <strong>You removed this player from your squad</strong>
          <span className="muted">The chat is hidden.</span>
          <Link href="/matches" className="btn">Back to squad</Link>
        </div>
      ) : (
        <div className="card stack" style={{ maxWidth: 520 }}>
          {messages.map((m) => (
            <div key={m.id} className="msg">
              <div className={m.from === me ? "bubble me" : "bubble"}>{m.text}</div>
              <div className={m.from === me ? "msg-time right" : "msg-time"}>{formatTime(m.at)}</div>
            </div>
          ))}
          {messages.length === 0 && !error && <span className="muted">Say hi and pick a mode.</span>}
          <div className="row nowrap">
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Send a message (server IP, what to play...)"
              onKeyDown={(e) => e.key === "Enter" && send()} />
            <button onClick={send}>Send</button>
          </div>
        </div>
      )}
    </>
  );
}
