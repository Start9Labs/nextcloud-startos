# Updating the upstream version

This package has three image sources: the Nextcloud image (built locally from the official `nextcloud:<version>-apache` image, with `ffmpeg` layered on), plus Postgres and Valkey sidecars pulled directly from Docker Hub.

> The upstream for the Nextcloud image is [nextcloud/docker](https://github.com/nextcloud/docker), which publishes to `library/nextcloud` on Docker Hub. It is **not** [nextcloud/server](https://github.com/nextcloud/server) — that's the server source code, and the Docker image is released on its own cadence (not every server release ships an image immediately). Treat the Docker Hub tag as the source of truth for what's bumpable.

## Determining the upstream version

**Nextcloud** ([library/nextcloud](https://hub.docker.com/_/nextcloud) on Docker Hub):

```bash
curl -fsSL "https://hub.docker.com/v2/repositories/library/nextcloud/tags?page_size=50&ordering=last_updated" \
  | jq -r '.results[].name' | grep -E '^[0-9]+\.[0-9]+\.[0-9]+-apache$' | head
```

Current pin: the `NEXTCLOUD_VERSION` `ARG` default in `nextcloud.Dockerfile`.

**Postgres** ([library/postgres](https://hub.docker.com/_/postgres) on Docker Hub):

```bash
curl -fsSL "https://hub.docker.com/v2/repositories/library/postgres/tags?page_size=30&ordering=last_updated" \
  | jq -r '.results[].name' | grep -E '^17.*alpine' | head
```

Current pin: `postgres:17-alpine` in `startos/manifest/index.ts` (`images.postgres.source.dockerTag`). Changing the major also means changing `PG_MAJOR` in `startos/versions/from035x.ts`, which the 0.3.5x migration compares against the cluster's `PG_VERSION`.

**Valkey** ([valkey/valkey](https://hub.docker.com/r/valkey/valkey) on Docker Hub):

```bash
curl -fsSL "https://hub.docker.com/v2/repositories/valkey/valkey/tags?page_size=30&ordering=last_updated" \
  | jq -r '.results[].name' | grep -E '^9.*alpine' | head
```

Current pin: `valkey/valkey:9-alpine` in `startos/manifest/index.ts` (`images.valkey.source.dockerTag`).

## Applying the bump

**Nextcloud** — bump the `NEXTCLOUD_VERSION` `ARG` default in `nextcloud.Dockerfile` to the new patch version (e.g. `32.0.9` → `32.0.10`). The `-apache` suffix is appended by the `FROM` line; don't include it in the ARG value.

A **major** bump (e.g. `33.0.8` → `34.0.3`) needs four more checks:

- Diff `core/shipped.json` between the two tags and add whatever the new major appends to `defaultEnabled` and `alwaysEnabled` to the `defaultApps` list in `startos/actions/maintenance/disableUnstableApps.ts`. `occ app:disable` exits non-zero on an `alwaysEnabled` app, and the action runs under `execFail`, so one missing id breaks the recovery action a locked-out user is told to run.
- Check `$OC_VersionCanBeUpgradedFrom` in the new tag's `version.php`. Nextcloud upgrades one major at a time, so every version the registry still lists must be within one major of the new image — `startos/init/bootstrapNextcloud.ts` refuses the rest and StartOS rolls the update back.
- Diff `config/config.sample.php` between the two tags against the keys `startos/fileModels/config.php.ts` models, and against the defaults the README and `instructions.md` quote.
- Re-check the new major's system requirements page for the supported PostgreSQL and PHP versions.

**Postgres** — change the `dockerTag` value in `images.postgres.source` in `startos/manifest/index.ts`. The pin tracks the `17` major; bumping across major versions (e.g. `17` → `18`) requires a data migration in `startos/versions/`.

**Valkey** — change the `dockerTag` value in `images.valkey.source` in `startos/manifest/index.ts`. The pin tracks the `9` major.
