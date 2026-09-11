# Deployment & Operations Runbook

How to put Glitch Out CTF on a cloud instance, and keep it running.
Pairs with the README's **Deploying on a VM** section. Written for a
fresh Amazon Linux 2023 or Ubuntu instance reached over SSH with a `.pem`
key (e.g. AWS EC2) — same steps on any VPS.

---

## 0. Before you start

- [ ] Instance running (2GB+ RAM is plenty — one Node process + SQLite).
- [ ] Firewall/security group allows `22` (SSH), `80` (HTTP, needed for
      Let's Encrypt + the redirect to HTTPS), `443` (HTTPS).
- [ ] Domain's DNS **A record** points at the instance's public IP. No
      domain? Use the README's plain-HTTP "Docker Compose" setup instead —
      this file is for a public instance with a domain.
- [ ] SSH key (e.g. `opday-ctf-keys.pem`) — already gitignored, keep it
      that way.
- [ ] A Docker Hub image to pull (`aayushop/opday-ctf` or your fork) —
      see **Releasing an update** if you need to build one first.

```bash
chmod 400 opday-ctf-keys.pem
ssh -i opday-ctf-keys.pem ec2-user@<instance-public-ip>   # Amazon Linux
# ssh -i opday-ctf-keys.pem ubuntu@<instance-public-ip>   # Ubuntu
```

---

## 1. First-time setup

**Install Docker** (Amazon Linux 2023):

```bash
sudo dnf install -y docker
sudo systemctl enable --now docker
sudo usermod -aG docker $USER   # log out/in after this
mkdir -p ~/.docker/cli-plugins
curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o ~/.docker/cli-plugins/docker-compose
chmod +x ~/.docker/cli-plugins/docker-compose
```

**Install Docker** (Ubuntu):

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo systemctl enable --now docker
sudo usermod -aG docker $USER   # log out/in after this
```

`enable --now` matters most: it makes Docker start on its own after every
reboot, which Part 3's auto-recovery depends on.

**Copy the `docker/` folder** (no repo clone needed):

```bash
scp -i opday-ctf-keys.pem -r docker/ ec2-user@<instance-public-ip>:~/opday-ctf/
```

**Configure it** — on the instance:

```bash
cd ~/opday-ctf/docker
cat > .env <<EOF
JWT_SECRET=$(openssl rand -base64 48)
LETSENCRYPT_EMAIL=you@example.com
DOCKER_IMAGE=aayushop/opday-ctf
DOCKER_TAG=latest
EOF
```

`JWT_SECRET` signs every session cookie — back it up somewhere safe (a
password manager, not git). Losing it logs everyone out; leaking it lets
someone forge sessions.

**Get the TLS cert (once), then start everything:**

```bash
./certbot-init.sh
docker compose -p opday-ctf -f docker-compose.prod.yml up -d
```

Open `https://your-domain.com/glitch-out/admin` → **Create New Session**. Done.

---

## 2. What's running

```bash
docker compose -p opday-ctf -f docker-compose.prod.yml ps
```

| Service | Job | Self-heals via |
|---|---|---|
| `app` | The game — only reachable through `nginx` | crash restart + `autoheal` on hang |
| `nginx` | HTTPS, redirects `:80 → :443`, reloads every 12h | crash restart |
| `certbot` | Renews the cert every 12h | crash restart |
| `watchtower` | Pulls + restarts `app` when a new image lands (every 5 min) | crash restart |
| `autoheal` | Force-restarts `app` if its healthcheck goes unhealthy | crash restart |

All five run with `restart: unless-stopped` — that's where most of
Part 3's self-healing comes from.

---

## 3. If something goes down

Three different failures, three different fixes.

**App crashes or hangs, instance is fine — fully automatic:**
Docker restarts a crashed container immediately. If it hangs instead
(process alive but stuck), `autoheal` restarts it once the healthcheck
fails 5 times (~75s). New image on Docker Hub → `watchtower` updates it
within 5 min. Cert renewal is automatic too. To check in or nudge it
yourself:

```bash
docker compose -p opday-ctf -f docker-compose.prod.yml ps
docker compose -p opday-ctf -f docker-compose.prod.yml logs app --tail 100
docker compose -p opday-ctf -f docker-compose.prod.yml restart app
```

**Instance reboots — also automatic**, as long as `systemctl enable
--now docker` was done in step 1: Docker comes back on its own, and every
container with `restart: unless-stopped` starts with it. Confirm:

```bash
sudo systemctl status docker      # "active (running)"
docker compose -p opday-ctf -f docker-compose.prod.yml ps   # all "Up"
```

If Docker shows "disabled," fix it once:

```bash
sudo systemctl enable docker
cd ~/opday-ctf/docker && docker compose -p opday-ctf -f docker-compose.prod.yml up -d
```

**Instance itself is stopped/unreachable — the one case Docker can't
fix**, since there's no container to restart if the VM isn't running:

- **Manually stopped** (a person, a cost-saving script): start it again —
  `aws ec2 start-instances --instance-ids <id>`. Nothing auto-starts a
  deliberately stopped instance, by design. Once it's back, Docker
  recovers on its own (see above).
- **Hardware failure** (`StatusCheckFailed_System` in AWS): a CloudWatch
  alarm on that metric with a **Recover this instance** action fixes
  this specifically — same instance ID/IP/disk, moved to healthy
  hardware. Free, one-time setup in the AWS console. Doesn't help with a
  normal stop or an OS-level crash.
- **Want it to always come back, no matter the cause**: that means an
  Auto Scaling Group instead of a bare instance. Real infrastructure and
  cost for a one-day event tool — worth knowing it exists, not the
  default recommendation here.

**How you'd notice**: none of the above pages a human. The repo's
`.github/workflows/status-badge.yml` pings the domain every 15 min for
the README badge — fine for a pre-event check, not real alerting. For an
actual text/email the moment it's down, point a free monitor
(UptimeRobot, healthchecks.io) at `https://your-domain.com/`.

---

## 4. Releasing an update

Nothing publishes on its own:

1. GitHub → **Actions → Build and push Docker image → Run workflow**,
   enter a version (`x.y.z`: **x** feature, **y** UI change, **z** fix).
2. `watchtower` picks up the new `latest` tag and restarts `app` within
   5 minutes. Nothing to do on the instance.

One-time setup this needs — repo secrets under **Settings → Secrets and
variables → Actions**:

| Secret | Value |
|---|---|
| `DOCKERHUB_USERNAME` | Docker Hub username (`aayushop`) |
| `DOCKERHUB_TOKEN` | Access token, Read/Write/Delete scope |

Build and push by hand instead (CI down, or testing):

```bash
docker buildx build --platform linux/amd64 -f docker/Dockerfile \
  -t aayushop/opday-ctf:<version> -t aayushop/opday-ctf:latest --push .
```

Roll back: set `DOCKER_TAG` in the instance's `docker/.env` to a known-good
version, then:

```bash
docker compose -p opday-ctf -f docker-compose.prod.yml pull app
docker compose -p opday-ctf -f docker-compose.prod.yml up -d app
```

---

## 5. Backing up game data

Everything lives in one SQLite file inside the `opday_data` volume. It
survives restarts/updates on its own — only `docker compose down -v` or
deleting the volume destroys it. **Never run `down -v`** unless you mean
to wipe every session.

```bash
# Back up
docker run --rm -v opday_data:/data -v "$PWD":/backup alpine \
  tar czf /backup/opday-backup-$(date +%F).tar.gz -C /data .

# Restore
docker run --rm -v opday_data:/data -v "$PWD":/backup alpine \
  tar xzf /backup/opday-backup-<date>.tar.gz -C /data
```

---

## 6. Quick command reference

From `~/opday-ctf/docker`. `-p opday-ctf -f docker-compose.prod.yml` implied.

| Task | Command |
|---|---|
| Status | `docker compose ps` |
| Logs, one service | `docker compose logs -f app` |
| Restart the app | `docker compose restart app` |
| Apply a new image now | `docker compose pull app && docker compose up -d app` |
| Stop (keeps data) | `docker compose stop` |
| Start back up | `docker compose up -d` |
| Wipe everything **including data** | `docker compose down -v` |
| Renew TLS cert by hand | `docker compose exec certbot certbot renew --force-renewal && docker compose exec nginx nginx -s reload` |

---

## 7. Security reminders

- `chmod 400` the `.pem` key; never commit it or copy it onto the instance.
- `docker/.env` (holds `JWT_SECRET`) stays on the instance — gitignored,
  don't paste it into chat or copy it around casually.
- Only `22`/`80`/`443` need to be open. Don't map `app`'s port `3000`
  directly (`ports: ["3000:3000"]`) — it's meant to stay reachable only
  through `nginx`, which is what provides TLS.
- Rotating `JWT_SECRET` logs everyone out at once — fine between events,
  disruptive mid-game.
