# Changelog

## [1.1.1] - 2026-09-11

First release published under this changelog/tagging setup — earlier
history (this project started as "OP Day CTF") predates it and isn't
replayed here; see `git log` for the full record.

### Changes
- Renamed the project from `opday-ctf` to `internal-ops`, including the
  Docker image, container names, the Compose data volume, and the GitHub
  repo.
- Moved `README.md`/`DEPLOYMENT.md`/`CHANGELOG.md` into `docs/`.
- Automated this changelog and `package.json`'s version bump as part of
  the release workflow (`docker-publish.yml`), instead of hand-editing
  them — including fixing two bugs in that automation found while
  shipping this very release (an insertion point too fragile to survive
  a manual edit to this file, and a first-release run dumping the
  project's entire commit history in here instead of just what's new).

