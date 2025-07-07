FROM nextcloud:30.0.11-fpm

# arm64 or amd64
ARG PLATFORM

# Install base dependencies
RUN apt update && apt install -y --no-install-recommends \
  aria2 \
  cron \
  ffmpeg \
  jq \
  nginx \
  postgresql \
  sudo && \
  curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
  && chmod a+rx /usr/local/bin/yt-dlp && \
  apt clean && rm -rf /var/lib/apt/lists/*

# Create and own Postgres/PHP run dirs
RUN mkdir -p /run/postgresql
RUN mkdir -p /run/php
RUN chown postgres:postgres /run/postgresql
RUN chown www-data:www-data /run/php

# Setup Cron
RUN echo "*/5 * * * * www-data /usr/local/bin/php -f /var/www/html/cron.php" > /etc/cron.d/my-cron \
  && chmod 0644 /etc/cron.d/my-cron \
  && touch /var/log/cron.log

# Import Entrypoint and Actions scripts and give permissions
ADD assets/scripts/migration-completion.sh /docker-entrypoint-hooks.d/post-upgrade/migration-completion.sh
RUN chmod a+x /docker-entrypoint-hooks.d/post-upgrade/*.sh
