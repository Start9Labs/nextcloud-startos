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
- **`config.php` only preserves modelled keys.** The PEG parser reads what the grammar covers and the serializer writes back only the shape — an unmodelled key a user or a Nextcloud app adds is dropped on the next write. Extend the shape before assuming a key survives.
- **The File Browser mount's `idmap` (uid 1000 → `www-data` 33) is what makes the integration work at all**, and it needs StartOS 0.4.0-beta.10+. Files other services drop into File Browser's volume under a different uid surface as `nobody` until those services idmap their own mount to 1000 too.
- **Adding an external-storage source is a registry edit in `startos/externalStorage.ts` plus a typed mount.** File Browser is the shared hub most services route through, so a direct source is worth adding only for a service whose files live browsably on its own volume.
