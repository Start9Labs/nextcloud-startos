<p align="center">
  <img src="icon.png" alt="Nextcloud Logo" width="21%">
</p>

# Nextcloud on StartOS

> **Upstream docs:** <https://docs.nextcloud.com/server/stable/admin_manual/>
>
> Everything not listed in this document should behave the same as upstream
> Nextcloud 32.0.5. If a feature, setting, or behavior is not mentioned
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

This package runs **three containers** as subcontainers:

| Container | Image | Purpose |
|-----------|-------|---------|
| nextcloud | `nextcloud:32.0.5-apache` | Nextcloud application with Apache and PHP-FPM |
| postgres | `postgres:17-alpine` | PostgreSQL 17 database |
| valkey | `valkey/valkey:9-alpine` | Redis-compatible in-memory cache |

Architectures: x86_64, aarch64.

**Startup order:** A `chown` one-shot runs first alongside `postgres` and `valkey`. The `nextcloud` container waits until all three are ready before starting.

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

**Upgrade from StartOS 0.3.x:** The migration from Nextcloud 31 (0.3.5x) to 32 (0.4.0) handles PostgreSQL data directory relocation (Debian path to Docker canonical path), `config.yaml` to `config.php` migration, and admin password migration to the new store format. Users must have run Nextcloud 31 on 0.3.5x at least once (to complete the PG 15 to 17 upgrade) before upgrading.

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

Downloads ML models (~1-2 GB) for object and face identification. Requires the Recognize app to be installed first. Can take up to 15 minutes.

### Index Media for Memories

**Group:** CLI Tools

Forces re-indexing of media files for the Memories app. Normally runs automatically via background tasks every 5 minutes. Requires the Memories app to be installed and a media path selected.

### Setup Map for Memories

**Group:** CLI Tools

Downloads map data (~2-3 GB, ~561,000 geometries) for reverse geotagging photos. Requires the Memories app to be installed. Resource-intensive — avoid running alongside other heavy operations.

### Get Admin Credentials

Hidden action that runs once after initial install as a critical task. Retrieves the auto-generated admin username (`admin`) and password. Only available when stopped.

---

## Dependencies

None. Nextcloud on StartOS is fully self-contained with its own database and cache.

---

## Backups and Restore

**Included in backup:**

- `main` — StartOS metadata (admin password)
- `nextcloud` — User files, installed apps, `config.php`
- `db` — Full PostgreSQL database

**Restore behavior:**

- All data, configuration, and installed apps are restored
- No reconfiguration needed

**Note:** Backups can be very large depending on user files. The database volume also grows with file metadata and activity history.

---

## Health Checks

| Check | Method | Target | Display |
|-------|--------|--------|---------|
| Web Interface | Port listening | Port 80 | "The web interface is ready" |
| PostgreSQL | `pg_isready` | localhost | Internal only |
| Valkey | `valkey-cli ping` | localhost | Internal only |

The Nextcloud daemon will not start until PostgreSQL and Valkey are both confirmed ready.

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
upstream_version: 32.0.5
containers:
  - name: nextcloud
    image: nextcloud:32.0.5-apache
  - name: postgres
    image: postgres:17-alpine
  - name: valkey
    image: valkey/valkey:9-alpine

volumes:
  main:
    backup: true
    purpose: StartOS metadata, admin password
  nextcloud:
    mount: /var/www/html
    backup: true
    purpose: app code, user files, config.php
  db:
    mount: /var/lib/postgresql
    backup: true
    purpose: PostgreSQL data

interfaces:
  webui:
    type: ui
    port: 80
    path: /
  webdav:
    type: api
    port: 80
    path: /remote.php/dav/

enforced_config:
  trusted_proxies: ["10.0.3.0/24"]
  memcache.local: \OC\Memcache\APCu
  memcache.distributed: \OC\Memcache\Redis
  memcache.locking: \OC\Memcache\Redis
  filelocking.enabled: true
  redis: {host: localhost, port: 6379}
  updatechecker: false
  check_for_working_wellknown_setup: true
  integrity.check.disabled: true

user_config:
  - default_locale (select)
  - default_phone_region (select)
  - maintenance_window_start (0-24)

actions:
  - id: set-config
    name: Configure
    has_input: true
  - id: reset-admin
    name: Reset Admin Password
    has_input: true
    requires: running
  - id: disable-maintenance
    name: Disable Maintenance Mode
    group: CLI Tools
    requires: running
  - id: disable-unstable-apps
    name: Disable Non-default Apps
    requires: running
  - id: download-models
    name: Download ML Models for Recognize
    group: CLI Tools
    requires: running
  - id: index-memories
    name: Index Media for Memories
    group: CLI Tools
    requires: running
  - id: index-places
    name: Setup Map for Memories
    group: CLI Tools
    requires: running
  - id: create-admin-user
    name: Get Admin Credentials
    hidden: true
    requires: stopped

dependencies: []

health_checks:
  - name: Web Interface
    method: port_listening
    port: 80
  - name: PostgreSQL
    method: pg_isready
    internal: true
  - name: Valkey
    method: valkey-cli ping
    internal: true

php_limits:
  memory: 1024M
  upload: 20480M

backup_volumes: [main, nextcloud, db]
```
