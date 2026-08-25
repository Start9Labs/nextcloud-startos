# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

**Start every task at the recipe index** — `../start-technologies/projects/start-sdk/docs/src/recipes.md`
(or <https://docs.start9.com/packaging/recipes.html>). It maps an intent ("prompt the user to create
admin credentials", "expose a web UI") to the constructs, the reference pages, and a named production
package to copy. Find the recipe before you read this package's neighbours: a package you reach by
grepping may be non-conformant, and the recipe outranks it.

Freshly scaffolded? Work the
[New Package Checklist](../start-technologies/projects/start-sdk/docs/src/new-package-checklist.md)
(or <https://docs.start9.com/packaging/new-package-checklist.html>) from top to bottom. It is a
guide page, not a file in this repo — read it, don't copy it in.

Keep `README.md` (technical reference for an AI support or administering agent) and
`instructions.md` (end-user docs) in sync with your changes.

**Bugs and feature requests are GitHub issues on this repo** — file them as you find them.
Don't record work in the repo instead: no `TODO.md`, no `NOTES.md`, no `PLAN.md`. What you
verified, tried, and decided belongs in the commit message and the PR body.

## This repo

- **`finish-upgrade` must stay behind the web daemon and must fail open.** A rejected oneshot fn never reaches `EXIT_SUCCESS`, which both blocks `long-running-tasks` (gated on it) and makes the SDK re-invoke it on a backoff — `occ upgrade` in a loop. Every step inside is individually guarded for that reason.
- **The upstream version upgrade belongs in init, not at daemon start.** Init is snapshotted, so a failed migration rolls the update back; at daemon start an interrupted one strands the instance on "Update needed — use the command line updater" permanently, because the entrypoint only compares deployed code to image code and never re-checks what the DB acknowledged.
- **Renaming an action abandons its task's replay key, and nothing reaps it.** The key defaults to `[package-id]:[action-id]`, so the `create-admin-user` → `get-admin-credentials` rename stranded `nextcloud:create-admin-user` — and because the old action id no longer resolves, `recheck_tasks` cannot read its input and the task's `active` flag freezes wherever it last sat. A task with no `when` clause is only removed by _running_ it, which an unresolvable id makes impossible. Rename an action with a live task and you owe a `sdk.action.clearTask(effects, '<old key>')` in the same release.
- **Long-running `occ` work must be queued, never run inline in an action handler** — it would block past the action timeout. Adding one means matching entries in `OCC_ARGS`, `TASK_NOTICE`, and a conditional health check, all keyed off `ACTION_IDS`.
- **`startos/fileModels/php-parser.js` is generated — edit `php.pegjs` and run `npm run regen-parser`.** Nothing in the build reads the grammar, so a grammar edit that skips the regeneration passes `check` and `build` and ships the old parser.
- **`config.php` keeps keys the shape does not model.** The SDK patches `z.object` to be loose, so validation keeps unknown keys and the serializer writes them back — a key a user or a Nextcloud app adds survives. Model a key when the package needs to read or default it, not to preserve it. Do not make the validator strict: `instanceid`, `passwordsalt` and `secret` are unmodelled. Dropping `secret` or `passwordsalt` takes Nextcloud offline with a 503 `config variable is not configured in the config.php file` page, and dropping `instanceid` makes Nextcloud mint a new one, orphaning `appdata_<instanceid>`.
- **A value the `config.php` grammar cannot model is carried through as source text — never narrow `Raw` into a hard failure.** `occ` runs inside the service container, so a value that stops the read is a brick with no way to reach the command that would remove it. Malformed input must still fail loudly, which is what bounds `Raw` to a single line: `var_export` never spreads a scalar expression over two, so a run that reaches a newline is a broken file rather than an unmodelled value. A carried-through value is `{ __raw: <source> }`, so a PHP array whose only key is `__raw` and whose value is a string is indistinguishable from one.
- **Comments have to parse.** Nextcloud 34 prepends a banner comment between `<?php` and `$CONFIG` on every config write.
- **A `config.php` number the double cannot print back exactly is carried through as source text too**, so `9223372036854775807`, `1.0` and `1.0E+30` survive a write. Ordinary values stay real numbers, which is what keeps `maintenance_window_start` and `redis.port` reaching their validators — do not widen this into writing every integer as a float.
- **The File Browser mount's `idmap` (uid 1000 → `www-data` 33) is what makes the integration work at all**, and it needs StartOS 0.4.0-beta.10+. Files other services drop into File Browser's volume under a different uid surface as `nobody` until those services idmap their own mount to 1000 too.
- **Adding an external-storage source is a registry edit in `startos/externalStorage.ts` plus a typed mount.** File Browser is the shared hub most services route through, so a direct source is worth adding only for a service whose files live browsably on its own volume.
