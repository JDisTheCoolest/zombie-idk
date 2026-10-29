// One player as a card: a blocky "skin" tile with initials, then the details.
// ZOMBIE: no real photos or skins yet. The colored block stands in for one.
import type { ReactNode } from "react";
import type { Profile } from "@/lib/db";

type Props = {
  profile: Profile;
  blurred?: boolean; // used on the "Who wants to team up" page
  compact?: boolean; // photo, name and one prompt only
  common?: string[]; // modes you both play, highlighted on Discover
  children?: ReactNode; // buttons under the card
};

export default function ProfileCard({ profile, blurred = false, compact = false, common = [], children }: Props) {
  const initials = profile.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const prompts = profile.prompts ?? [];
  const shown = compact ? prompts.slice(0, 1) : prompts;
  const modes = profile.modes ?? [];

  return (
    <div className={`profile-card${blurred ? " blurred" : ""}${compact ? " compact" : ""}`}>
      <div className="photo" style={{ "--skin": profile.color } as React.CSSProperties}>
        <span className="initials">{initials}</span>
        {profile.edition && <span className="edition-tag">{profile.edition === "Both" ? "Java + Bedrock" : profile.edition}</span>}
      </div>
      <div className="profile-body">
        <div className="blur-me">
          <strong className="big-name">{profile.name}, {profile.age}</strong>
          {profile.gamertag && <div className="gamertag">@{profile.gamertag}</div>}
          <div className="muted">
            {[profile.city, profile.playstyle, profile.mic ? "Mic on" : "No mic"].filter(Boolean).join(" · ")}
          </div>
          {!compact && profile.platforms?.length > 0 && (
            <div className="muted small">Plays on {profile.platforms.join(", ")}</div>
          )}
        </div>
        {modes.length > 0 && (
          <div className="row blur-me">
            {modes.map((m) => (
              <span key={m} className={common.includes(m) ? "pill mode shared" : "pill mode"}>{m}</span>
            ))}
          </div>
        )}
        {common.length > 0 && (
          <div className="note small blur-me">{common.length} mode{common.length > 1 ? "s" : ""} in common</div>
        )}
        {!compact && <p className="bio blur-me">{profile.bio}</p>}
        {shown.map((p) => (
          <div key={p.question} className="prompt blur-me">
            <div className="prompt-q">{p.question}</div>
            <div className="prompt-a">{p.answer}</div>
          </div>
        ))}
        {!compact && profile.interests.length > 0 && (
          <div className="row blur-me">
            {profile.interests.map((i) => <span key={i} className="pill">{i}</span>)}
          </div>
        )}
        {!compact && profile.lookingFor && <div className="muted blur-me">Looking for: {profile.lookingFor}</div>}
      </div>
      {children && <div className="profile-actions">{children}</div>}
    </div>
  );
}
