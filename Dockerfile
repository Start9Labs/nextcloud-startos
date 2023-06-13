FROM nextcloud:26.0.2-fpm-alpine

# arm64 or amd64
ARG PLATFORM

# Install additional dependencies
RUN apk add --no-cache \
    sudo \
    bash \
    # postgresql13 \
    # postgresql13-client \
    exiftool \
    # ffmpeg \
    yq \
    # imagemagick \
    supervisor \
    libreoffice \
;

ENV POSTGRES_DB nextcloud
ENV POSTGRES_USER nextcloud
ENV POSTGRES_PASSWORD nextclouddbpassword
ENV POSTGRES_HOST localhost
ENV EXISTING_DB false
ENV APACHE_DISABLE_REWRITE_IP 1
ENV PHP_MEMORY_LIMIT 4096M
ENV PHP_UPLOAD_LIMIT 20480M

# VOLUME /var/lib/postgresql/13
VOLUME /etc/postgresql/13

# Import Entrypoint and Actions scripts and give permissions
ADD ./docker_entrypoint.sh /usr/local/bin/docker_entrypoint.sh
ADD ./check-web.sh /usr/local/bin/check-web.sh
ADD actions/reset-pass.sh /usr/local/bin/reset-pass.sh
ADD actions/disable-maintenance-mode.sh /usr/local/bin/disable-maintenance-mode.sh
ADD actions/index-memories.sh /usr/local/bin/index-memories.sh
ADD actions/places-setup.sh /usr/local/bin/places-setup.sh
ADD actions/download-models.sh /usr/local/bin/download-models.sh
RUN chmod a+x /usr/local/bin/*.sh
