# Mine Match ⛏

> Find people to play Minecraft with. Pick your edition, platform and favorite modes, then team up with players who want the same thing: a hardcore duo, a modded SMP crew, a Bedwars squad, a builder for your city project.

Started from the [Zombie Match](https://github.com/richmondbtaylor/zombie-match) hackathon starter (a half-built Hinge / Tinder copy) and reworked into a Minecraft teammate finder.

Not an official Minecraft product. Not approved by or associated with Mojang or Microsoft.

## Run it (2 minutes)

You need [Node.js 20 or newer](https://nodejs.org).

```bash
npm install
npm run dev
```

Open http://localhost:3105.

## What works

- **Player profiles:** gamertag, age, region, edition (Java, Bedrock or both), platforms, modes you play, playstyle, voice chat, a bio and 3 Minecraft prompts ("My dream build", "My worst creeper disaster"...). Live preview of your card while you edit.
- **Find players:** one card at a time with Skip, Team up and 💎 Diamond invite. Filter by mode, or show only players whose edition you can join. Players with the most modes in common with you come first, and the shared modes are highlighted.
- **Squad:** if you both hit Team up, you're teammates. Each one shows the last message. Remove someone with one click.
- **Chat** with each teammate (saved in `data/db.json`).
- **Age rules:** under 13 can't sign up. Players 13 to 17 only see and reach other 13 to 17 year olds, and adults only see adults. This is enforced on the server, not just in the page.
- **Requests:** a paid page with blurred cards of who wants to team up with you. Pricing page with Iron and Netherite plans (Stripe is not connected yet).
- A "Pretend to be" dropdown picks who you are (there are no real accounts yet). Try it: be Avery Stone and team up with Jordan Reyes, who already wants to team up with Avery.
- 10 fake adult players in `data/seed.json`. Everyone is made up.

## What's broken

See [ZOMBIE.md](ZOMBIE.md): real login, block and report, private messages, age verification, Stripe and deploying. Safety items come first, because lots of Minecraft players are kids.

## License

MIT.
