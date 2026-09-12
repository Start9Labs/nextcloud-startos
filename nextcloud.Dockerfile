ARG NEXTCLOUD_VERSION=34.0.4
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

# Issue the DAV discovery redirects with the scheme the client actually used.
# The stock .htaccess rules absolutize from Apache's own scheme — always http
# behind the TLS-terminating StartOS proxy — sending CalDAV/CardDAV clients to
# an http:// URL that nothing answers on an https-only port. The proxy strips
# and re-sets X-Forwarded-Proto on TLS bindings, so it is trustworthy here;
# without it (a plain-http binding) these rules skip and the stock ones apply.
# InheritDownBefore is what runs them ahead of the volume's .htaccess, and a
# conf, not an .htaccess patch, is what reaches installs whose volume already
# holds this Nextcloud version. mod_headers can't do it: a redirect's Location
# lives in the one header table `Header edit` never sees on a 3xx.
# See https://github.com/Start9Labs/nextcloud-startos/issues/137
RUN printf '%s\n' \
      '<Directory /var/www/html>' \
      '    RewriteEngine On' \
      '    RewriteOptions InheritDownBefore' \
      '    RewriteCond %{HTTP:X-Forwarded-Proto} =https' \
      '    RewriteRule ^\.well-known/carddav$ https://%{HTTP_HOST}/remote.php/dav/ [R=301,L]' \
      '    RewriteCond %{HTTP:X-Forwarded-Proto} =https' \
      '    RewriteRule ^\.well-known/caldav$ https://%{HTTP_HOST}/remote.php/dav/ [R=301,L]' \
      '    RewriteCond %{HTTP_USER_AGENT} DavClnt' \
      '    RewriteCond %{HTTP:X-Forwarded-Proto} =https' \
      '    RewriteRule ^$ https://%{HTTP_HOST}/remote.php/webdav/ [R=302,L]' \
      '</Directory>' \
      > /etc/apache2/conf-available/startos-dav-redirects.conf \
 && a2enconf startos-dav-redirects

# For the office-suite proxy the package writes into conf-enabled at daemon start.
RUN a2enmod proxy proxy_http proxy_wstunnel substitute
