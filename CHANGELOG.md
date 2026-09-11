# Changelog

Every push to `main` gets an entry here: the version bump and what changed.
Newest at the top.

## [0.2.0] - 2026-09-11

### Added
- Mission-select home screen (`/`) for picking between games — liquid-glass
  cards, an auto-rotating "Now Playing" carousel, "coming soon" tiles for
  games still in development.
- Device-bound rejoin tokens for team member sessions.
- `DEPLOYMENT.md` — runbook for standing this up on a fresh cloud instance
  and recovering it if the app or instance goes down.

### Fixed
- Each level's cipher now decodes to that level's own password, instead of
  the next level's.
- Join-team identity hijack: rejoining a team now requires a token bound to
  the device that first registered, not just knowing the join code and a
  member's name.
- JWT verification now pins the signing algorithm instead of trusting
  whatever the token claims.
- Cookies get the `Secure` flag when `COOKIE_SECURE` is set (the one
  deployment path with real TLS).

### Changed
- Glitch Out's own routes, assets, API routes and components moved under
  their own `glitch-out/`-scoped folders, so future games don't collide
  with them.
- README trimmed and updated for the new paths.
