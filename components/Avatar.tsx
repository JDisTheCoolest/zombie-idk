// ZOMBIE: no photos or skins yet. Avatars are colored blocks with initials.
// When you add photo upload, you also need photo moderation (see ZOMBIE.md).
export default function Avatar({ name, color, size = 48 }: { name: string; color: string; size?: number }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div
      style={{
        width: size, height: size, borderRadius: 4, background: color, color: "#fff",
        boxShadow: "inset -4px -4px 0 rgba(0,0,0,.25), inset 4px 4px 0 rgba(255,255,255,.18)",
        display: "grid", placeItems: "center", fontWeight: 700, fontSize: size / 2.6, flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}
