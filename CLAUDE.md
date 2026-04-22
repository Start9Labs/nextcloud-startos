## How the upstream version is pulled
- `NEXTCLOUD_VERSION` ARG in `nextcloud.Dockerfile` (default used when building). The image is `dockerBuild` in `startos/manifest/index.ts` (extends `nextcloud:<version>-apache` to add ffmpeg for video thumbnails).

> Upstream repo is nextcloud/docker (Docker image), not nextcloud/server.
