export const DEFAULT_LANG = 'en_US'

const dict = {
  // main.ts
  'Starting Nextcloud...': 0,
  'Web Interface': 1,
  'The web interface is ready': 2,
  'The web interface is not ready': 3,

  // interfaces.ts
  'Web UI': 4,
  'The web interface of Nextcloud': 5,
  WebDAV: 6,
  'Addresses for WebDAV syncing': 7,

  // bootstrapNextcloud.ts
  'Display your admin password so you can administer your Nextcloud instance': 8,

  // setConfig.ts
  Configure: 10,
  'Basic configuration options for your Nextcloud instance': 11,
  'Default locale': 12,
  'This sets the locale on your Nextcloud server. It overrides automatic locale detection on public pages like login or shared items. User\'s locale preferences configured under "personal -> locale" override this setting after they have logged in.': 13,
  'Default Phone Region': 14,
  'This sets the default phone region on your Nextcloud server for formatting and validating phone numbers.': 15,
  'Maintenance Window Start Time': 16,
  'UTC start time for non-time sensitive background jobs. Setting this to a low-usage time frees up resources during the rest of the day by only running these non-time sensitive jobs in the 4 hours following the specified start time. Set to 24 (default) if there is no preference for when these jobs are run, but beware that resource intensive jobs may then run unnecessarily during high usage periods. This may lead to slower performance and a lower quality user experience.': 17,
  'Disable Skeleton Files for New Accounts': 45,
  "When enabled, new user accounts are not seeded with Nextcloud's default skeleton files (sample documents, photos, README, etc.). Existing accounts are unaffected.": 46,
  'Relay Talk Calls Through Coturn': 135,
  'Relay Talk calls through the Coturn service so they connect when both parties are behind NAT or a restrictive firewall. Requires the Talk app to be installed in Nextcloud, and Coturn to be installed and running with a public domain of its own; until both are, calls fall back to a direct connection.': 136,

  // resetAdmin.ts
  'Reset Admin Password': 18,
  'Generate a new password for an admin user': 19,
  'Admin User': 20,
  'Your admin user password has been reset': 21,

  // shared
  Success: 22,
  Username: 23,
  Password: 24,

  // disableMaintenanceMode.ts
  'Disable Maintenance Mode': 25,
  'Maintenance Mode has been disabled. You may need to wait 1-2 minutes and refresh the browser': 27,

  // disableUnstableApps.ts
  'Disable Non-default Apps': 28,
  'Use this if unstable apps were installed resulting in the UI becoming inaccessible with an Internal Server Error: "The server was unable to complete your request".': 29,
  'The following apps have been disabled:': 31,

  // getAdminCredentials.ts
  'Get Admin Credentials': 32,
  'Your admin username and password are below. Write them down or save them to a password manager.': 33,

  // downloadModels.ts
  'Download Machine Learning Models for Recognize': 34,
  // Legacy keys 35-37 (synchronous wording) replaced by 47-57 (async wording).
  'Already in Progress': 49,
  Queued: 51,
  // main.ts: recognize-models health check
  'Recognize Model Download': 53,
  'Downloading machine learning models...': 55,

  // indexMemories.ts (legacy 38-40 retained for translations of prior versions)
  'Index Media for Memories': 38,

  // indexPlaces.ts (legacy 41-44 retained)
  'Setup Map for Memories': 41,

  // main.ts: shared health check messages
  'Memories Indexing': 58,
  'Indexing photos for the Memories app...': 59,
  'Memories Map Setup': 60,
  'Setting up map data for the Memories app...': 61,

  // missing-prerequisite errors (thrown at run time when the required app
  // isn't installed; previously also used as disabled-reason text)
  'Install the Recognize app in Nextcloud first.': 70,
  'Install the Memories app in Nextcloud first.': 71,

  // downloadModels.ts (revised wording)
  'The download can take up to 15 minutes and will consume approximately 1-2 GB of disk space.': 73,

  // App-command actions: tightened wording. Long-running actions share
  // generic "Already in Progress" / "In Progress" messages — the modal
  // appears right after invocation, the user knows which task they
  // triggered, and the new health check identifies it.
  'Triggers a background download of the machine learning models required for identifying objects and faces with the Recognize app. You must install the Recognize app in Nextcloud before running this action.': 74,
  'Action is already in progress.': 75,
  'In Progress': 76,
  'Service has been automatically restarted and a new health check created to monitor progress.': 77,
  'Triggers a background re-index of media for the Memories app. Indexing normally runs every 5 minutes via Nextcloud background jobs; use this only to force a re-index. You must install the Memories app and select your media path before running this action.': 78,
  'Triggers a background download of map data and a re-index for reverse geotagging your photos in the Memories app. You must install the Memories app before running this action.': 79,
  'Downloads approximately 2-3 GB of geometry data (~561,000 places). On a low-resource device, avoid running other intensive processes at the same time.': 80,

  // Maintenance actions: tightened wording.
  'Use this if the UI is stuck in "Maintenance Mode" for more than 15 minutes. Brief maintenance mode is normal after updates (including some Nextcloud app updates) or restarts — wait first before resorting to this action.': 81,
  'Disables ALL non-default apps. Stable apps must be re-enabled individually.': 82,

  // main.ts: long-running task completion notifications (posted from runOcc)
  'Recognize Models Downloaded': 83,
  'The Recognize app has finished downloading its machine learning models. Object and face recognition is now available.': 84,
  'Recognize Model Download Failed': 85,
  'The Recognize model download exited with an error — tap for the last log lines. Re-run the "Download Machine Learning Models for Recognize" action to retry.': 86,
  'Memories Indexing Complete': 87,
  'The Memories app has finished re-indexing your media.': 88,
  'Memories Indexing Failed': 89,
  'The Memories media re-index exited with an error — tap for the last log lines. Re-run the "Index Media for Memories" action to retry.': 90,
  'Memories Map Setup Complete': 91,
  'Map data has finished downloading and your photos have been re-indexed for reverse geotagging in the Memories app.': 92,
  'Memories Map Setup Failed': 93,
  'The Memories map setup exited with an error — tap for the last log lines. Re-run the "Setup Map for Memories" action to retry.': 94,
  // main.ts: failure-notification "View Details" body (built by logDetails)
  'Last lines from the service log:': 95,
  'The command produced no output before exiting.': 96,
  'Exit code:': 97,
  'Terminated by signal:': 98,
  'SIGKILL usually means the task ran out of memory.': 99,

  // indexMemories.ts: confirmation warning shown before the action runs
  'Forces a full media re-index and restarts the service. Memories already re-indexes itself every 5 minutes via background jobs.': 100,

  // scanFiles.ts / repair.ts: action name + description
  'Scan Files': 101,
  'Rebuilds the file cache index. Run this after syncing files externally (e.g. via rclone, rsync, or SFTP). Without a scan, externally added or modified files may appear stale, show incorrect sizes, or be missing from search.': 102,
  Repair: 105,
  'Runs the built-in Nextcloud repair routine. Fixes database inconsistencies, stale cache entries, and broken shares. Run this if files appear missing, shares return errors, or after a crash or abrupt shutdown.': 106,

  // main.ts: scan-files / repair health checks (the repair check reuses 'Repair')
  'File Scan': 115,
  'Scanning files...': 109,
  'Repairing Nextcloud...': 110,

  // main.ts: scan-files / repair task completion notifications (posted from runOcc)
  'Scan Complete': 103,
  'The file cache has been rebuilt. Externally synced files should now appear correctly in the Nextcloud UI.': 104,
  'File Scan Failed': 111,
  'The file scan exited with an error — tap for the last log lines. Re-run the "Scan Files" action to retry.': 112,
  'Repair Complete': 107,
  'Nextcloud has been repaired. If you were experiencing file or sharing issues, they should now be resolved.': 108,
  'Repair Failed': 113,
  'The repair routine exited with an error — tap for the last log lines. Re-run the "Repair" action to retry.': 114,

  // main.ts: finish-upgrade oneshot (auto-completes an interrupted upgrade)
  'Completing an interrupted Nextcloud upgrade...': 116,
  'Update Completed': 117,
  'An interrupted Nextcloud update was detected and finished automatically. The web interface is available again.': 118,
  'Update Could Not Be Completed': 119,
  'Nextcloud found an unfinished update but could not finish it automatically. The web interface is still reachable — check the service logs, or run the command-line updater ("occ upgrade").': 120,
  // externalStorage.ts: External Storage action + FileBrowser Quantum source
  'External Storage': 121,
  'FileBrowser Quantum': 123,
  NextExplorer: 163,
  "Show other StartOS services' files as folders in Nextcloud Files, via the built-in External Storage app.": 124,
  'Not mounted': 128,
  'Available to all users': 129,
  'Available to specific users': 130,
  Users: 131,

  // bootstrapNextcloud.ts: init progress phases
  'Starting the database': 132,
  'Copying application files': 133,
  'Creating the database': 161,
  'Migrating the database': 162,

  // disableUnstableApps.ts: per-app outcome report
  'Partially Successful': 137,
  'No non-default apps were enabled.': 138,
  'These apps could not be disabled. The service logs say why:': 139,

  // setConfig.ts: trash retention
  'Delete Files in Trash': 140,
  "How long Nextcloud keeps a deleted file in each user's Deleted Files before removing it for good. Restoring a file is only possible while it is still in Deleted Files.\n- Default: kept for at least 30 days, then removed only as disk space is needed, so trash can grow without bound on a server with room to spare.\n- Delete after 7, 30, 90, 180 or 365 days: removed once it has been in Deleted Files that long, or sooner if disk space is needed.\n- Never delete automatically: kept until it is deleted from Deleted Files by hand.": 141,

  // actions/setOfficeSuite.ts
  'Office Suite': 142,
  'Which document server opens documents, spreadsheets and presentations in your browser. Install it from the Marketplace first, then pick it here — Nextcloud installs the app it needs and points itself at the service.\n- None: Nextcloud uses no document server, and the office app this service turned on is turned off again.\n- Collabora Online: needs about a quarter of the memory of ONLYOFFICE Docs and opens more formats.\n- ONLYOFFICE Docs: from the Community Registry. Worth its size only if you shuttle a large body of style-heavy documents back and forth with Microsoft Office.': 143,
  None: 144,
  'Choose the document server that opens office files in your browser.': 145,
  'Collabora Online (recommended)': 147,

  // maintenance/resetAdmin.ts
  'This replaces the password on the chosen account immediately. The current one stops working, and anyone signed in as that user is signed out.': 150,

  // main.ts: the office-connectors health check
  'Office Connector': 146,
  'Waiting for ${suite} to be ready': 159,
  'Setting up ${app}...': 160,
  '${app} is enabled': 154,
  'Install ${app} in Nextcloud, or select “None” using the “Office Suite” action.': 152,
  'Enable ${app} in Nextcloud, or select “None” using the “Office Suite” action.': 157,
  'Disable ${app} on Nextcloud’s Apps page. With two office apps enabled, Word, Excel and PowerPoint files open in neither.': 155,
  "- Not mounted: this service's files do not appear in Nextcloud.\n- Available to all users: every Nextcloud user sees them in Files.\n- Available to specific users: only the users you pick see them.": 164,
  'Nextcloud leaves maintenance mode and serves users again, even if an update that turned it on has not finished.': 165,
  "The service restarts, then runs Nextcloud's repair routine in the background.": 166,
  "The service restarts, then rescans every user's files in the background.": 167,
  'Default (at least 30 days, then as space is needed)': 168,
  'Delete after 7 days': 169,
  'Delete after 30 days': 170,
  'Delete after 90 days': 171,
  'Delete after 180 days': 172,
  'Delete after 365 days': 173,
  'Never delete automatically': 174,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
