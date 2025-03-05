FROM nextcloud:28.0.14-fpm-alpine

# arm64 or amd64
ARG PLATFORM

# Install base dependencies
RUN apk add --no-cache \
    bash \
    busybox \
    ffmpeg \
    fuse \
    htop \
    jq \
    nginx \
    postgresql15 \
    postgresql15-client \
    su-exec \
    sudo \
    vim \
    yq \
;

# # Set environment variables
ENV POSTGRES_DB nextcloud
ENV POSTGRES_USER nextcloud
ENV POSTGRES_PASSWORD nextclouddbpassword
ENV POSTGRES_HOST localhost
ENV EXISTING_DB false

ENV PHP_MEMORY_LIMIT 1024M
ENV PHP_UPLOAD_LIMIT 20480M

# Create and own Postgres/PHP run dirs
RUN mkdir -p /run/postgresql
RUN mkdir -p /run/php
RUN chown postgres:postgres /run/postgresql
RUN chown www-data:www-data /run/php

# Setup Cron
RUN mkdir -p /var/spool/cron/crontabs
RUN echo '*/5 * * * * php -f /var/www/html/cron.php' > /var/spool/cron/crontabs/www-data

# Import Entrypoint and Actions scripts and give permissions
ADD ./docker_entrypoint.sh /usr/local/bin/docker_entrypoint.sh
ADD ./nginx.conf /etc/nginx/http.d/default.conf
ADD ./check-web.sh /usr/local/bin/check-web.sh
ADD actions/*.sh /usr/local/bin/
ADD nextcloud-init.sh /usr/local/bin/nextcloud-init.sh
ADD nextcloud-run.sh /usr/local/bin/nextcloud-run.sh
ADD nextcloud.env /usr/local/bin/nextcloud.env
ADD migration-completion.sh /docker-entrypoint-hooks.d/post-upgrade/migration-completion.sh
RUN chmod a+x /usr/local/bin/*.sh
RUN chmod a+x /docker-entrypoint-hooks.d/post-upgrade/*.sh
