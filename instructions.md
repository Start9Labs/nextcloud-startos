# Nextcloud

Nextcloud auto-generates an admin password on first install and posts a critical task to show it to you. Save the password before dismissing — it is shown once.

## Documentation

- [Nextcloud admin manual](https://docs.nextcloud.com/server/latest/admin_manual/) — upstream guide to administering your server.
- [Nextcloud user manual](https://docs.nextcloud.com/server/latest/user_manual/en/) — upstream guide for end users (files, sharing, calendar, mail, etc.).

## What you get on StartOS

- A **Web UI** for Nextcloud — files, calendar, contacts, photos, talk, and the full Nextcloud app ecosystem.
- A **WebDAV** endpoint at `/remote.php/dav/` for desktop and mobile sync clients.
- A bundled PostgreSQL database and Valkey cache; you do not configure either.
- Trusted domains, caching, file locking, and proxy headers are pre-configured and kept in sync with your StartOS hostnames on every start.

## Getting set up

1. After install, Nextcloud posts a critical task **Get Admin Credentials**. Run it and copy the `admin` username and password to a password manager — the password is shown only once.
2. Start the service and open the **Web UI**.
3. Log in with `admin` and the password from step 1.
4. From the admin user menu, create your day-to-day user accounts and tune Nextcloud's settings (email, sharing, apps, etc.) through the Nextcloud admin pages.

## Using Nextcloud

### Web UI

Open the **Web UI** interface to reach Nextcloud's web interface. From there you install apps from the Nextcloud App Store, manage users and groups, and use Files, Calendar, Contacts, Photos, Talk, and anything else you install.

### WebDAV

Point a Nextcloud desktop or mobile client (or any WebDAV client) at the **WebDAV** interface address to sync files. Use the username and password of the Nextcloud account you want to sync, not the admin account if it's a personal device.

### Actions

- **Configure** — set the default locale, default phone region, the UTC start hour of Nextcloud's nightly maintenance window for background jobs, and a toggle to stop seeding new user accounts with Nextcloud's default skeleton files (sample documents, photos, README).
- **External Storage** — surface another StartOS service's storage as a folder in your Nextcloud **Files**, using Nextcloud's built-in External Storage app. The action lists a dropdown for each supported service **you have installed** (today just **File Browser** → a `/FileBrowser` folder). Each dropdown is **Not mounted** (off), **Available to all users**, or **Available to specific users** (which then lets you pick exactly which Nextcloud users see it). The folder is read-write, so you can **move files out of it into Nextcloud**. Nextcloud must be **running** to run this action (it reads your live user list). Files other services add to File Browser appear automatically when you open the folder — so File Browser acts as the shared hub: point any service that should be visible in Nextcloud at File Browser.
- **Reset Admin Password** — pick an admin user and generate a new random password. Use this if the admin password is lost or you want to rotate it.
- **Disable Maintenance Mode** (Maintenance group) — runs `occ maintenance:mode --off`. Brief maintenance mode after an update or restart is normal — wait at least 15 minutes before resorting to this. An update interrupted partway (for example by a restart) now finishes automatically the next time the service starts, so you should rarely need this.
- **Disable Non-default Apps** (Maintenance group) — disables every non-default Nextcloud app. Use this if a third-party app has broken the UI with an Internal Server Error. Stable apps must then be re-enabled individually from the Nextcloud Apps page.
- **Scan Files** (Maintenance group) — queues a background rebuild of the file cache after files are synced into Nextcloud externally (rclone, rsync, SFTP, etc.). Run this if externally synced files appear stale, show wrong sizes, or are missing from search. On a large library the scan can take many minutes; progress shows as the **File Scan** health check on the service status page, and StartOS posts a notification when it finishes.
- **Repair** (Maintenance group) — queues a background run of Nextcloud's built-in repair routine, fixing database inconsistencies, stale cache entries, and broken shares. Run this if files appear missing, shares return errors, or after a crash or abrupt shutdown. Progress shows as the **Repair** health check on the service status page, and StartOS posts a notification when it finishes.
- **Download Machine Learning Models for Recognize** (App Commands group) — queues a background download of the ML models the Recognize app needs for object and face detection (~1-2 GB). Install the Recognize app from the Nextcloud App Store first. Progress shows on the service status page while the download is in flight, and StartOS posts a notification when it finishes.
- **Index Media for Memories** (App Commands group) — queues a background re-index of media for the Memories app. Memories normally re-indexes itself every five minutes; only run this to force an immediate re-index (it asks you to confirm first, since it restarts the service). Install the Memories app and select a media path first. StartOS posts a notification when the re-index finishes.
- **Setup Map for Memories** (App Commands group) — queues a background download of map data (~2-3 GB) and a re-index so the Memories app can reverse-geotag your photos. Install the Memories app first. Avoid running this alongside other heavy work on a low-resource device. StartOS posts a notification when it finishes.

## Limitations

- **No arbitrary host directory mounts.** You can surface another StartOS service's files with the **External Storage** action (currently File Browser), and you can attach remote storage (S3, WebDAV, SMB, etc.) through Nextcloud's built-in External Storage app. StartOS does not expose arbitrary host directories to the container.
- **No built-in SMTP.** Configure email under Nextcloud's **Administration settings → Basic settings → Email server**.
- **PHP memory limit is 1024 MB and the per-file upload limit is 20 GB.** These are not user-configurable.
