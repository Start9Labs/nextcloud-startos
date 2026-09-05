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

Three images: PostgreSQL and Valkey upstream and unmodified, and Nextcloud's own Apache image with `ffmpeg` added for the media-handling apps and Apache's connection timeouts raised for the StartOS reverse proxy (see Network Access and Interfaces).

| Property      | Value                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------ |
| Images        | Built from `nextcloud.Dockerfile` (`FROM nextcloud:*-apache`), `postgres`, `valkey/valkey` |
| Architectures | x86_64, aarch64                                                                            |

| Subcontainer         | Runs                                                             |
| -------------------- | ---------------------------------------------------------------- |
| `nextcloud-sub`      | The web daemon, and every `occ` oneshot — the one to `attach` to |
| `nextcloud-cron`     | Nextcloud's background job runner (`/cron.sh`)                   |
| `postgres-sub`       | The private database                                             |
| `valkey`             | The memcache, locking, and distributed cache backend             |
| `coturn-secret-read` | Temporary; reads Coturn's shared secret through its own mount    |

Six oneshots run alongside them, in order: `chown` hands the data directory to `www-data`; `pg-recover` clears a stranded `postmaster.pid`; `finish-upgrade` completes a Nextcloud upgrade an interrupted start left half-done; `long-running-tasks` runs whatever `occ` work has been queued; `external-storage` reconciles the mounts; `talk-turn` reconciles Nextcloud Talk's STUN/TURN settings.

**`finish-upgrade` runs after the web daemon is ready, not before it**, which is what makes it safe. In the normal case the upgrade has already happened during init and this is a no-op; when it does have work to do, Apache is up serving the maintenance page while `occ upgrade` runs, exactly as a manual recovery would. It fails open — nothing it does can prevent the service from serving.

Apache also carries a generated `startos-office.conf`, written into the container's filesystem on every start; the four proxy modules it needs are enabled in the image. It puts the chosen document server on Nextcloud's own origin — `/browser`, `/cool` and `/hosting` for Collabora, `/ds-vpath` for ONLYOFFICE — which is what lets the editor work on every address Nextcloud is reachable at rather than one. The file is empty when no office suite is selected.

For Collabora it also rewrites the WOPI discovery response, stripping the absolute origin out of every `urlsrc` so the editor loads same-origin — Nextcloud otherwise copies Collabora's own absolute address into the editor frame verbatim, pinning it to one address. Tracked upstream as nextcloud/richdocuments#6019; if that lands, the rewrite can go.

## Volume and Data Layout

Three volumes.

| Volume      | Mount Point           | Purpose                                                                      |
| ----------- | --------------------- | ---------------------------------------------------------------------------- |
| `nextcloud` | `/var/www/html`       | The whole Nextcloud tree: user files, `config/`, apps, and the deployed code |
| `db`        | `/var/lib/postgresql` | The PostgreSQL data directory                                                |
| `main`      | — (host side)         | `store.json`; never mounted into a container                                 |

An external-storage source's volume is mounted into the Nextcloud container as well — FileBrowser Quantum's lands at `/mnt/filebrowser`, outside the `nextcloud` volume. **That mount uses `idmap`** to remap the source's on-disk uid to `www-data`, so Nextcloud simply owns the tree: it reads, writes, and moves files with no permission machinery, and the files it creates land back on disk under the source's own uid so the source can still manage them.

## File Models

Two models, and only one of them is upstream's.

| File                | Volume      | Format | Modelled                | Written by                            |
| ------------------- | ----------- | ------ | ----------------------- | ------------------------------------- |
| `config/config.php` | `nextcloud` | PHP    | Yes — `FileHelper.raw`  | Every start, and the Configure action |
| `store.json`        | `main`      | JSON   | Yes — `FileHelper.json` | Install, and several actions          |

`config.php` is PHP, not a config format any parser handles, so the model carries a **PEG grammar** (`php.pegjs`) to read it and a serializer to write it back. **A key outside the shape survives**: the SDK's `z.object` is loose, so `instanceid`, `passwordsalt`, `secret` and anything a Nextcloud app or an admin adds are read, kept and written back. A key the shape models keeps its value too, unless the shape rejects it or pins it to a literal — the enforced list below. A value written in a form the grammar does not model is left exactly as it was found, so a setting the package cannot interpret can never stop it from starting.

**Enforced** — re-asserted whenever the package writes: the database connection (type, name, host, port, user, table prefix), the Valkey memcache trio and its connection, `datadirectory`, `trusted_proxies` (the service bridge's subnet), `filelocking.enabled`, `check_for_working_wellknown_setup`, `overwriteprotocol` (held unset, so a value set by hand is removed), and the three in the table below.

**Derived** — `trusted_domains`, rebuilt on every start from the addresses the UI interface actually publishes. It is a reactive read reduced all the way down to a sorted, de-duplicated hostname list, so the service restarts when a hostname appears or disappears and not when unrelated address metadata churns.

**Defaulted** — `overwrite.cli.url` keeps whatever it is set to, but a missing or blank value is replaced with `http://localhost`, the value Nextcloud's own installer writes. Nextcloud's Teams app takes its local instance name from it and fails the personal settings page without one.

**Seeded once** — `dbpassword`, written by Nextcloud's own installer during install; it is also the credential the backup's dump authenticates with.

**Yours** — the five settings the Configure action owns: default locale, default phone region, how long deleted files are kept, the maintenance-window start hour, and whether new accounts get skeleton files.

Three settings depart from what upstream would do:

| Key                        | Here                               | Why                                                                                                                           |
| -------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `updatechecker`            | `false`                            | Nextcloud's own updater is not the update path here — StartOS ships the new image                                             |
| `updater.server.url`       | a reserved never-resolving address | `occ update:check` is the one path `updatechecker` does not gate, and it would otherwise reach Nextcloud's real update server |
| `integrity.check.disabled` | `true`                             | The image adds `ffmpeg` and the package rewrites `config.php`, so the signature check would fail on a correct install         |

`store.json` is StartOS state that has no place in `config.php`: the install-time admin password (held only until it is shown once), the queue of long-running `occ` tasks, the external-storage selection, the Talk STUN/TURN relay toggle, and the office-suite choice — each of the last two alongside a signature of what was last applied for it, which is how a reconcile knows what to clear before it writes.

## Dependencies

None are required. Both are optional and exist only while they are selected.

| Dependency         | Kind      | Health checks    | Required                                                                                             |
| ------------------ | --------- | ---------------- | ---------------------------------------------------------------------------------------------------- |
| `filebrowser`      | `exists`  | —                | Only while chosen in the External Storage action                                                     |
| `coturn`           | `running` | **none**         | Only while Talk call relaying is on in the Configure action                                          |
| `collabora-online` | `running` | `cool`           | Only while chosen in the Office Suite action                                                         |
| `onlyoffice-docs`  | `running` | `documentserver` | Only while chosen in the Office Suite action; published to the Community Registry, not the Start9 one |

The External Storage action offers only the sources whose backing service is actually installed, so an uninstalled one never appears in the form.

**Coturn declares no health check, deliberately.** Coturn's own `TURN Server` check fails until you attach a public domain to it, and naming it here would leave Nextcloud showing a permanently unmet dependency even though Talk works fine without a relay. Coturn's own check already says what is missing.

The shared secret is read through a throwaway container that mounts only Coturn's `shared` subpath read-only — so a missing or broken Coturn can never take Nextcloud's own daemons down, and the rest of Coturn's volume stays out of view. ONLYOFFICE's JWT secret is read the same way, from its own `shared` subpath.

**The office backends are mutually exclusive**, and only the chosen one is declared. Unlike Coturn they do name a health check: Nextcloud can hand a document to a document server that is up, and cannot to one that is starting.

## Network Access and Interfaces

Two interfaces, both on the same binding and port. WebDAV is the same server under a different path, offered separately so the desktop and mobile sync clients have an address to copy.

| Interface | Id       | Type | Port | Path               | Description                    |
| --------- | -------- | ---- | ---- | ------------------ | ------------------------------ |
| Web UI    | `ui`     | ui   | 80   | `/`                | The web interface of Nextcloud |
| WebDAV    | `webdav` | api  | 80   | `/remote.php/dav/` | Addresses for WebDAV syncing   |

Neither is masked. The addresses published for `ui` are what init writes into `trusted_domains`, so an address Nextcloud does not know about is rejected by Nextcloud itself, not by StartOS.

**Apache's connection timeouts are raised above every hop in front of it** — `KeepAliveTimeout 75` and `RequestReadTimeout header=90`, via `startos-proxy-keepalive.conf` baked into the image. The StartOS reverse proxy pins each client connection to a single backend connection (it never re-dials) and holds idle client connections for up to 60 seconds, and sync clients poll every 30; Debian's stock timeouts (5 s keep-alive, 20–40 s request-read) closed the backend leg first, which desktop clients experienced as periodic "Network error" disconnect/reconnect flaps, with paired `" -" 408 0` entries from the bridge gateway (`10.0.3.1`) in the service log at each flap. Details in the start-os issue: <https://github.com/Start9Labs/start-technologies/issues/3731>. If those symptoms return, first check the snippet is still enabled: `start-cli package attach nextcloud -n nextcloud-sub -- ls /etc/apache2/conf-enabled/`.

**The request scheme is per-request, derived from the proxy's `X-Forwarded-Proto`.** TLS terminates at the StartOS reverse proxy, which strips any client-supplied `X-Forwarded-Proto`/`X-Forwarded-For` on TLS bindings and injects its own; Apache always sees plain http. Nextcloud honors the header because the proxy connects from the container bridge, which `trusted_proxies` (`10.0.3.0/24`) covers, so PHP-generated URLs come out `https` on TLS addresses and `http` on plain ones (an onion binding) — which is why `overwriteprotocol` is deliberately kept unset. The image's `mod_remoteip` is disabled (`APACHE_DISABLE_REWRITE_IP=1`) so `REMOTE_ADDR` always is the proxy's IP and that trust can never break. The one place PHP can't help is Apache's own `.htaccess` redirects — `/.well-known/carddav`, `/.well-known/caldav`, and the WebDAV-client redirect on `/` — which absolutize from Apache's scheme; `startos-dav-redirects.conf`, baked into the image, issues those with the forwarded scheme instead, and Nextcloud has no PHP fallback for them (its well-known controller serves only `webfinger`/`nodeinfo`). Details: <https://github.com/Start9Labs/nextcloud-startos/issues/137>. To diagnose, `curl -sk -o /dev/null -w '%{http_code} %{redirect_url}' https://<address>/.well-known/carddav` must redirect to an `https://` URL; an `http://` target means the conf is missing or the header chain is broken.

## Installation and First-Run Flow

Install is not a matter of writing a config and starting: the package brings the whole stack up under `runUntilSuccess`, lets Nextcloud's own installer run to completion against the bundled database, and tears it down again. The admin account is created as `admin` with a generated password, and the PostgreSQL password is generated at the same time.

A `critical` task then asks you to reveal the admin password. **The action that does so is available only while the service is stopped, and it clears the password from the store once shown** — so save it when it is offered. If it is lost afterwards, Reset Admin Password is the way back in.

**Updates run during init, inside StartOS's snapshot.** When the bundled Nextcloud release is newer than the installed one, the package runs the image's own upgrade to completion before the service ever starts; a failure or a thirty-minute timeout fails init and StartOS rolls the whole update back. Skipping more than one major version is refused up front with a clear error rather than allowed to fail mid-run, because Nextcloud only supports one major at a time.

## Actions

Eleven actions in three groups, plus one hidden.

### Configure

The five general settings — default locale, default phone region, how long deleted files are kept, the maintenance-window start hour, and whether new accounts are seeded with skeleton files — plus the Talk call-relay toggle.

- **What it changes:** the first five are keys in `config.php`. **Relay Talk Calls Through Coturn** is a flag in `store.json`; through it the package's Coturn dependency and Nextcloud Talk's own STUN/TURN settings, which the `talk-turn` oneshot reconciles on the next start.
- **Cost:** seconds, then a restart.
- **Repeat safety:** idempotent; the form is pre-filled.

**Delete Files in Trash** sets `trashbin_retention_obligation`. Nextcloud's default (`auto`) keeps a deleted file for at least 30 days and then removes it only as disk space is needed, so on a server with room to spare the trash grows without bound; the presets write `auto, <days>` to cap it, or `disabled` to keep everything. Only the maximum is offered — Nextcloud's `D1, D2` form also sets a guaranteed floor, which would hold files past the cap the user chose.

**Relaying is advertised only once Coturn has a public domain.** With the toggle on but Coturn lacking one, no relay is configured and nothing reports that as an error — Talk falls back to direct connections, which is what it would do anyway. The toggle also does nothing until the Talk app itself is installed from the Nextcloud app store **and enabled** — `occ` exposes an app's command namespace only while it is enabled, and a major Nextcloud upgrade disables any app without a compatible release. Until then the oneshot logs that it is waiting and applies the setting on a later start.

**Only the entries this package added are ever touched.** The `talk-turn` oneshot records what it applied and deletes exactly that before writing the new set, so Talk's default `stun.nextcloud.com:443` and anything an admin added by hand survive. Removing that default is a deliberate choice left to the admin — see Limitations.

### External Storage

Surfaces another StartOS service's files as a folder in Nextcloud Files, using Nextcloud's built-in External Storage app.

- **What it changes:** the selection in `store.json`; through it the package's dependency, the container mount, and Nextcloud's own `files_external` entries, which the `external-storage` oneshot reconciles on the next start.
- **Cost:** seconds, then a restart.
- **Repeat safety:** idempotent — the oneshot compares a signature of the desired state against the applied one and does nothing when they match.
- **Availability: only while the service is running**, since the per-source user picker reads the live Nextcloud user list.
- **Per-source scoping.** Each source is off, available to all users, or restricted to a chosen set. Clearing a source deletes its `files_external` entry; it does not delete any files.

### Office Suite

Selects the document server that opens office files — Collabora Online, ONLYOFFICE Docs, or none. Collabora is labelled recommended in the form and is the right answer for most installs; the trade-off is set out in `instructions.md` under **Which one to choose**, and rests on a measured round-trip rather than a marketing claim: both engines preserve text, tables, images, links, footnotes and fields exactly, but LibreOffice rewrites style-inherited formatting as direct formatting on each run, where ONLYOFFICE returns the file byte-identical in structure.

- **When to run it:** after installing one of the two services, and again to switch or to turn editing off.
- **What it changes:** `officeSuite` in `store.json`. Through it: the package's dependency on that service, the host bridge's IP in `trusted_domains`, the generated Apache proxy that serves the editor from Nextcloud's own origin, and — on the next start, via the `office-suite` oneshot — the connector app's own settings.
- **Cost:** seconds, then a restart.
- **Repeat safety:** idempotent; the form is pre-filled with the current choice.

**Only one connector app may be enabled.** `richdocuments` drops the Microsoft formats out of its default-open capability whenever it finds `onlyoffice` or `officeonline` enabled, and the other app does not pick them up unless it is configured too — so Word, Excel and PowerPoint files open in neither and download instead, with nothing in Nextcloud saying why. The `office-connectors` health check fails while that is the case and names the app to disable.

**Switching deletes the settings written for the previous backend and disables its connector**, so a connector is never left pointed at a service that has since been uninstalled, and the two are never enabled at once — which is the state that stops Word, Excel and PowerPoint opening in either.

**It installs and enables the connector app on a change of selection.** The `office-suite` oneshot runs `occ app:install` for **Nextcloud Office (Collabora)** or **ONLYOFFICE** when that app is absent, and `occ app:enable` when it is present but switched off. Because it sits behind the signature check it fires only when the selection changes, never on an ordinary start — so an app the user later removes or disables stays that way, and the health check reports it rather than the package silently putting it back. Neither command overrides Nextcloud's own compatibility check, so an app with no release for the running major version is refused rather than force-enabled.

**The reconcile waits for the document server to report healthy before it touches anything.** The `office-suite` oneshot watches the chosen service's status and blocks until its own health check passes — `cool` for Collabora, `documentserver` for ONLYOFFICE. That check fetches the same endpoint this package depends on, so passing it means the work below can succeed rather than merely that something is listening. It matters most for `richdocuments:activate-config`, which refreshes the cached discovery document by fetching it: a fetch that fails partway leaves the app holding a WOPI url with no discovery behind it, and every document then opens to a spinner that never resolves.

The wait is a subscription, not a poll. It runs no commands, cannot fail, and releases the moment the service becomes ready — a few tens of seconds into an ordinary start, or whenever the user installs the service if they selected it first. A bridge address is not a usable readiness signal here: the port is bound, and the address therefore resolves, well before `coolwsd` accepts its first connection.

**A step that fails past that gate is retried, not reported.** The oneshot throws, so the SDK re-invokes it on a widening backoff capped at thirty seconds, and every attempt passes through the gate first — a document server that has gone away parks the retry rather than spinning it. The command's output is in the service log on each attempt, and the Office Connector check reads *Setting up …* until an attempt succeeds. Nothing else is needed to recover: an app installed by hand, or an app store that comes back, is picked up by the next attempt.

**The `trusted_domains` entry is load-bearing.** A document server fetches and saves files over the host bridge, and without that entry Nextcloud answers every one of those requests with `Trusted domain error` — the editor opens and then fails to load the document. Nextcloud matches on the host alone, so the bare IP covers whatever port the binding was assigned.

### Maintenance — Reset Admin Password, Disable Maintenance Mode, Disable Non-default Apps, Scan Files, Repair

- **Reset Admin Password** generates a new password for a chosen admin account and shows it once. Only while running; the account list is read live. It carries a warning, so StartOS asks for confirmation first — it replaces on invocation rather than revealing the current password, and signs that user out.
- **Disable Maintenance Mode** clears a stuck maintenance flag. Only while running. **Wait first** — brief maintenance mode after an update or a restart is normal, and this is for when it has lasted more than about fifteen minutes.
- **Disable Non-default Apps** turns off every enabled app that Nextcloud does not ship, preserving the bundled set plus Calendar and Contacts. It is the recovery for an app that has made the UI return an Internal Server Error. Apps are disabled one at a time, and the result lists any that could not be — a fataling app is exactly what this action targets, so its own failure must not hide what did get disabled. Only while running, and **stable apps must be re-enabled individually afterwards.**
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

**Office Connector** (`office-connectors`) — present only while an office suite is selected, and stateless: each poll re-derives its result from `store.json`, the dependency's status and Nextcloud's enabled-app list, so every state heals on its own. Until the `office-suite` oneshot has applied the selection it reports `loading`: *Waiting for Collabora Online to be ready* while the document server's own health check is not passing — the dependency entry on the service page already says why — and *Setting up Nextcloud Office (Collabora)…* once it is, while the connector is installed and configured. Once applied, it reads the enabled-app list and fails in two distinct cases, each with its own instruction. Reading that list boots PHP, so a passing check polls every two minutes and a failing one every fifteen seconds; the loading states, which read nothing from Nextcloud, poll every five. The two-minute ceiling is also how long a connector someone has just switched off keeps reading as enabled.

**The selected suite's connector is not enabled.** It has been removed or switched off since the package set it up. The message says *Install* or *Enable* accordingly — telling someone to install what they already have is how a message stops being read — and names the other way out: selecting `None` in the Office Suite action. Without this the failure is silent: the document server runs, and nothing in Nextcloud opens in it.

**More than one office connector is enabled.** Everything is running and OpenDocument files still open; what breaks is Word, Excel and PowerPoint, silently. `richdocuments` demotes those formats the moment it sees a rival connector enabled, and the rival does not claim them unless it is configured too. The message names the app to disable.

Both clear on the next poll once the condition is resolved. It is a check rather than a task because a task can be dismissed while the breakage remains.

## Backups and Restore

Mixed, and each half is scoped deliberately.

- **`db` is dumped, not copied.** `Backups.withPgDump` takes a logical dump, authenticating with the `dbpassword` read out of `config.php`.
- **`main` is copied wholesale** — `store.json`.
- **Three subpaths of `nextcloud` are synced**: `data/` (user files), `config/` (`config.php`), and `custom_apps/` (apps you installed). The rest of the volume — Nextcloud's own code and its built-in `apps/` — is not, because it comes from the image.
- **External-storage sources are deliberately excluded.** Their files live on the source service's volume, mounted in from outside the synced paths, and that service backs up its own data. Only the mount's configuration and its filecache index travel in the dump, which is enough for the mount to re-link itself on restore.

**Restore is complete** for everything Nextcloud owns — files, accounts, shares, and installed apps all return. If the restored server publishes different addresses, `trusted_domains` is rebuilt from the live ones on the first start rather than carried over.

## Limitations and Differences

1. **The package re-asserts the settings it enforces in `config.php`.** A hand edit to one of the enforced keys listed above is overwritten — or, for `overwriteprotocol`, removed — the next time the package writes the file. Every other key, modelled or not, keeps whatever you set as long as the shape accepts it.
2. **Nextcloud's in-app updater is disabled and its update server is unreachable by design.** Updates arrive as new StartOS package versions, and they run during init inside a snapshot so a failed one rolls back. `occ update:check` consequently reports nothing available, whatever upstream has released.
3. **Skipping a major version is refused.** Nextcloud upgrades one major at a time, and the package fails the update up front rather than mid-run.
4. **The code-integrity check is disabled**, because the image adds `ffmpeg` and the package rewrites `config.php`.
5. **PostgreSQL and Valkey are private sidecars.** Neither can be shared with another service or replaced with an external instance.
6. **The admin password is shown once and then discarded.** Reset Admin Password is the only recovery.
7. **The long-running actions restart the service** to run their work, and continue after the action returns.
8. **External storage is limited to registered sources** — currently FileBrowser Quantum — and only while that service is installed.
9. **Talk's default `stun.nextcloud.com:443` is left in place** when relaying is enabled. Coturn's own STUN entry is added alongside it rather than replacing it, since removing an entry the package did not add is the admin's call; delete it in Talk's admin settings to keep reflexive discovery entirely on your own server.
10. **Talk call relaying is Coturn or nothing.** There is no field for an external TURN server — configure one directly in Talk's admin settings instead, and leave the toggle off.
11. **No riscv64 build.** x86_64 and aarch64 only.

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
  - coturn-secret-read # temporary; reads Coturn's shared secret
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
  - coturn # optional, running, no health checks; only while Talk call relaying is on
  - collabora-online # optional, running, health check `cool`; only while selected as the office suite
  - onlyoffice-docs # optional, running, health check `documentserver`; only while selected as the office suite; Community Registry
interfaces:
  ui: { type: ui, port: 80 }
  webdav: { type: api, port: 80 } # same binding, path /remote.php/dav/
actions:
  - set-config
  - external-storage # only-running
  - set-office-suite
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
  - office-connectors # only while an office suite is selected
  - recognize-models # only while that task is pending
  - memories-indexing # only while that task is pending
  - memories-map-setup # only while that task is pending
  - scan-files # only while that task is pending
  - repair # only while that task is pending
```
