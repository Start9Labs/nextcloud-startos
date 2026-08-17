<p align="center">
  <img src="icon.svg" alt="Nextcloud Logo" width="21%">
</p>

# Nextcloud on StartOS

> Everything not listed in this document should behave the same as upstream
> Nextcloud. If a feature, setting, or behavior is not mentioned here, the
> upstream documentation is accurate and fully applicable — see the
> Documentation section of `instructions.md` for links.

[Nextcloud](https://github.com/nextcloud/docker) is a self-hosted file sync, sharing, and collaboration platform. This package bundles the PostgreSQL and Valkey it needs, runs Nextcloud's version upgrades inside StartOS's snapshot so a failed one rolls back, and can surface another StartOS service's files as a folder in Nextcloud Files.

- **Upstream repo:** <https://github.com/nextcloud/docker>
- **Wrapper repo:** <https://github.com/Start9Labs/nextcloud-startos>

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [File Models](#file-models)
- [Dependencies](#dependencies)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Actions](#actions)
- [Tasks](#tasks)
- [Health Checks](#health-checks)
- [Backups and Restore](#backups-and-restore)
- [Limitations and Differences](#limitations-and-differences)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

Three images: PostgreSQL and Valkey upstream and unmodified, and Nextcloud's own Apache image with `ffmpeg` added for the media-handling apps.

| Property      | Value                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------ |
| Images        | Built from `nextcloud.Dockerfile` (`FROM nextcloud:*-apache`), `postgres`, `valkey/valkey` |
| Architectures | x86_64, aarch64                                                                            |

| Subcontainer     | Runs                                                             |
| ---------------- | ---------------------------------------------------------------- |
| `nextcloud-sub`  | The web daemon, and every `occ` oneshot — the one to `attach` to |
| `nextcloud-cron` | Nextcloud's background job runner (`/cron.sh`)                   |
| `postgres-sub`   | The private database                                             |
| `valkey`         | The memcache, locking, and distributed cache backend             |

Five oneshots run alongside them, in order: `chown` hands the data directory to `www-data`; `pg-recover` clears a stranded `postmaster.pid`; `finish-upgrade` completes a Nextcloud upgrade an interrupted start left half-done; `long-running-tasks` runs whatever `occ` work has been queued; `external-storage` reconciles the mounts.

**`finish-upgrade` runs after the web daemon is ready, not before it**, which is what makes it safe. In the normal case the upgrade has already happened during init and this is a no-op; when it does have work to do, Apache is up serving the maintenance page while `occ upgrade` runs, exactly as a manual recovery would. It fails open — nothing it does can prevent the service from serving.

## Volume and Data Layout

Three volumes.

| Volume      | Mount Point           | Purpose                                                                      |
| ----------- | --------------------- | ---------------------------------------------------------------------------- |
| `nextcloud` | `/var/www/html`       | The whole Nextcloud tree: user files, `config/`, apps, and the deployed code |
| `db`        | `/var/lib/postgresql` | The PostgreSQL data directory                                                |
| `main`      | — (host side)         | `store.json`; never mounted into a container                                 |

An external-storage source's volume is mounted into the Nextcloud container as well — File Browser's lands at `/mnt/filebrowser`, outside the `nextcloud` volume. **That mount uses `idmap`** to remap the source's on-disk uid to `www-data`, so Nextcloud simply owns the tree: it reads, writes, and moves files with no permission machinery, and the files it creates land back on disk under the source's own uid so the source can still manage them.

## File Models

Two models, and only one of them is upstream's.

| File                | Volume      | Format | Modelled                | Written by                            |
| ------------------- | ----------- | ------ | ----------------------- | ------------------------------------- |
| `config/config.php` | `nextcloud` | PHP    | Yes — `FileHelper.raw`  | Every start, and the Configure action |
| `store.json`        | `main`      | JSON   | Yes — `FileHelper.json` | Install, and several actions          |

`config.php` is PHP, not a config format any parser handles, so the model carries a **PEG grammar** (`php.pegjs`) to read it and a serializer to write it back. That is why the shape is narrow: only the keys listed below are modelled, and **any key you add by hand is dropped the next time the package writes the file** — unlike the JSON model alongside it, where an undeclared key is left alone.

**Enforced** — re-asserted whenever the package writes: the database connection (type, name, host, user, table prefix), the Valkey memcache trio and its connection, `datadirectory`, `trusted_proxies` (the service bridge's subnet), `filelocking.enabled`, `check_for_working_wellknown_setup`, and the two below.

**Derived** — `trusted_domains`, rebuilt on every start from the addresses the UI interface actually publishes. It is a reactive read reduced all the way down to a sorted, de-duplicated hostname list, so the service restarts when a hostname appears or disappears and not when unrelated address metadata churns.

**Seeded once** — `dbpassword`, written by Nextcloud's own installer during install; it is also the credential the backup's dump authenticates with.

**Yours** — the four settings the Configure action owns: default locale, default phone region, the maintenance-window start hour, and whether new accounts get skeleton files.

Three settings depart from what upstream would do:

| Key                        | Here                               | Why                                                                                                                           |
| -------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `updatechecker`            | `false`                            | Nextcloud's own updater is not the update path here — StartOS ships the new image                                             |
| `updater.server.url`       | a reserved never-resolving address | `occ update:check` is the one path `updatechecker` does not gate, and it would otherwise reach Nextcloud's real update server |
| `integrity.check.disabled` | `true`                             | The image adds `ffmpeg` and the package rewrites `config.php`, so the signature check would fail on a correct install         |

`store.json` is StartOS state that has no place in `config.php`: the install-time admin password (held only until it is shown once), the queue of long-running `occ` tasks, and the external-storage selection.

## Dependencies

None are required. One is optional and exists only while it is selected.

| Dependency    | Kind     | Required                                         |
| ------------- | -------- | ------------------------------------------------ |
| `filebrowser` | `exists` | Only while chosen in the External Storage action |

The External Storage action offers only the sources whose backing service is actually installed, so an uninstalled one never appears in the form.

## Network Access and Interfaces

Two interfaces, both on the same binding and port. WebDAV is the same server under a different path, offered separately so the desktop and mobile sync clients have an address to copy.

| Interface | Id       | Type | Port | Path               | Description                    |
| --------- | -------- | ---- | ---- | ------------------ | ------------------------------ |
| Web UI    | `ui`     | ui   | 80   | `/`                | The web interface of Nextcloud |
| WebDAV    | `webdav` | api  | 80   | `/remote.php/dav/` | Addresses for WebDAV syncing   |

Neither is masked. The addresses published for `ui` are what init writes into `trusted_domains`, so an address Nextcloud does not know about is rejected by Nextcloud itself, not by StartOS.

## Installation and First-Run Flow

Install is not a matter of writing a config and starting: the package brings the whole stack up under `runUntilSuccess`, lets Nextcloud's own installer run to completion against the bundled database, and tears it down again. The admin account is created as `admin` with a generated password, and the PostgreSQL password is generated at the same time.

A `critical` task then asks you to reveal the admin password. **The action that does so is available only while the service is stopped, and it clears the password from the store once shown** — so save it when it is offered. If it is lost afterwards, Reset Admin Password is the way back in.

**Updates run during init, inside StartOS's snapshot.** When the bundled Nextcloud release is newer than the installed one, the package runs the image's own upgrade to completion before the service ever starts; a failure or a thirty-minute timeout fails init and StartOS rolls the whole update back. Skipping more than one major version is refused up front with a clear error rather than allowed to fail mid-run, because Nextcloud only supports one major at a time.

## Actions

Eleven actions in three groups, plus one hidden.

### Configure

The four general settings: default locale, default phone region, the maintenance-window start hour, and whether new accounts are seeded with skeleton files.

- **What it changes:** those keys in `config.php`.
- **Cost:** seconds, then a restart.
- **Repeat safety:** idempotent; the form is pre-filled.

### External Storage

Surfaces another StartOS service's files as a folder in Nextcloud Files, using Nextcloud's built-in External Storage app.

- **What it changes:** the selection in `store.json`; through it the package's dependency, the container mount, and Nextcloud's own `files_external` entries, which the `external-storage` oneshot reconciles on the next start.
- **Cost:** seconds, then a restart.
- **Repeat safety:** idempotent — the oneshot compares a signature of the desired state against the applied one and does nothing when they match.
- **Availability: only while the service is running**, since the per-source user picker reads the live Nextcloud user list.
- **Per-source scoping.** Each source is off, available to all users, or restricted to a chosen set. Clearing a source deletes its `files_external` entry; it does not delete any files.

### Maintenance — Reset Admin Password, Disable Maintenance Mode, Disable Non-default Apps, Scan Files, Repair

- **Reset Admin Password** generates a new password for a chosen admin account and shows it once. Only while running; the account list is read live.
- **Disable Maintenance Mode** clears a stuck maintenance flag. Only while running. **Wait first** — brief maintenance mode after an update or a restart is normal, and this is for when it has lasted more than about fifteen minutes.
- **Disable Non-default Apps** turns off every app that is not part of Nextcloud's default set. It is the recovery for an app that has made the UI return an Internal Server Error. Only while running, and **stable apps must be re-enabled individually afterwards.**
- **Scan Files** rebuilds the file-cache index, which is what makes files added outside Nextcloud — over WebDAV's back door, rsync, or an external-storage mount — appear with correct sizes and turn up in search.
- **Repair** runs Nextcloud's built-in repair routine against database inconsistencies, stale cache entries, and broken shares.

### App Commands — Download Machine Learning Models for Recognize, Index Media for Memories, Setup Map for Memories

Three commands belonging to Nextcloud apps you install yourself. Each refuses up front if the app's files are not on the volume, so the error names the missing app rather than surfacing as an `occ` failure.

- **Download Machine Learning Models** fetches Recognize's models — up to fifteen minutes and 1–2 GB.
- **Index Media for Memories** forces a full media re-index. Memories already re-indexes every five minutes on its own, so this is for forcing the issue.
- **Setup Map for Memories** downloads roughly 2–3 GB of geometry data and re-indexes for reverse geotagging.

### Queued tasks, and what "restarts the service" means

Scan Files, Repair, and the three App Commands do not run inline — each records a pending timestamp and returns immediately, and the service restarts so the `long-running-tasks` oneshot picks the work up in the main container.

- **Cost:** minutes to hours, plus the restart. The work continues after the action returns.
- **Repeat safety:** invoking one while it is already queued or running is a no-op that says so. All of the underlying commands are idempotent, so an interrupted run simply resumes on the next start.
- **Where progress shows.** While one runs it has its own health check on the service's status page. When it finishes, that check disappears — so the durable signal is a **notification**, posted whether it succeeded or failed. A failure's notification carries the exit code and the last sixty lines of output; the full log is in the service logs.

### Get Admin Credentials (hidden)

Not user-facing — it is surfaced by the install task alone. Available only while the service is stopped, it shows the generated admin username and password once and then clears the password from `store.json`.

## Tasks

One task, raised at install.

| Task                  | Severity   | Raised when | Cleared when    |
| --------------------- | ---------- | ----------- | --------------- |
| Get Admin Credentials | `critical` | At install  | The action runs |

`critical` because the password is shown exactly once and discarded; if the task is dismissed without running it, the only route to an admin account is Reset Admin Password.

## Health Checks

Four fixed checks and up to five that appear only while a queued task is running.

| Check       | Displayed       | Method               | Grace |
| ----------- | --------------- | -------------------- | ----- |
| `postgres`  | Hidden          | `pg_isready`         | —     |
| `valkey`    | Hidden          | `valkey-cli ping`    | —     |
| `nextcloud` | "Web Interface" | Port 80 is listening | 5 min |
| `cron`      | Hidden          | Always healthy       | —     |

The database and cache checks report `loading` rather than failing while they come up, and are not displayed because there is nothing for a user to do about either.

**The five-minute grace on the web check is upgrade cover.** Restoring an older backup can still leave the image's entrypoint to run `occ upgrade` before it binds the port, with the UI legitimately down for the migration. Treating that window as "starting" is what stops the status page from inviting a restart mid-upgrade — which is the thing that corrupts it.

A web-interface failure after the grace period is Nextcloud itself: an app that fails to load, a `config.php` value it rejects, or a database it cannot reach. It names the cause in the service logs. A UI reporting "Update needed — use the command line updater" is the case `finish-upgrade` handles automatically on the next start.

The transient checks — Recognize Model Download, Memories Indexing, Memories Map Setup, File Scan, Repair — exist only while their task is pending, and report `loading` with a progress message throughout.

## Backups and Restore

Mixed, and each half is scoped deliberately.

- **`db` is dumped, not copied.** `Backups.withPgDump` takes a logical dump, authenticating with the `dbpassword` read out of `config.php`.
- **`main` is copied wholesale** — `store.json`.
- **Three subpaths of `nextcloud` are synced**: `data/` (user files), `config/` (`config.php`), and `custom_apps/` (apps you installed). The rest of the volume — Nextcloud's own code and its built-in `apps/` — is not, because it comes from the image.
- **External-storage sources are deliberately excluded.** Their files live on the source service's volume, mounted in from outside the synced paths, and that service backs up its own data. Only the mount's configuration and its filecache index travel in the dump, which is enough for the mount to re-link itself on restore.

**Restore is complete** for everything Nextcloud owns — files, accounts, shares, and installed apps all return. If the restored server publishes different addresses, `trusted_domains` is rebuilt from the live ones on the first start rather than carried over.

## Limitations and Differences

1. **Hand edits to `config.php` do not survive.** Only the modelled keys are preserved; anything else is dropped the next time the package writes the file.
2. **Nextcloud's in-app updater is disabled and its update server is unreachable by design.** Updates arrive as new StartOS package versions, and they run during init inside a snapshot so a failed one rolls back. `occ update:check` consequently reports nothing available, whatever upstream has released.
3. **Skipping a major version is refused.** Nextcloud upgrades one major at a time, and the package fails the update up front rather than mid-run.
4. **The code-integrity check is disabled**, because the image adds `ffmpeg` and the package rewrites `config.php`.
5. **PostgreSQL and Valkey are private sidecars.** Neither can be shared with another service or replaced with an external instance.
6. **The admin password is shown once and then discarded.** Reset Admin Password is the only recovery.
7. **The long-running actions restart the service** to run their work, and continue after the action returns.
8. **External storage is limited to registered sources** — currently File Browser — and only while that service is installed.
9. **No riscv64 build.** x86_64 and aarch64 only.

---

## Quick Reference for AI Consumers

```yaml
package_id: nextcloud
image: ./nextcloud.Dockerfile # FROM nextcloud:*-apache, plus ffmpeg; also postgres and valkey/valkey
architectures:
  - x86_64
  - aarch64
subcontainers:
  - nextcloud-sub # web daemon and every occ oneshot; the one to attach to
  - nextcloud-cron # /cron.sh background jobs
  - postgres-sub # private database
  - valkey # memcache, locking, distributed cache
volumes:
  nextcloud: /var/www/html
  db: /var/lib/postgresql (in postgres-sub)
  main: host side (store.json)
file_models:
  - /var/www/html/config/config.php
  - store.json
startos_managed_env_vars:
  - POSTGRES_DB
  - POSTGRES_USER
  - POSTGRES_HOST
  - POSTGRES_PASSWORD # install and the bundled database only
  - PGDATA
  - PHP_MEMORY_LIMIT
  - PHP_UPLOAD_LIMIT
  - NEXTCLOUD_ADMIN_USER # install only
  - NEXTCLOUD_ADMIN_PASSWORD # install only
  - NEXTCLOUD_UPDATE # the init-time upgrade run only
dependencies:
  - filebrowser # optional, exists; only while selected as an external-storage source
interfaces:
  ui: { type: ui, port: 80 }
  webdav: { type: api, port: 80 } # same binding, path /remote.php/dav/
actions:
  - set-config
  - external-storage # only-running
  - reset-admin # only-running
  - disable-maintenance # only-running
  - disable-unstable-apps # only-running
  - scan-files # queued; restarts the service
  - repair # queued; restarts the service
  - download-models # queued; requires the Recognize app
  - index-memories # queued; requires the Memories app
  - index-places # queued; requires the Memories app
  - get-admin-credentials # hidden, only-stopped; shown once then discarded
tasks:
  - { action: get-admin-credentials, severity: critical }
health_checks:
  - postgres # hidden
  - valkey # hidden
  - nextcloud # displayed "Web Interface"
  - cron # hidden
  - recognize-models # only while that task is pending
  - memories-indexing # only while that task is pending
  - memories-map-setup # only while that task is pending
  - scan-files # only while that task is pending
  - repair # only while that task is pending
```
