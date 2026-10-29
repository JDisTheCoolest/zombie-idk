// A player's face: their skin's head if they uploaded one, or a colored block with initials.
import SkinView from "@/components/SkinView";

type Props = { name: string; color: string; size?: number; skin?: string | null };

export default function Avatar({ name, color, size = 48, skin }: Props) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div
      style={{
        width: size, height: size, borderRadius: 4, background: color, color: "#fff", overflow: "hidden",
        boxShadow: "inset -4px -4px 0 rgba(0,0,0,.25), inset 4px 4px 0 rgba(255,255,255,.18)",
        display: "grid", placeItems: "center", fontWeight: 700, fontSize: size / 2.6, flexShrink: 0,
      }}
    >
      {skin ? <SkinView skin={skin} head size={size} label={`${name}'s skin`} /> : initials}
    </div>
  );
}
