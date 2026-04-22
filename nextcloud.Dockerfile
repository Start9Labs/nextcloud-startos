ARG NEXTCLOUD_VERSION=32.0.8
FROM nextcloud:${NEXTCLOUD_VERSION}-apache

RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg \
 && rm -rf /var/lib/apt/lists/*
