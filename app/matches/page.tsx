"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Avatar from "@/components/Avatar";
import { useMe } from "@/lib/useMe";
import { formatTime } from "@/lib/prompts";
import type { Profile } from "@/lib/db";

type Row = { id: string; other: Profile; last: { text: string; at: string; from: string } | null };

export default function MatchesPage() {
  const me = useMe();
  const [rows, setRows] = useState<Row[] | null>(null);

  const load = useCallback(async () => {
    if (!me) return;
    const res = await fetch(`/api/matches?me=${me}`);
    setRows(await res.json());
  }, [me]);

  useEffect(() => { load(); }, [load]);

  async function unmatch(row: Row) {
    if (!window.confirm(`Remove ${row.other.name} from your squad? The chat will be hidden.`)) return;
    await fetch(`/api/matches/${row.id}`, { method: "DELETE" });
    load();
  }

  const chatting = rows?.filter((r) => r.last).length ?? 0;
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Your squad</h1>
          <p className="sub">Players who want to team up with you too. Newest message first.</p>
        </div>
      </div>
      <div className="stats">
        <div className="stat"><span className="stat-num">{rows ? rows.length : "-"}</span><span className="stat-label">Teammates</span></div>
        <div className="stat"><span className="stat-num">{rows ? chatting : "-"}</span><span className="stat-label">Chats started</span></div>
      </div>
      {rows && rows.length === 0 && (
        <div className="card empty">
          <strong>No teammates yet</strong>
          <span className="muted">Go find some players and hit Team up.</span>
          <Link href="/find" className="btn">Find players</Link>
        </div>
      )}
      <div className="list">
        {rows?.map((r) => (
          <div key={r.id} className="card match-row">
            <Link href={`/matches/${r.id}`} className="match-main">
              <Avatar name={r.other.name} color={r.other.color} skin={r.other.skin} size={52} />
              <div className="match-text">
                <div className="match-top">
                  <strong>{r.other.name} <span className="muted small">@{r.other.gamertag}</span></strong>
                  {r.last && <span className="muted small">{formatTime(r.last.at)}</span>}
                </div>
                <div className="muted preview">
                  {r.last ? `${r.last.from === me ? "You: " : ""}${r.last.text}` : "No messages yet. Ask what they want to play."}
                </div>
              </div>
            </Link>
            <button className="ghost small-btn" onClick={() => unmatch(r)}>Remove</button>
          </div>
        ))}
      </div>
    </>
  );
}
