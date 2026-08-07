# TODO

## Clear the abandoned `nextcloud:create-admin-user` task replay key

Fold this into the next version that ships — it does not warrant a release of its own.

A task's replay key defaults to `[package-id]:[action-id]`. The admin-credentials action was
renamed `create-admin-user` → `get-admin-credentials` (`479c4e1`, 2026-03-26) while
`init/bootstrapNextcloud.ts` was raising a `critical` task against it, so that release wrote
`nextcloud:get-admin-credentials` and abandoned `nextcloud:create-admin-user`. Nothing
rewrites or reaps an abandoned key.

**This one fails worse than a duplicate task.** The old action id no longer exists, so
`recheck_tasks` cannot resolve its input, and the task's `active` flag is frozen at whatever
it last held. The task also has no `when` clause, so it is only ever removed by _running_
the action — which is impossible for an id that no longer exists. A frozen `active: true` +
`critical` task stops the package, and no user action can clear it; recovery needs
`start-cli package action clear-task nextcloud 'nextcloud:create-admin-user' --force` over
SSH. Servers where the admin password was set before updating are unaffected: running the
action removed the key outright.

In the next version's migration:

```ts
migrations: {
  up: async ({ effects }) => {
    await sdk.action.clearTask(effects, 'nextcloud:create-admin-user')
  },
},
```

Needs `import { sdk } from '../sdk'` in the version file.

Whether any server is actually carrying this key is **unresolved and not worth resolving**.
The id was on master from 2025-12-08 to 2026-03-26; exactly one tag falls in that window
(`v31.0.13_0`, which has no published release), and every retention-based signal for that
era — GitHub releases, workflow runs, S3 objects — has since been swept. datum-gateway
proves a build can reach users with none of the three surviving, so absence is not evidence.
Since `clearTask` is a free no-op when the key is absent, clear it rather than trying to
prove the negative.

Background: the packaging guide, `tasks.md` → "Retiring a replay key".
