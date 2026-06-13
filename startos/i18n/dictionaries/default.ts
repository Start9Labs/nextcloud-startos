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

  // v32.0.5.0.ts
  'Admin password could not be recovered from migration. Please reset it.': 9,

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
  'Use this if your UI has gotten stuck in "Maintenance Mode". Please keep in mind that it is normal for this mode to engage (temporarily) following an update (including some NC app updates) or restart. The typical solution is to BE PATIENT and allow the opportunity for organic progress. Resort to this action only if necessary. Being in maintenance mode for more than 15min likely constitutes "being stuck."': 26,
  'Maintenance Mode has been disabled. You may need to wait 1-2 minutes and refresh the browser': 27,

  // disableUnstableApps.ts
  'Disable Non-default Apps': 28,
  'Use this if unstable apps were installed resulting in the UI becoming inaccessible with an Internal Server Error: "The server was unable to complete your request".': 29,
  'Running this action will disable ALL non-default app(s). Stable apps will need to be individually re-enabled.': 30,
  'The following apps have been disabled:': 31,

  // getAdminCredentials.ts
  'Get Admin Credentials': 32,
  'Your admin username and password are below. Write them down or save them to a password manager.': 33,

  // downloadModels.ts
  'Download Machine Learning Models for Recognize': 34,
  // Legacy keys 35-37 (synchronous wording) replaced by 47-57 (async wording).
  'This downloads the machine learning models required for identifying objects and faces with the Recognize app. You MUST install the Recognize app in your Nextcloud instance before running this action.': 35,
  'This process can take up to 15 minutes on a 2023 Server One. It will consume approximately 1-2 GB of disk space.': 36,
  'The machine learning models have been downloaded successfully.': 37,
  'Queues a background download of the machine learning models required for identifying objects and faces with the Recognize app. Progress is shown as a "Recognize Model Download" health check on the service status page. You MUST install the Recognize app in your Nextcloud instance before running this action.': 47,
  'The download can take up to 15 minutes on a 2023 Server One and consumes approximately 1-2 GB of disk space. Watch the "Recognize Model Download" health check for progress.': 48,
  'Already in Progress': 49,
  'A model download is already running or queued. Watch the "Recognize Model Download" health check on the service status page.': 50,
  Queued: 51,
  'Model download has been queued. Watch the "Recognize Model Download" health check on the service status page for progress.': 52,
  // main.ts: recognize-models health check
  'Recognize Model Download': 53,
  'No download requested.': 54,
  'Downloading machine learning models...': 55,
  'Models downloaded successfully.': 56,
  'Download failed. Last log lines: ${tail}': 57,

  // indexMemories.ts (legacy 38-40 retained for translations of prior versions)
  'Index Media for Memories': 38,
  'Indexes all media for the Memories media app and enables video support and previews. Indexing is now done automatically by Memories when Nextcloud background tasks are triggered (every 5min by default), so you only need to use this if you want to force a re-index, or do not want to wait for the initial index. You MUST install the Memories app and select your media path (on the Memories welcome screen) before running this Action.': 39,
  'Photos have been indexed for the Memories application. You may need to restart your Nextcloud service if changes do not take effect right away.': 40,
  'Queues a background re-index of media for the Memories app. Indexing normally runs automatically every 5 minutes via Nextcloud background tasks; use this only to force a re-index. Progress is shown as the "Memories Indexing" health check on the service status page. You MUST install the Memories app and select your media path before running this action.': 63,
  'Photo indexing has been queued. Watch the "Memories Indexing" health check on the service status page for progress.': 64,
  'A photo indexing run is already running or queued. Watch the "Memories Indexing" health check on the service status page.': 65,

  // indexPlaces.ts (legacy 41-44 retained)
  'Setup Map for Memories': 41,
  'This sets up the map for reverse geotagging (finding the location of) your photos in the Memories application. This mostly consists of downloading map data. A re-index will be triggered at the end of this process. You MUST install the Memories app before running this Action.': 42,
  "This is an intensive process that will require non-trivial system resources and time. If you are on a device with lower resources, it is best to not perform other intensive processes (such as Bitcoin's initial blockchain download) at the same time. This action will consume approximately 2-3 GB of disk space, and you can check progress by viewing the amount of geometries populated to the database under Admin Settings -> Memories -> Reverse Geotagging (complete set is ~561,000)": 43,
  'You can now use the Map inside your Memories application.': 44,
  'Queues a background download of map data and a re-index for reverse geotagging your photos in the Memories app. Progress is shown as the "Memories Map Setup" health check on the service status page. You MUST install the Memories app before running this action.': 66,
  'The map setup downloads approximately 2-3 GB of geometry data (~561,000 places). On a low-resource device, avoid running other intensive processes (e.g., Bitcoin initial block download) at the same time. Watch the "Memories Map Setup" health check for progress.': 67,
  'Map setup has been queued. Watch the "Memories Map Setup" health check on the service status page for progress.': 68,
  'A map setup run is already running or queued. Watch the "Memories Map Setup" health check on the service status page.': 69,

  // main.ts: shared health check messages
  'Memories Indexing': 58,
  'Indexing photos for the Memories app...': 59,
  'Memories Map Setup': 60,
  'Setting up map data for the Memories app...': 61,
  'Task failed. Last log lines: ${tail}': 62,

  // missing-prerequisite errors (thrown at run time when the required app
  // isn't installed; previously also used as disabled-reason text)
  'Install the Recognize app in Nextcloud first.': 70,
  'Install the Memories app in Nextcloud first.': 71,

  // downloadModels.ts (revised wording)
  'Queues a background download of the machine learning models required for identifying objects and faces with the Recognize app. Progress is shown as a "Recognize Model Download" health check on the service status page. You must install the Recognize app in Nextcloud before running this action.': 72,
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
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
