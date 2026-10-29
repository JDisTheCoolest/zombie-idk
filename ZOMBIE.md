# 🧟 ZOMBIE.md: what's broken

Mine Match started as a zombie (half-built) dating app and is being turned into a way to find people to play Minecraft with. Pick items off this list. Every box you tick gets it closer to a product players can actually use.

Search the code for `ZOMBIE:` to find every planted problem.

## 1. Make it work

- [x] The discover feed shows people you already passed (`app/api/feed/route.ts`). Filter them out.
- [x] Mode and edition (crossplay) filters on Find players. Players with the most modes in common show first.
- [ ] Region filter (to find players with a good ping) and a playstyle filter.
- [ ] Chat does not update live. You have to refresh. Add polling every few seconds, or websockets.
- [ ] "Diamond invite" (the super like, a paid feature) says "not built yet". Build it, then lock it to a paid plan.
- [ ] Avatars and card photos are colors and initials. Add skin upload or pull the player's skin from their gamertag (and read section 3 first).
- [ ] Unmatch is half done. It only hides the chat in the page (`app/api/matches/[id]/route.ts`). The messages are never deleted. Delete or lock them.
- [ ] "Requests" (who wants to team up with you) is the paid feature, but nothing checks a plan. Build the plan check after Stripe works (section 4).
- [ ] Profile prompts are not checked. Any question text is accepted, and the answers are not moderated.
- [ ] No "new teammate" alert and no unread count on the Squad page.
- [ ] Gamertags are not checked. Verify Java names with the Mojang API and Xbox gamertags with Xbox Live.

## 2. Make it secure and safe

- [ ] There is no login. The "Pretend to be" dropdown lets anyone act as anyone. Add accounts (Supabase Auth, Clerk, Auth.js...).
- [ ] No identity check. Nothing proves a profile is a real person. Add email or phone checks at least.
- [x] Age rules: under 13 is refused, 13 to 17 only see and reach 13 to 17, and 18+ only see and reach 18+. Checked on the server in `lib/minecraft.ts`, the feed, swipe and requests.
- [ ] The age is still whatever people type. Add age verification, and stop people from changing their age to jump groups.
- [ ] No block button and no report button. This matters even more with teens on the app. Add both, and make a blocked person vanish from the feed and chat.
- [ ] Any user can read any match's private messages through `GET /api/matches/[id]/messages`. Check that the signed-in user is in the match.
- [ ] Unmatch leaves the messages readable. `GET /api/matches/[id]/messages` still returns them after an unmatch, and anyone can still post to an unmatched chat.
- [ ] "Requests" leaks. The page blurs the cards, but `GET /api/likes?me=...` sends the real names, ages, cities and prompts to anyone. Only send them after a paid plan is confirmed.
- [ ] Anyone can unmatch anyone, because `DELETE /api/matches/[id]` does not check who is calling.
- [ ] Anyone can send a message as anyone, and edit any profile, because the server trusts the id in the request.
- [ ] No photo moderation. When you add photos, scan them for nudity and abuse before they show.
- [ ] No spam or abuse filter on bios and messages.
- [ ] Every API route trusts whatever it's sent. Validate input on the server.
- [ ] Ids are guessable (`lib/db.ts`). Use random ids and check that the record belongs to the signed-in user.
- [ ] Data lives in `data/db.json` on disk. Move it to a real database.

## 3. Make it compliant

Lots of Minecraft players are kids and teens, so these rules matter a lot:

- [ ] **Minors:** under 13 is blocked and teens are kept apart from adults, but nothing verifies ages yet. US child safety laws (COPPA for under 13, plus state rules for teens such as parental consent) and the UK Online Safety Act and Children's Code expect real age checks and safe defaults for teens.
- [ ] **GDPR (EU/UK):** a children's data needs extra care, and the age of consent for data is 13 to 16 depending on the country. You need a legal basis, clear notices kids can understand, and a way to withdraw consent.
- [ ] **Privacy laws:** California CCPA/CPRA and other states have extra rules for users under 16. Don't collect precise location.
- [ ] **Minecraft brand rules:** Mojang's usage guidelines say you can't suggest you're official. Keep the "not affiliated with Mojang or Microsoft" note.
- [ ] **App store rules:** Apple and Google require apps with user content to offer report and block, content moderation, and a way to delete your account inside the app.
- [ ] **Subscriptions:** US auto-renewal laws (for example California) and FTC rules need clear pricing and an easy cancel.
- [ ] **Scams and fake profiles:** account and item scams are common in Minecraft. Have a way to find and remove them quickly.
- [ ] No privacy policy or terms page.
- [ ] No way for a user to export or delete their data.

## 4. Connect Stripe

- [ ] `app/api/checkout/route.ts` returns a 501. Create a Stripe Checkout Session (test mode is fine).
- [ ] Add a webhook route that marks the account as paid.
- [ ] Lock the paid features behind the plan.

## 5. Ship it

- [ ] Deploy it (Vercel, Netlify, Railway...). The JSON file database will not survive this, so do section 2 first.
- [ ] Put the live link in your README.

## What "done" looks like

Someone who has never seen it can sign up, pay, use the main feature end to end, and come back tomorrow to find their data still there.
