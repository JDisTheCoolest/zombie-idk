"use client";
// Drag a card left to skip or right to team up. Works with a mouse, a finger or a pen.
// The parent can also call ref.current.swipe("left" | "right") from a button or a key.
import { useImperativeHandle, useRef, useState, type ReactNode, type Ref } from "react";

export type Direction = "left" | "right";
export type SwipeHandle = { swipe: (dir: Direction) => void };

type Props = {
  children: ReactNode;
  // Return false to put the card back (for example when the server said no).
  onSwipe: (dir: Direction) => Promise<boolean>;
  ref?: Ref<SwipeHandle>;
};

const THRESHOLD = 110; // px of drag before letting go counts as a swipe
const FLY_MS = 280;

export default function SwipeCard({ children, onSwipe, ref }: Props) {
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [leaving, setLeaving] = useState<Direction | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);

  async function fly(dir: Direction) {
    if (leaving) return;
    setLeaving(dir);
    // Talk to the server while the card flies away, then wait for both.
    const [ok] = await Promise.all([onSwipe(dir), new Promise((r) => setTimeout(r, FLY_MS))]);
    if (!ok) { setLeaving(null); setDrag({ x: 0, y: 0 }); }
  }

  useImperativeHandle(ref, () => ({ swipe: fly }));

  function down(e: React.PointerEvent<HTMLDivElement>) {
    if (leaving || e.button !== 0) return;
    // Let buttons and links under the card work as normal.
    if ((e.target as HTMLElement).closest("button, a, input, select, textarea")) return;
    start.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  }

  function move(e: React.PointerEvent<HTMLDivElement>) {
    if (!start.current) return;
    setDrag({ x: e.clientX - start.current.x, y: (e.clientY - start.current.y) * 0.25 });
  }

  function up() {
    if (!start.current) return;
    start.current = null;
    setDragging(false);
    if (Math.abs(drag.x) > THRESHOLD) fly(drag.x > 0 ? "right" : "left");
    else setDrag({ x: 0, y: 0 });
  }

  const x = leaving ? (leaving === "right" ? 1 : -1) * (typeof window === "undefined" ? 800 : window.innerWidth) : drag.x;
  const lean = leaving ? (leaving === "right" ? 1 : -1) : Math.min(Math.abs(drag.x) / THRESHOLD, 1) * Math.sign(drag.x);

  return (
    <div
      className={`swipe-card${dragging ? " dragging" : ""}`}
      style={{
        transform: `translate(${x}px, ${drag.y}px) rotate(${x / 18}deg)`,
        transition: dragging ? "none" : `transform ${FLY_MS}ms ease-out, opacity ${FLY_MS}ms ease-out`,
        opacity: leaving ? 0 : 1,
      }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
    >
      <div className="stamp stamp-yes" style={{ opacity: Math.max(lean, 0) }}>Team up</div>
      <div className="stamp stamp-no" style={{ opacity: Math.max(-lean, 0) }}>Skip</div>
      {children}
    </div>
  );
}
