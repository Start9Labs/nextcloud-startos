FROM nextcloud:25.0.5-apache

# arm64 or amd64
ARG PLATFORM
# aarch64 or x86_64
ARG ARCH
ENV YQ_VER v4.3.2

RUN apt-get update && apt-get install -y postgresql-13 sudo bash exiftool ffmpeg \
&& apt-get install -qq --no-install-recommends ca-certificates dirmngr
RUN curl -L https://github.com/mikefarah/yq/releases/download/${YQ_VER}/yq_linux_${PLATFORM} -o /usr/local/bin/yq \
    && chmod a+x /usr/local/bin/yq
RUN apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false; \
    rm -rf \
    /tmp/* \
    /var/lib/apt/lists/* \
    /var/tmp/*

ENV POSTGRES_DB nextcloud
ENV POSTGRES_USER nextcloud
ENV POSTGRES_PASSWORD nextclouddbpassword
ENV POSTGRES_HOST localhost
ENV EXISTING_DB false
ENV APACHE_DISABLE_REWRITE_IP 1
ENV PHP_MEMORY_LIMIT 4096M
ENV PHP_UPLOAD_LIMIT 10240M

VOLUME /var/lib/postgresql/13
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
