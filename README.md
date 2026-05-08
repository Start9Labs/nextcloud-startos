<p align="center">
  <img src="icon.png" alt="Nextcloud Logo" width="21%">
</p>

# Nextcloud on StartOS

> **Upstream docs:** <https://docs.nextcloud.com/server/latest/admin_manual/>
>
> Everything not listed in this document should behave the same as upstream
> Nextcloud. If a feature, setting, or behavior is not mentioned
> here, the upstream documentation is accurate and fully applicable.

[Nextcloud](https://nextcloud.com/) is a self-hosted productivity platform that provides file sync, sharing, collaboration, and extensibility through apps.

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Configuration Management](#configuration-management)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Actions (StartOS UI)](#actions-startos-ui)
- [Dependencies](#dependencies)
- [Backups and Restore](#backups-and-restore)
- [Health Checks](#health-checks)
- [Limitations and Differences](#limitations-and-differences)
- [What Is Unchanged from Upstream](#what-is-unchanged-from-upstream)
- [Contributing](#contributing)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

This package runs **four containers** as subcontainers:

| Container | Image | Purpose |
|-----------|-------|---------|
| nextcloud | `nextcloud` (Apache variant, extended with ffmpeg) | Nextcloud application with Apache and PHP-FPM |
| postgres | `postgres` (Alpine) | PostgreSQL database |
| valkey | `valkey/valkey` (Alpine) | Redis-compatible in-memory cache |
| cron | Same image as nextcloud | Runs `/cron.sh` (busybox crond) to trigger Nextcloud background jobs every 5 minutes |

Architectures: x86_64, aarch64.

**Startup order:** A `chown` one-shot runs first alongside `postgres` and `valkey`. The `nextcloud` container waits until all three are ready before starting. The `cron` container waits for `nextcloud` to be ready.

**ffmpeg:** The nextcloud image is built locally (extends `nextcloud:<version>-apache`) to install `ffmpeg`, which Nextcloud's preview providers shell out to for video thumbnails.

**How this differs from upstream:** A standard Nextcloud Docker deployment typically uses separate `docker-compose` services and a standalone Redis container. On StartOS, all three containers are orchestrated as subcontainers within a single service, communicating over localhost. There is no Docker network or `docker-compose.yml`; the SDK manages the lifecycle.

---

## Volume and Data Layout

| Volume | Mount Point | Purpose | Backed Up |
|--------|-------------|---------|-----------|
| `main` | N/A (host) | StartOS metadata, `store.json` (admin password) | Yes |
| `nextcloud` | `/var/www/html` | Application code, user files, `config/config.php` | Yes |
| `db` | `/var/lib/postgresql` | PostgreSQL data directory (`data/`) | Yes |

Valkey runs without a mounted volume — its cache is ephemeral and rebuilds on start.

**How this differs from upstream:** A typical deployment stores the database password in environment variables or a `.env` file. On StartOS, the database password is auto-generated, stored in `config.php`, and never exposed to the user. There is no `.env` file or `docker-compose.yml` to edit.

---

## Installation and First-Run Flow

| Step | Upstream | StartOS |
|------|----------|---------|
| Installation | `docker-compose up -d` or snap/bare-metal install | Install from marketplace or sideload `.s9pk` |
| Database setup | Manual: create user/database, configure credentials | Automatic: PostgreSQL initializes with `nextcloud` database |
| Admin account | Set via env vars or web installer | Auto-generated 24-character password |
| Caching | Manual: install and configure Redis/Memcached | Automatic: Valkey starts and `config.php` is pre-configured |
| Trusted domains | Manual: edit `config.php` or set env vars | Automatic: populated from StartOS interface hostnames |
| SSL/TLS | Manual: reverse proxy or Let's Encrypt | Automatic: StartOS terminates SSL |

**Install sequence:**

1. PostgreSQL initializes and creates the `nextcloud` database
2. Valkey cache starts
3. Nextcloud auto-installs with generated admin credentials
4. A **critical task** prompts you to retrieve the admin credentials before proceeding

**Upgrade from StartOS 0.3.x:** The migration handles PostgreSQL data directory relocation (Debian path to Docker canonical path), `config.yaml` to `config.php` migration, and admin password migration to the new store format. Users must have run the previous Nextcloud version on 0.3.5x at least once (to complete the PG 15 to 17 upgrade) before upgrading.

---

## Configuration Management

### Enforced Settings

These settings are enforced on every startup. If they are changed through the Nextcloud admin interface or by editing `config.php` directly, they will be reset:

| Setting | Value | Why |
|---------|-------|-----|
| `trusted_proxies` | `['10.0.3.0/24']` | StartOS internal network |
| `trusted_domains` | Interface hostnames | All assigned addresses (LAN, Tor, custom) |
| `memcache.local` | `\OC\Memcache\APCu` | Local PHP opcode caching |
| `memcache.distributed` | `\OC\Memcache\Redis` | Distributed caching via Valkey |
| `memcache.locking` | `\OC\Memcache\Redis` | Transactional file locking via Valkey |
| `filelocking.enabled` | `true` | Prevents file corruption from concurrent edits |
| `redis.host` | `localhost` | Valkey runs as a local subcontainer |
| `redis.port` | `6379` | Standard Redis/Valkey port |
| `updatechecker` | `false` | Updates are managed by StartOS, not Nextcloud's built-in checker |
| `check_for_working_wellknown_setup` | `true` | Enables CalDAV/CardDAV/.well-known URL discovery checks |
| `integrity.check.disabled` | `true` | Suppresses false integrity warnings caused by repackaging |

**How this differs from upstream:** In a standard deployment, you manually configure caching, file locking, trusted proxies, and SSL termination. On StartOS, these are all pre-configured and enforced automatically. You cannot accidentally break caching or lock yourself out by misconfiguring trusted domains.

### User-Configurable Settings

The **Configure** action exposes:

| Setting | Default | Description |
|---------|---------|-------------|
| Default locale | `en_US` | Display language for public pages (login, shared items) |
| Default phone region | `US` | Phone number formatting region |
| Maintenance window start | `24` (disabled) | UTC hour (0-23) for background job scheduling; `24` = no preference |
| Disable skeleton files for new accounts | `false` | When enabled, sets `skeletondirectory` to `''` so new user accounts are not seeded with Nextcloud's default sample documents, photos, and README. Existing accounts are unaffected. |

All other Nextcloud settings (mail, apps, users, sharing, etc.) are managed through the Nextcloud admin interface after login.

---

## Network Access and Interfaces

| Interface | Port | Type | Path | Description |
|-----------|------|------|------|-------------|
| Web UI | 80 | ui | `/` | Main Nextcloud web interface |
| WebDAV | 80 | api | `/remote.php/dav/` | File sync for desktop/mobile clients |

Both interfaces share the same origin. SSL is terminated by StartOS and forwarded via X-Forwarded headers.

**How this differs from upstream:** In a typical deployment, you configure nginx or Apache as a reverse proxy with SSL certificates. On StartOS, SSL termination and hostname management are handled automatically. You never edit nginx configs or manage certificates.

---

## Actions (StartOS UI)

### Configure

Basic settings for locale, phone region, and maintenance window timing. Available when running or stopped.

### Reset Admin Password

Generates a new 24-character random password for a selected admin user. Displays the new credentials. Requires service to be running.

### Disable Maintenance Mode

**Group:** CLI Tools

Runs `occ maintenance:mode --off`. Use this if the web UI is stuck showing "Maintenance mode". Brief maintenance mode after updates is normal — wait at least 15 minutes before using this action.

### Disable Non-default Apps

Disables all user-installed apps (preserves ~48 Nextcloud defaults). Use when a broken app causes "Internal Server Error". After running, stable apps must be re-enabled individually.

**Warning:** Disables ALL non-default apps, not just the problematic one.

### Download Machine Learning Models for Recognize

**Group:** CLI Tools

Queues a background download of ML models (~1-2 GB) for object and face identification. Requires the Recognize app to be installed first. Can be invoked whether the service is running or stopped — the request is recorded in `store.json` and the actual download runs as a oneshot in the main daemon chain the next time the service is up. Progress and failure are reported via the **Recognize Model Download** health check on the service status page; the check appears only while a download is in flight or after a failure, and disappears on success. Re-invoking while a download is queued or running is a no-op.

**Stopping during a download:** the `recognize:download-models` command is killed when the service stops. The pending flag is left in place, so on the next service start the oneshot resumes — the upstream command is idempotent and skips models it has already downloaded.

### Index Media for Memories

**Group:** CLI Tools

Queues a background re-index of media files for the Memories app. Normally indexing runs automatically via Nextcloud background tasks every 5 minutes; use this action only to force a re-index. Requires the Memories app to be installed and a media path selected. Can be invoked whether the service is running or stopped — the request is recorded in `store.json` and the run happens in the main daemon chain when the service is up. Progress is reported via the **Memories Indexing** health check; the check appears only while a run is in flight or after a failure, and disappears on success. Re-invoking while a run is queued or running is a no-op. If the service is stopped mid-run, the pending flag persists and the run resumes on next start.

### Setup Map for Memories

**Group:** CLI Tools

Queues a background download of map data (~2-3 GB, ~561,000 geometries) and a re-index for reverse geotagging photos. Requires the Memories app to be installed. Resource-intensive — avoid running alongside other heavy operations. Same async pattern as the other long-running actions: invocable while running or stopped, progress reported via the **Memories Map Setup** health check, idempotent on stop/restart.

### Get Admin Credentials

Hidden action that runs once after initial install as a critical task. Retrieves the auto-generated admin username (`admin`) and password. Only available when stopped.

---

## Dependencies

None. Nextcloud on StartOS is fully self-contained with its own database and cache.

---

## Backups and Restore

**Database:** Uses `pg_dump`/`pg_restore` for PostgreSQL instead of raw volume rsync. The dump is written directly to the backup target.

**Volumes backed up via rsync:**

- `main` — StartOS metadata (admin password)
- `nextcloud` — User files (`data/`), installed apps (`custom_apps/`), `config.php` (`config/`)

**NOT included in backup:**

- `db` volume — Not rsynced directly; database is captured via `pg_dump`

**Restore behavior:**

- All data, configuration, and installed apps are restored
- Database is rebuilt from dump via `pg_restore`
- No reconfiguration needed

**Note:** Backups can be very large depending on user files.

---

## Health Checks

| Check | Method | Target | Display |
|-------|--------|--------|---------|
| Web Interface | Port listening | Port 80 | "The web interface is ready" |
| PostgreSQL | `pg_isready` | localhost | Internal only |
| Valkey | `valkey-cli ping` | localhost | Internal only |
| Recognize Model Download | Compares `actions.pending.downloadModels` vs `actions.completed.downloadModels` in `store.json` | n/a | `loading` while a queued download is running. Hidden otherwise. |
| Memories Indexing | Compares `actions.pending.indexMemories` vs `actions.completed.indexMemories` in `store.json` | n/a | `loading` while a queued re-index is running. Hidden otherwise. |
| Memories Map Setup | Compares `actions.pending.indexPlaces` vs `actions.completed.indexPlaces` in `store.json` | n/a | `loading` while a queued map setup is running. Hidden otherwise. |

The Nextcloud daemon will not start until PostgreSQL and Valkey are both confirmed ready. Each long-running CLI action (Download Models, Index Memories, Setup Map) writes its identifier into `store.json` at `actions.pending.<id>` with `Date.now()` as the value. The `long-running-tasks` oneshot in `setupMain` walks the three known IDs in declared order and runs the underlying `occ` command for any whose `pending` timestamp is newer than its `completed` timestamp (or whose `completed` is absent). On normal exit, `runOcc` writes a fresh timestamp into `actions.completed.<id>`. On abort (service stop or chain rebuild), the child is SIGKILLed and no `completed` timestamp is written, so the work resumes on next start (occ commands are idempotent). Output streams to the service logs in real time.

Reactivity is armed at chain build via `storeJson.read((s) => s.actions.pending).const(effects)`. The mapped subscription only watches the `pending` bag — writes to `actions.completed` produce the same mapped value, so the SDK's eq check dedups them and **no chain rebuild fires on task completion**. Triggering a new action does change `actions.pending` (a new timestamp), so the chain rebuilds immediately, the in-flight `occ` (if any) is aborted, and the new chain's oneshot scans the pending bag from scratch — including any task it just killed, which gets re-run from the start. Re-invoking the same action while it's queued or running short-circuits in the action body (it sees its own `pending > completed` and returns "Already in Progress" without writing anything), so no rebuild fires.

The CLI Tools actions that depend on a Nextcloud app (Recognize for model download, Memories for indexing/map setup) are always shown as enabled. When invoked, they check for the prerequisite app's files under `apps/` or `custom_apps/` on the volume and throw an "Install the X app in Nextcloud first." error if missing. (Action visibility is exported only at install/update time and not reactively refreshed when an app is installed from the Nextcloud admin UI, so disabled-with-reason was unreliable — the run-time check is authoritative.)

---

## Limitations and Differences

1. **No external storage mounts** — You cannot mount arbitrary host directories. External storage must be configured through Nextcloud's built-in external storage app.
2. **No built-in SMTP** — Mail must be configured through Nextcloud Admin Settings > Basic settings > Email server.
3. **Collaborative editing** — OnlyOffice/Collabora integration requires additional setup and may not work in all configurations.
4. **App compatibility** — Most Nextcloud apps work, but some that require system-level access or additional services may not function in the containerized environment.
5. **PHP limits** — Memory limit is 1024 MB; upload limit is 20 GB. These are not currently user-configurable.
6. **Enforced config** — Settings listed in the Enforced Settings table will be reset on every startup. Use the Configure action or the Nextcloud admin UI for supported settings.

---

## What Is Unchanged from Upstream

- Full web interface with all standard features
- App installation from the Nextcloud App Store
- User management, sharing, groups, and permissions
- WebDAV file synchronization with all official clients
- CalDAV/CardDAV for calendar and contact sync
- Two-factor authentication
- Federation with other Nextcloud instances
- Server-side encryption
- Activity feed and notifications
- Talk (video calls, chat)
- Mobile and desktop client compatibility

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for build instructions and development workflow.

---

## Quick Reference for AI Consumers

```yaml
package_id: nextcloud
image: nextcloud (Apache variant, extended with ffmpeg), postgres (Alpine), valkey/valkey (Alpine)
architectures:
  - x86_64
  - aarch64
volumes:
  main: host (StartOS metadata, admin password)
  nextcloud: /var/www/html
  db: /var/lib/postgresql
ports:
  ui: 80
  webdav: 80
dependencies: none
startos_managed_env_vars:
  - PHP_MEMORY_LIMIT
  - PHP_UPLOAD_LIMIT
  - POSTGRES_DB
  - POSTGRES_USER
  - POSTGRES_HOST
  - PGDATA
actions:
  - set-config
  - reset-admin
  - disable-maintenance
  - disable-unstable-apps
  - download-models
  - index-memories
  - index-places
  - create-admin-user
```
