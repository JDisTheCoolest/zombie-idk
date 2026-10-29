import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import Sponsors from "@/components/Sponsors";
import PretendPicker from "@/components/PretendPicker";

export const metadata: Metadata = {
  title: "Miner Finder",
  description: "Find people to play Minecraft with. Survival, SMP, Bedwars, modded and more.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="zombie-bar">
          ⛏ Miner Finder is still being built. Read ZOMBIE.md for what to fix.
        </div>
        <nav className="nav">
          <Link href="/" className="brand"><span className="brand-block" aria-hidden="true" />Miner Finder</Link>
          <Link href="/find">Find players</Link>
          <Link href="/matches">Squad</Link>
          <Link href="/likes">Requests</Link>
          <Link href="/profile">My profile</Link>
          <Link href="/pricing">Pricing</Link>
          <PretendPicker />
        </nav>
        <main>{children}</main>
        <Sponsors />
        <p className="muted small" style={{ textAlign: "center", margin: "0 16px 32px" }}>
          Not an official Minecraft product. Not approved by or associated with Mojang or Microsoft.
        </p>
      </body>
    </html>
  );
}
