FROM nextcloud:27.0.2-fpm-alpine

# arm64 or amd64
ARG PLATFORM

# Install base dependencies
RUN apk add --no-cache \
    bash \
    busybox \
    ffmpeg \
    htop \
    nginx \
    postgresql15 \
    postgresql15-client \
    su-exec \
    sudo \
    vim \
    yq \
    # libreoffice \ install as an action?
;

# Install additional app dependencies
# RUN apk add -X http://dl-cdn.alpinelinux.org/alpine/edge/testing dlib

# RUN wget https://github.com/goodspb/pdlib/archive/master.zip \
#   && mkdir -p /usr/src/php/ext/ \
#   && unzip -d /usr/src/php/ext/ master.zip \
#   && rm master.zip
# RUN docker-php-ext-install pdlib-master

# RUN apk add --no-cache bzip2-dev
# RUN docker-php-ext-install bz2

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
ADD actions/reset-pass.sh /usr/local/bin/reset-pass.sh
ADD actions/disable-maintenance-mode.sh /usr/local/bin/disable-maintenance-mode.sh
ADD actions/index-memories.sh /usr/local/bin/index-memories.sh
ADD actions/places-setup.sh /usr/local/bin/places-setup.sh
ADD actions/download-models.sh /usr/local/bin/download-models.sh
ADD nextcloud-init.sh /usr/local/bin/nextcloud-init.sh
ADD nextcloud-run.sh /usr/local/bin/nextcloud-run.sh
RUN chmod a+x /usr/local/bin/*.sh
