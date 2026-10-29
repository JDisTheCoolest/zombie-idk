# MEL.md

This is a hackathon project: Miner Finder, a way to find people to play Minecraft with (survival, SMP, Bedwars, modded and more). It started as a half-built Hinge / Tinder copy, and we are turning it into a real product.

## The stack

- Next.js (App Router) + TypeScript + React. Plain CSS in `app/globals.css`, no Tailwind.
- Data: Supabase. `lib/db.ts` has the server-only client (secret key from `SUPABASE_SECRET_KEY`) and row helpers. Tables and seed are in `supabase/setup.sql`. Skins are PNG data: URLs in `profiles.skin`, checked by `lib/skin.ts` and drawn by `components/SkinView.tsx`.
- Landing page `app/page.tsx` with the animated world in `components/PixelWorld.tsx`. Find players is `app/find/page.tsx`, the drag gesture is `components/SwipeCard.tsx`.
- Routes: `app/api/profiles`, `feed`, `swipe`, `likes`, `matches`, `matches/[id]` (unmatch) and `matches/[id]/messages`. Pages: Landing (`app/page.tsx`), Find players (`app/find/page.tsx`), `profile`, `matches`, `likes` (Who liked you, paid), `pricing`.
- Minecraft fields (gamertag, edition, platforms, modes, playstyle, mic), the option lists and the age rules are in `lib/minecraft.ts`. `city` on a profile holds the region.
- Profile prompts: the list and the clean-up helper are in `lib/prompts.ts`. `components/ProfileCard.tsx` draws a card (Discover, profile preview, blurred cards on Who liked you).
- "Who am I" is a dropdown (`components/PretendPicker.tsx`, `lib/useMe.ts`). There are no real accounts yet.
- Payments: `app/api/checkout/route.ts` is a stub. Stripe is not connected.
- Runs on port 3105.

## The job

Work through `ZOMBIE.md` in order: make it work, make it secure, make it compliant, connect Stripe, ship it.
Every planted problem in the code is marked with a `ZOMBIE:` comment.
Many players are kids and teens, so safety comes first: real login, age checks (under 13 blocked, teens kept apart from adults), block and report, private messages.

## Rules for agents

- Keep it running. Run `npm run build` after each change and fix what breaks.
- Never commit secrets. Keys go in `.env.local` (it is git-ignored).
- Use Stripe test mode keys only.
- Keep all sample data fake and adult. Never add real people's data or real gamertags.
- When you fix a `ZOMBIE:` item, delete its comment and tick its box in `ZOMBIE.md`.
- Small commits with plain messages.
