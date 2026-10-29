"use client";
// Draws a Minecraft skin from the front, like the player stands in game: the whole body,
// or just the head for small avatars. Skins are 64x64 PNGs (old ones are 64x32).
import { useEffect, useRef } from "react";

type Part = [sx: number, sy: number, w: number, h: number, dx: number, dy: number];

// Where each front face is on the skin, and where it goes on a 16 x 32 front view.
// "Right" means the player's right, which is on the viewer's left.
const BASE: Part[] = [
  [8, 8, 8, 8, 4, 0],    // head
  [20, 20, 8, 12, 4, 8], // body
  [44, 20, 4, 12, 0, 8], // right arm
  [4, 20, 4, 12, 4, 20], // right leg
];
const NEW_64: Part[] = [
  [36, 52, 4, 12, 12, 8], // left arm
  [20, 52, 4, 12, 8, 20], // left leg
];
// The second layer (hat, jacket, sleeves, pants) goes on top.
const OVERLAY_64: Part[] = [
  [40, 8, 8, 8, 4, 0], [20, 36, 8, 12, 4, 8], [44, 36, 4, 12, 0, 8],
  [52, 52, 4, 12, 12, 8], [4, 36, 4, 12, 4, 20], [4, 52, 4, 12, 8, 20],
];

export default function SkinView({ skin, head = false, size, label }: { skin: string; head?: boolean; size: number; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;
      const draw = ([sx, sy, w, h, dx, dy]: Part, mirror = false) => {
        if (!mirror) return ctx.drawImage(img, sx, sy, w, h, dx, dy, w, h);
        ctx.save(); ctx.translate(dx + w, dy); ctx.scale(-1, 1);
        ctx.drawImage(img, sx, sy, w, h, 0, 0, w, h); ctx.restore();
      };
      if (head) {
        ctx.drawImage(img, 8, 8, 8, 8, 0, 0, 8, 8);
        ctx.drawImage(img, 40, 8, 8, 8, 0, 0, 8, 8);
        return;
      }
      BASE.forEach((p) => draw(p));
      if (img.height === 64) {
        NEW_64.forEach((p) => draw(p));
        OVERLAY_64.forEach((p) => draw(p));
      } else {
        // Old 64x32 skins have no left arm or leg: mirror the right ones, and only a hat layer.
        draw([44, 20, 4, 12, 12, 8], true);
        draw([4, 20, 4, 12, 8, 20], true);
        draw(OVERLAY_64[0]);
      }
    };
    img.src = skin;
  }, [skin, head]);

  const w = head ? 8 : 16, h = head ? 8 : 32;
  return (
    <canvas ref={ref} width={w} height={h} role="img" aria-label={label} className="skin-view"
      style={{ width: head ? size : size / 2, height: size, imageRendering: "pixelated" }} />
  );
}
