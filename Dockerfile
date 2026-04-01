FROM nextcloud:31.0.13-fpm

# arm64 or amd64
ARG PLATFORM

# Add PGDG repo for PostgreSQL 15 (needed for pg_upgrade from PG 15 to 17)
RUN apt update && apt install -y --no-install-recommends curl ca-certificates gnupg && \
  curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /usr/share/keyrings/pgdg.gpg && \
  echo "deb [signed-by=/usr/share/keyrings/pgdg.gpg] http://apt.postgresql.org/pub/repos/apt trixie-pgdg main" > /etc/apt/sources.list.d/pgdg.list

# Install base dependencies
RUN apt update && apt install -y --no-install-recommends \
  aria2 \
  cron \
  ffmpeg \
  jq \
  nginx \
  postgresql-17 postgresql-15 \
  sudo && \
  curl -sSL "https://github.com/mikefarah/yq/releases/latest/download/yq_linux_${PLATFORM}" -o /usr/local/bin/yq && \
  chmod +x /usr/local/bin/yq && \
  curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
  && chmod a+rx /usr/local/bin/yt-dlp && \
  apt clean && rm -rf /var/lib/apt/lists/*

# # Set environment variables
ENV POSTGRES_DB=nextcloud
ENV POSTGRES_USER=nextcloud
ENV POSTGRES_PASSWORD=nextclouddbpassword
ENV POSTGRES_HOST=localhost
ENV EXISTING_DB=false

ENV PHP_MEMORY_LIMIT=1024M
ENV PHP_UPLOAD_LIMIT=20480M

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
ADD ./docker_entrypoint.sh /usr/local/bin/docker_entrypoint.sh
ADD ./nginx.conf /etc/nginx/conf.d/default.conf
ADD ./check-web.sh /usr/local/bin/check-web.sh
ADD actions/*.sh /usr/local/bin/
ADD nextcloud-init.sh /usr/local/bin/nextcloud-init.sh
ADD nextcloud-run.sh /usr/local/bin/nextcloud-run.sh
ADD nextcloud.env /usr/local/bin/nextcloud.env
ADD migration-completion.sh /docker-entrypoint-hooks.d/post-upgrade/migration-completion.sh
RUN chmod a+x /usr/local/bin/*.sh
RUN chmod a+x /docker-entrypoint-hooks.d/post-upgrade/*.sh
