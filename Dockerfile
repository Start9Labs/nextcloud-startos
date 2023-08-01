FROM nextcloud:27.0.1-fpm-alpine

# arm64 or amd64
ARG PLATFORM

# Install additional dependencies
RUN apk add --no-cache \
    su-exec \
    bash \
    busybox \
    htop \
    postgresql15 \
    postgresql15-client \
    nginx \
    yq \
    vim \
    # exiftool \
    # ffmpeg \
    # imagemagick \
    # supervisor \
    # libreoffice \
;

# # Set environment variables
ENV POSTGRES_DB nextcloud
ENV POSTGRES_USER nextcloud
ENV POSTGRES_PASSWORD nextclouddbpassword
ENV POSTGRES_HOST localhost
ENV EXISTING_DB false

ENV PHP_MEMORY_LIMIT 512M
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
ADD actions/reset-pass.sh /usr/local/bin/reset-pass.sh
ADD actions/disable-maintenance-mode.sh /usr/local/bin/disable-maintenance-mode.sh
ADD actions/index-memories.sh /usr/local/bin/index-memories.sh
ADD actions/places-setup.sh /usr/local/bin/places-setup.sh
ADD actions/download-models.sh /usr/local/bin/download-models.sh
RUN chmod a+x /usr/local/bin/*.sh
