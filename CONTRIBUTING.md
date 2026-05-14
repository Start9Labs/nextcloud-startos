# Contributing

This repo packages [Nextcloud](https://nextcloud.com/) for StartOS.

## Documentation — keep it in sync

- **`README.md`** — what this package is and how it's built (image, volumes, interfaces). For developers and AI assistants.
- **`instructions.md`** — the user-facing instructions packed into the `.s9pk` and shown on the **Instructions** tab in StartOS, for the person running the service.
- **`CONTRIBUTING.md`** — this file.
- **`CLAUDE.md`** — operating rules for AI developers working in this repo.

**Any code change that warrants it must update `README.md` and `instructions.md` in the same change** — a new or renamed action, an added or removed volume / port / interface / dependency, a changed default, a new limitation, any altered user-visible behavior. Don't defer: a package that ships with a stale README or stale instructions is not done, even if the code is perfect. Content rules live in the packaging guide: [Writing READMEs](https://docs.start9.com/packaging/writing-readmes.html) and [Writing Service Instructions](https://docs.start9.com/packaging/writing-instructions.html).

## Building

See the [StartOS Packaging Guide](https://docs.start9.com/packaging/) for environment setup, then:

```bash
npm ci    # install dependencies
make      # build the universal .s9pk
```

## Updating the upstream version

The Nextcloud image is built locally from `nextcloud.Dockerfile`, which extends the upstream `nextcloud:<version>-apache` image to add `ffmpeg` for video thumbnails. The Postgres and Valkey sidecars are pinned to `postgres:17-alpine` and `valkey/valkey:9-alpine` in the manifest.

> The upstream repo is [nextcloud/docker](https://github.com/nextcloud/docker) (the Docker image), not nextcloud/server.

To track a new upstream Nextcloud release:

1. Bump the `NEXTCLOUD_VERSION` `ARG` default in `nextcloud.Dockerfile` to the new version.
2. Update `version` and `releaseNotes` in the file under `startos/versions/`, renaming it to the new version string. A *new* version file is only needed when the bump carries an `up`/`down` migration, or when you want the old release notes preserved in git history — see [Versions](https://docs.start9.com/packaging/versions.html).
3. Rebuild (`make`), sideload the `.s9pk`, and confirm it starts.
4. Review `README.md` and `instructions.md` for anything the bump changed.

To bump the Postgres or Valkey sidecars, change the corresponding `dockerTag` in `startos/manifest/index.ts` (and write a migration if the major Postgres version changes).

## How to contribute

1. Fork the repository and create a branch from `master`.
2. Make your changes — including the doc updates above.
3. Open a pull request to `master`.
