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

### External Storage

Surfaces another StartOS service's storage as a folder in Nextcloud's Files, using Nextcloud's built-in External Storage app (`files_external`). The form is built dynamically from `effects.getInstalledPackages()` — it shows **one dropdown per supported source whose service is actually installed**, so uninstalled services never appear. The only supported source today is **File Browser** → `/FileBrowser` (the registry in `startos/externalStorage.ts` is built to take more — File Browser is intended as the single shared-storage hub that other services route through, but adding a service's own volume as a direct source is a one-entry change). Each dropdown has three choices:

- **Not mounted** (default) — the source is not mounted/surfaced.
- **Available to all users** — mounted **read-write** at `/mnt/<source>` and surfaced to everyone.
- **Available to specific users** — mounted, and reveals a user picker (populated live from `occ user:list`); only the chosen users see it.

So each source is scoped independently (mirroring Nextcloud's per-mount "Available to" model), and a source's user picker only appears when you choose "specific users". Because the pickers read the live user list, this action is available only while the service is **running**. Under the hood the dropdowns are translated into the same `externalStorages` + `externalStorageUsers` state in `store.json`, and the mounts are reconciled on the next chain build. See [Dependencies](#dependencies) for the full mechanism (permissions/idmap handling and the read-write caveat).

### Reset Admin Password

Generates a new 24-character random password for a selected admin user. Displays the new credentials. Requires service to be running.

### Disable Maintenance Mode

**Group:** CLI Tools

Runs `occ maintenance:mode --off`. Use this if the web UI is stuck showing "Maintenance mode". Brief maintenance mode after updates is normal — wait at least 15 minutes before using this action.

### Disable Non-default Apps

Disables all user-installed apps (preserves ~48 Nextcloud defaults). Use when a broken app causes "Internal Server Error". After running, stable apps must be re-enabled individually.

**Warning:** Disables ALL non-default apps, not just the problematic one.

### Scan Files

**Group:** Maintenance

Queues a background `occ files:scan --all` to rebuild the file cache index. Run this after syncing files into the Nextcloud volume externally (e.g. via rclone, rsync, or SFTP). Without a scan, externally added or modified files may appear stale, show incorrect sizes, or be absent from search. The request is recorded in `store.json` and the scan runs as a oneshot in the main daemon chain the next time the service is up (the action starts the service if it is stopped). On a large library the scan can take many minutes; progress is reported via the **File Scan** health check on the service status page, and a notification is posted to the StartOS notifications panel when it finishes (on failure its "View Details" body carries the exit code and the tail of the command's output). Re-invoking while a scan is queued or running is a no-op. If the service is stopped mid-scan the pending flag is left in place and the scan resumes on next start — `files:scan` is idempotent.

### Repair

**Group:** Maintenance

Queues a background `occ maintenance:repair --no-interaction`. Fixes database inconsistencies, stale cache entries, and broken shares. Run this if files appear missing, shares return errors, or after a crash or abrupt shutdown. The request is recorded in `store.json` and the repair runs as a oneshot in the main daemon chain the next time the service is up (the action starts the service if it is stopped). Progress is reported via the **Repair** health check on the service status page, and a notification is posted when it finishes (on failure its "View Details" body carries the exit code and the tail of the command's output). Re-invoking while a repair is queued or running is a no-op. If the service is stopped mid-repair the pending flag is left in place and the repair resumes on next start.

### Download Machine Learning Models for Recognize

**Group:** CLI Tools

Queues a background download of ML models (~1-2 GB) for object and face identification. Requires the Recognize app to be installed first. Can be invoked whether the service is running or stopped — the request is recorded in `store.json` and the actual download runs as a oneshot in the main daemon chain the next time the service is up. Progress is reported via the **Recognize Model Download** health check on the service status page; the check appears only while a download is in flight and disappears on completion. When the oneshot exits — whether the download succeeded or failed — a notification with the result is posted to the StartOS notifications panel; on failure its "View Details" body carries the exit code (or terminating signal) and the tail of the command's output. Re-invoking while a download is queued or running is a no-op.

**Stopping during a download:** the `recognize:download-models` command is killed when the service stops. The pending flag is left in place, so on the next service start the oneshot resumes — the upstream command is idempotent and skips models it has already downloaded.

### Index Media for Memories

**Group:** CLI Tools

Queues a background re-index of media files for the Memories app. Normally indexing runs automatically via Nextcloud background tasks every 5 minutes; use this action only to force a re-index — it prompts for confirmation first, since forcing a re-index restarts the service. Requires the Memories app to be installed and a media path selected. Can be invoked whether the service is running or stopped — the request is recorded in `store.json` and the run happens in the main daemon chain when the service is up. Progress is reported via the **Memories Indexing** health check; the check appears only while a run is in flight and disappears on completion. When the oneshot exits — whether the re-index succeeded or failed — a notification with the result is posted to the StartOS notifications panel; on failure its "View Details" body carries the exit code (or terminating signal) and the tail of the command's output. Re-invoking while a run is queued or running is a no-op. If the service is stopped mid-run, the pending flag persists and the run resumes on next start.

### Setup Map for Memories

**Group:** CLI Tools

Queues a background download of map data (~2-3 GB, ~561,000 geometries) and a re-index for reverse geotagging photos. Requires the Memories app to be installed. Resource-intensive — avoid running alongside other heavy operations. Same async pattern as the other long-running actions: invocable while running or stopped, progress reported via the **Memories Map Setup** health check, a notification posted with the result (and, on failure, the exit code plus the command's output tail) when the oneshot exits, idempotent on stop/restart.

### Get Admin Credentials

Hidden action that runs once after initial install as a critical task. Retrieves the auto-generated admin username (`admin`) and password. Only available when stopped.

---

## Dependencies

Nextcloud is self-contained (its own PostgreSQL and Valkey). It has a single **optional** dependency, used only by the **External Storage** action:

| Dependency | Kind | When | Why |
|------------|------|------|-----|
| File Browser | `exists` (`>=2.63.2:0`) | Only while "File Browser" is selected in the External Storage action | Nextcloud mounts File Browser's `data` volume and surfaces it as a folder in Files |

The dependency is declared optional and requested dynamically — `setupDependencies` reads the selection from `store.json`, so with nothing selected Nextcloud has no dependencies at all.

### How the External Storage integration works

Each source's files live on a host-backed volume (real files on disk, not a live cross-namespace mount), so they can be shared end-to-end in package code alone. File Browser is StartOS's shared storage hub — other services write into its `data` volume — and is the only source wired up today; the mechanism below is written to be identical for any future source. When you select a source in the External Storage action:

1. **Mount** — `setupMain` mounts File Browser's `data` volume into Nextcloud's container at `/mnt/filebrowser`, **read-write**. The cron container gets the same mount so background jobs see it.
2. **Permissions** — StartOS services run in separate user namespaces and dependency mounts are idmapped, so the two services' on-disk uids never line up. **Moving a file out** of the mount (the headline use case) is a copy-then-delete, so Nextcloud (uid 33, the "other" class here) needs two things: to **read** the file (to copy it) and to **unlink** it (delete needs write+execute on the file's *parent directory*, not on the file). So the package opens up both — directories to `a+rwx`, files to `a+rw` — for the "other" class (idmap-safe, since "other" isn't tied to a uid). Files matter because the source does **not** reliably make them other-readable: File Browser, for one, creates files mode `640`, which Nextcloud couldn't otherwise read.
   - A root `prep-external-storage` oneshot does the initial pass at startup, before Nextcloud serves.
   - A background loop in the **cron** container re-applies it every ~10s (`PERMS_REFRESH_SECS`), so files/folders the source creates *after* startup become readable+movable without a restart. The `! -perm` filters skip already-open entries, so steady state is just the tree walk.
   - **Why chmod, and why repeated:** a one-time pass can't cover later entries; POSIX default ACLs can't either (a new entry's permissions are masked by the source's umask); and StartOS doesn't expose the dependency mount's idmap, so we can't make Nextcloud the *owner* (the clean fix, needing no permission machinery). A plain `chmod`, re-applied, is the only reliable lever — a deliberately minimal stopgap for that platform gap.
3. **Register** — an `external-storage` oneshot runs `occ files_external:create "/FileBrowser" local null::null -c datadir=/mnt/filebrowser`, makes it applicable to that source's chosen Nextcloud users (`--add-user`, or `--add-all` when none are specified), and sets `filesystem_check_changes 1` so out-of-band writes by other services appear on access. Clearing the selection runs `occ files_external:delete`. Each source's applicable-users set is reconciled independently whenever the selection changes.

The selection lives in `store.json` (`externalStorages` + `externalStorageUsers`); the last-applied configuration is recorded separately as an opaque signature at `externalStoragesConfigured`, so the reconcile oneshot does `occ` work only when the desired and applied signatures differ, and its write does not rebuild the daemon chain — the same desired/actual split the long-running task actions use (`actions.pending` vs `actions.completed`).

**Read-write caveat:** the supported workflow is **moving files out of a source into Nextcloud** via the Files UI. A file dropped into the source becomes movable within the refresh interval (`PERMS_REFRESH_SECS`, ~10s), not instantly. On a very large source the periodic tree walk is the main cost. Permissions are opened to the "other" class (files become `a+rw`), which is broad; acceptable on a single-tenant sovereign server but worth being aware of. Writing files *into* the mount from Nextcloud works, but a file Nextcloud creates there keeps Nextcloud's ownership, so the source service may not be able to modify it in place.

**Platform note — the clean fix.** All of this permission machinery exists only because the SDK's `mountDependency` does not expose the mount's **id-map**. If a future StartOS/SDK release let a dependent map the source's uid onto Nextcloud's `www-data` (33), Nextcloud would simply *own* the mounted files — no `chmod`, no cron-container loop, no `~10s` lag, and in-place edits would work in both directions. `openPermsCmd` and the refresh loop in `main.ts` could then be deleted outright. This is the recommended long-term direction, and the one change that would make this integration fully clean.

---

## Backups and Restore

**Database:** Uses `pg_dump`/`pg_restore` for PostgreSQL instead of raw volume rsync. The dump is written directly to the backup target.

**Volumes backed up via rsync:**

- `main` — StartOS metadata (admin password)
- `nextcloud` — User files (`data/`), installed apps (`custom_apps/`), `config.php` (`config/`)

**NOT included in backup:**

- `db` volume — Not rsynced directly; database is captured via `pg_dump`
- **External Storage sources** (e.g. File Browser, via the External Storage action) — the mounted files live on the *source* service's own volume (surfaced inside Nextcloud at `/mnt/filebrowser`), which is never one of the synced paths above, so they are not duplicated here; the source service backs up its own data. Only the external-mount **configuration** and filecache index are captured (in the `pg_dump`), and the selection itself rides along in `store.json` on the `main` volume — so on restore the mount re-links automatically (once the source service is present)

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

The Nextcloud daemon will not start until PostgreSQL and Valkey are both confirmed ready. Each long-running CLI action (Download Models, Index Memories, Setup Map) writes its identifier into `store.json` at `actions.pending.<id>` with `Date.now()` as the value. The `long-running-tasks` oneshot in `setupMain` walks the three known IDs in declared order and runs the underlying `occ` command for any whose `pending` timestamp is newer than its `completed` timestamp (or whose `completed` is absent). When the `occ` child exits — whether it succeeded or failed — `runOcc` posts a completion notification to the StartOS notifications panel (success-level, or error-level on a non-zero exit, whose "View Details" body shows the exit code or terminating signal plus the last `LOG_TAIL_LINES` lines of the command's combined stdout/stderr) and writes a fresh timestamp into `actions.completed.<id>` so a failed run doesn't loop. On abort (service stop or chain rebuild), the child is SIGKILLed and neither the notification nor the `completed` timestamp is written, so the work resumes on next start (occ commands are idempotent). Output streams to the service logs in real time; `runOcc` retains only the last `LOG_TAIL_LINES` lines of it in memory, which become the failure notification's tail.

Reactivity is armed at chain build via `storeJson.read((s) => s.actions.pending).const(effects)`. The mapped subscription only watches the `pending` bag — writes to `actions.completed` produce the same mapped value, so the SDK's eq check dedups them and **no chain rebuild fires on task completion**. Triggering a new action does change `actions.pending` (a new timestamp), so the chain rebuilds immediately, the in-flight `occ` (if any) is aborted, and the new chain's oneshot scans the pending bag from scratch — including any task it just killed, which gets re-run from the start. Re-invoking the same action while it's queued or running short-circuits in the action body (it sees its own `pending > completed` and returns "Already in Progress" without writing anything), so no rebuild fires.

The CLI Tools actions that depend on a Nextcloud app (Recognize for model download, Memories for indexing/map setup) are always shown as enabled. When invoked, they check for the prerequisite app's files under `apps/` or `custom_apps/` on the volume and throw an "Install the X app in Nextcloud first." error if missing. (Action visibility is exported only at install/update time and not reactively refreshed when an app is installed from the Nextcloud admin UI, so disabled-with-reason was unreliable — the run-time check is authoritative.)

---

## Limitations and Differences

1. **No arbitrary host directory mounts** — You cannot mount arbitrary host paths. You *can* surface another StartOS service's storage with the **External Storage** action (currently File Browser; see [Dependencies](#dependencies)), and you can attach remote storage (S3, SMB, WebDAV, etc.) through Nextcloud's built-in External Storage app.
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
dependencies:
  filebrowser: optional, exists >=2.63.2:0 (only while selected in the External Storage action; mounted read-write at /mnt/filebrowser)
startos_managed_env_vars:
  - PHP_MEMORY_LIMIT
  - PHP_UPLOAD_LIMIT
  - POSTGRES_DB
  - POSTGRES_USER
  - POSTGRES_HOST
  - PGDATA
actions:
  - set-config
  - external-storage
  - reset-admin
  - disable-maintenance
  - disable-unstable-apps
  - scan-files
  - repair
  - download-models
  - index-memories
  - index-places
  - create-admin-user
```
