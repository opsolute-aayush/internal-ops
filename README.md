# OP Day CTF

[![Build and push Docker image](https://github.com/opsolute-aayush/op_day_ctf/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/opsolute-aayush/op_day_ctf/actions/workflows/docker-publish.yml)
[![Docker Hub](https://img.shields.io/docker/v/aayushop/opday-ctf?sort=semver&label=docker&logo=docker)](https://hub.docker.com/r/aayushop/opday-ctf/tags)
[![Docker Pulls](https://img.shields.io/docker/pulls/aayushop/opday-ctf?label=pulls&logo=docker)](https://hub.docker.com/r/aayushop/opday-ctf)
[![Status](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fopsolute-aayush%2Fop_day_ctf%2Fstatus%2Fstatus.json&cacheSeconds=300)](https://aegios.co.in)

A physical + digital scavenger hunt. Teams decode a cipher, find hidden word cards, and race to build a final sentence. Self-contained Next.js app, no external services needed.

## Quick start

```bash
npm run start:event
```

Installs everything, sets up the database, opens the app. Safe to re-run anytime.

## How it works

- `/` is the mission-select home screen — one card per game. Today that's just **Glitch Out**; more games get their own top-level folder next to it (see **Project structure**) as they're built.
- The **Game Master** creates a session at `/glitch-out/admin` and gets a 6-digit code + password (shown once).
- **Players** enter that code at `/glitch-out/register`, pick a team, and play at `/glitch-out/play`.
- One deployment can run several sessions at once, each fully separate.
- Each team has its own passwords, clues, words, and final sentence — no shared answers.
- A correct password reveals a location clue. The team types the exact word found there to collect it and move on.

## Running it

**Local dev:**

```bash
npm install
cp .env.example .env    # set JWT_SECRET
npm run db:push
npm run dev              # → http://localhost:3000
```

**Docker (single container):**

```bash
docker build -f docker/Dockerfile -t opday-ctf .
docker run -d -p 3000:3000 \
  -e JWT_SECRET="$(openssl rand -base64 48)" \
  -v opday_data:/app/data \
  opday-ctf
```

Open `http://localhost:3000/glitch-out/admin` → **Create New Session**. The volume keeps your data and `JWT_SECRET` across restarts.

**Docker Compose (a laptop or a VM):**

```bash
git clone <this repo> && cd opday-ctf
npm run compose:up
```

One command: creates `.env`, generates a secret, detects the machine's IP, builds, and starts on port 80. On a cloud VM, also open port 80 in its firewall and share its **public** IP.

Custom domain: point its DNS **A record** at the VM's IP. On shared venue wifi instead, run `npm run compose:dns` or add `<IP> aegios.co.in` to each device's hosts file.

**A host without Docker** (Render, Fly.io, a VPS):

```bash
npm install && npm run build
npm run db:push
npm start
```

Set `JWT_SECRET` in the platform's env vars, and use a persistent disk — the SQLite file must survive restarts.

## Deploying to production (HTTPS, auto-updating, a real domain)

`docker-compose.prod.yml` runs the app behind nginx (HTTPS via Let's Encrypt) with Watchtower auto-updating it on every new image.

**[DEPLOYMENT.md](DEPLOYMENT.md)** has the full copy-pasteable setup, plus how it recovers on its own from crashes, reboots, and stale images — and what to do if the instance itself goes down. Start there for a fresh cloud instance.

Releasing an update is manual and by version: **Actions → Build and push Docker image → Run workflow**. Watchtower on the server picks it up within 5 minutes. Versioning is `x.y.z` — **x** major/new feature, **y** UI change, **z** bug fix.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | SQLite file path, e.g. `file:./dev.db` |
| `JWT_SECRET` | yes | Signs session tokens. Rotating it logs everyone out. |
| `COOKIE_SECURE` | prod only | `true` only when actually served over HTTPS (already set in `docker-compose.prod.yml`). Leave unset for plain-http venue wifi. |
| `HOST_IP` | no | LAN IP for the Compose `dns` profile; auto-set by `compose:up`/`compose:dns`. |
| `DOCKER_IMAGE` / `DOCKER_TAG` | prod only | Which pushed image to pull. |
| `LETSENCRYPT_EMAIL` | prod only | Email for cert renewal/expiry notices. |

No admin password to set up front — each session generates its own, shown once, changeable anytime from the dashboard's Security tab.

## Scripts

| Command | Effect |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` / `npm start` | Production build + serve |
| `npm run db:push` | Sync the schema to the SQLite file |
| `npm run db:reset` | Wipe the database and re-sync the schema |
| `npm run db:studio` | Browse/edit the DB visually |
| `npm run docker:build` / `docker:run` | Build/run the single-container image |
| `npm run compose:up` / `compose:dns` / `compose:down` | Docker Compose, with or without the LAN-domain profile |

## Features

- **Team colors**: a neon swatch picker at join time or from `/glitch-out/play`.
- **Self-service hints**: 2 free per team; the admin can also release one for free.
- **Live leaderboard**: every player sees everyone's progress.
- **Sound, video, music**: drop files into `public/sounds/<category>/` or `public/videos/<category>/` and they auto-play — no code changes needed.
- **Player settings** at `/glitch-out/settings`: mute or adjust volume per device.
- **Non-blocking wins**: one team finishing doesn't stop the hunt for others — only the admin's **End Game** does.

## Cipher

Each level's **Ye Lee** field is a Base64 string that decodes to that same level's password — solving it unlocks that level, never the one ahead. Generated from the admin dashboard, which picks a random technique per difficulty and shows the admin which one it used.

Details: **[docs/cipher/README.md](docs/cipher/README.md)**.

## Security

- Every request is validated server-side, not just in the UI.
- A team's passwords, clues, and words are scoped to its own session and team — no cross-team access, even with a guessed ID.
- Winning sentences and word rewards are never sent to the client before they're earned.
- Passwords and session credentials are bcrypt-hashed; sensitive checks happen server-side only.

## Project structure

```
docs/cipher/     Per-difficulty cipher technique specs
docker/          Dockerfile, docker-compose.yml, docker-compose.prod.yml,
                 certbot-init.sh, nginx/app.conf
scripts/         run.sh, docker-entrypoint.sh, compose-up.sh
prisma/          schema.prisma
src/
  app/           / is the mission-select home screen (one card per game).
                 Each game gets its own top-level folder with its full route
                 tree nested inside — today that's app/glitch-out/{register,
                 play,final,winner,admin,settings}. A new game is a sibling
                 folder next to glitch-out/, not more routes inside it.
  app/api/       API routes (not game-namespaced; shared backend)
  data/          games.ts — the home screen's roster (id, title, status,
                 href, ...), one entry per game/card
  components/    UI components
  lib/           Auth, sessions, game logic, sound/video/settings
  lib/ciphers/   One script per cipher technique + registry picking randomly per difficulty
public/
  sounds/        Auto-discovered audio, by category
  videos/        Auto-discovered green-screen clips, by category
```

## Scaling

Built for one Node.js process — a laptop or small VM, for a one-day internal event. Rate limiting is in-memory and updates are polling; both are fine at this scale. Deploy anywhere with a persistent disk and a long-running process (Render, Fly.io, a VPS, or Docker with a volume) — not stateless serverless, since the SQLite file needs to persist.
