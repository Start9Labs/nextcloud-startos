ARG NEXTCLOUD_VERSION=34.0.3
FROM nextcloud:${NEXTCLOUD_VERSION}-apache

RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg \
 && rm -rf /var/lib/apt/lists/*

# Hold idle HTTP connections open longer than every hop in front of Apache.
# The StartOS reverse proxy pins each client connection to this one backend
# connection (no re-dial) and keeps idle client connections up to 60s, and
# sync clients poll every 30s. Debian's stock timeouts (KeepAliveTimeout 5,
# mod_reqtimeout header=20-40) closed the backend leg first, surfacing
# client-side as periodic "Network error" flaps and ` -" 408` log noise.
# See https://github.com/Start9Labs/start-technologies/issues/3731
RUN printf 'KeepAliveTimeout 75\nRequestReadTimeout header=90\n' \
      > /etc/apache2/conf-available/startos-proxy-keepalive.conf \
 && a2enconf startos-proxy-keepalive
