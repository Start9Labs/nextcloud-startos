ARG NEXTCLOUD_VERSION=34.0.2
FROM nextcloud:${NEXTCLOUD_VERSION}-apache

RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg \
 && rm -rf /var/lib/apt/lists/*
