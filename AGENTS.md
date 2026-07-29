# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

Work this package's `TODO.md` from top to bottom. Keep `README.md` (architecture, for developers and LLMs) and `instructions.md` (end-user docs) in sync with your changes.

## This repo

- **Package id is `nextcloud`.** Enforced config lives in `config.php` (a `FileHelper` model in `startos/fileModels/`); admin operations run through `occ` as `www-data` — `subc.exec(['php', 'occ', ...], { user: 'www-data' })`.
- **External Storage surfaces a dependency's volume via `idmap`.** The optional File Browser mount maps its on-disk uid `1000` (its `user`) → `www-data` (`33`) so Nextcloud *owns* the tree — no permission machinery. See `startos/main.ts` and the README's Dependencies section. Requires StartOS 0.4.0-beta.10+ (where `idmap` on dependency mounts is functional).

## Inspecting a running install

To run a command inside the service's container (read its generated config, grep app logs), use `start-cli package attach nextcloud -n <subcontainer-name> -- <cmd>`. This package has several subcontainers (`nextcloud-sub`, `nextcloud-cron`, `postgres-sub`, `valkey`), so a selector is **required** — select by **name** with `-n` (the name passed to `SubContainer.of`, e.g. `-n nextcloud-sub`) or by image with `-i`. Note the two nextcloud subcontainers share one image, so `-i nextcloud` is still ambiguous. Note: `-s/--subcontainer` matches the internal **Guid**, not the name.
