# Welcome to Nextcloud

Nextcloud is a powerful and extensive software that offers its own Apps. This guide will help you navigate through its features. **Please read these instructions carefully and refer back to them as needed**.

## Accessing Nextcloud from a Browser

1. Click on `Launch UI`.
2. Enter your default username and password (you can find these in "Properties").
3. For easy access in the future, bookmark the site or save it to your Vaultwarden server.
4. If you wish, you can change your default username and password.

## Using Nextcloud Client Apps

For more detailed device guides and community feedback on clients and integrations, please visit our [Nextcloud Master Thread](https://community.start9.com/t/nextcloud-master-thread) or [documentation](https://docs.start9.com/latest/user-manual/service-guides/nextcloud/index).

### Setting Up the Desktop Client (LAN)

It's recommended to perform the initial sync over LAN for speed. This is necessary even if you plan to use Tor later.

1. First, [trust your root CA](https://docs.start9.com/latest/user-manual/trust-ca) on your device.
2. Download the appropriate desktop client from Nextcloud's [website](https://nextcloud.com/install/#install-clients).
    - **Note**: On Linux, your distribution may include built-in Nextcloud account integration. We recommend trying these first for the best experience. Alternatively, you can use your package manager (i.e., apt, pacman, rpm, etc.) to get the client.
3. Open the client and click "Log In".
4. Go to "Interfaces" on your Start9 server's Nextcloud Service page and copy the LAN address.
5. Enter your LAN address under "Server Address" and click "Next".
6. You'll be asked to trust your server's certificate. Since you generate and sign this during LAN Setup, it's safe to do so.
7. Tick the box for "Trust this certificate anyway" and click "Next".
8. A page will launch in your web browser. Click "Log In" and then "Grant access" to link the desktop client. You can close this browser window afterwards.
9. Configure the local directory that you want to sync with Nextcloud. You can use the default or change it, and edit the sync settings as desired. When satisfied, click "Connect".
10. Files will start syncing immediately. Once complete, you'll see a green checkmark.
11. That's it! You can now receive notifications, control accounts and syncing, and quickly access your Apps' WebUI pages from this desktop client.

### Setting Up the Desktop Client (Tor)

If you want to set up a remote connection for your desktop client, follow these steps:

1. Follow the instructions for "Setting Up the Desktop Client (LAN)".
2. In the desktop client, click the account in the top left, then "Settings". Click "Network", then "Specify proxy manually as" and "SOCKS5 proxy". Enter "127.0.0.1" for the Host and "9050" for the port.
3. Make sure you have [set up Tor](https://docs.start9.com/latest/user-manual/connecting-tor) on your device.
4. Back in the desktop client, click the account in the top left, then "Add Account".
5. Click "Log in". Then enter your Nextcloud Tor server address, which you can copy from your server's Nextcloud page -> Interfaces - Tor Address. This must start with *https://* (NOTE: You __will__ need to manually change this) and end with .onion. Click "Next".
6. Your browser will launch and prompt you to log in to your account. Log in and then grant access as we did for LAN.
7. If you wish, you can set up some select folders for remote sync. However, for large files, it's best to sync on LAN only. So, you can "Skip folders configuration" on the resulting screen if you wish. Check your connection by clicking the newly created account in the client app.

### Setting Up the Mobile Client (LAN)

1. Your device needs to support .local addresses, and you need to have first [trusted your root CA](https://docs.start9.com/latest/user-manual/trust-ca) on your device. If your device does not support .local, skip to the Tor guide below.
2. Download the Nextcloud App for your device from your app store (App Store, F-Droid, Play Store, etc).
3. Log in to your Nextcloud instance by scanning the QR code or copy-pasting the LAN Address from the Nextcloud service page, under "Interfaces."
4. Enter your credentials from the server UI's Nextcloud Service page -> Properties.
5. Tap "Log in", then "Grant access."
6. Grant Nextcloud permissions for file management.
7. You'll now be able to see the files on your Nextcloud file explorer. These files will not download automatically to save space.
8. Decide what files to sync from your mobile device.
9. Go to the hamburger menu in the top left -> Settings -> Auto upload.
10. Choose which folders to sync from your mobile device. Select the cloud icon next to the folder to select it for automatic syncing to your Nextcloud server.
    - You may get a warning about battery optimization. This is to keep apps from draining battery by running in the background. It's recommended to disable this for automatic uploads, unless you need to exercise caution in regard to your battery life.
    - Tap "Disable," then "Allow" to enable background syncing.
11. Tap the hamburger menu next to each folder for advanced syncing options.
    - Files from your mobile will now automatically be synced to your server! These will, in turn, be synced to your Desktop via that client if you choose.

Congratulations! You now have Nextcloud set up across Desktop and Mobile with file sync! You can add more devices if you wish.

### Setting Up the Mobile Client (Tor)

1. Make sure you have [set up Tor on your device](https://docs.start9.com/latest/user-manual/connecting-tor).
2. Download the Nextcloud App for your device from your app store (App Store, F-Droid, Play Store, etc).
3. If you're using Android, ensure Orbot is running in VPN mode and that Nextcloud is added as a VPN app.
4. Open the Nextcloud app. Tap the account menu in the top right, then "Add account."
5. Tap "Log in". Then enter your Nextcloud Tor server address, which you can copy from your server's Nextcloud page -> Interfaces - Tor Address. This must start with *https://* (NOTE: You __will__ need to manually change this) and end with .onion. Tap "Next".
6. Your browser will launch and prompt you to log in to your account. Log in and then grant access as we did for LAN.

That's it! If you wish, you can set up some select folders for remote sync. Check your connection by clicking the newly created account in the client app.

For more documentation on Nextcloud, visit the [Nextcloud Docs](https://docs.nextcloud.com/).

## Exploring Nextcloud Apps

Nextcloud has its own app store with a variety of offerings. While these apps generally work, not all of them have been tested by Start9 and there may be some limitations. It's recommended to avoid experimental apps.

- Access Apps from the top right menu.
- The main page will display installed Apps and any available updates.
- You can choose a category on the left, or use the Search field at the top-right of the page to find an App.
- Avoid "experimental" apps or those that do not support the current Nextcloud version, as they are likely unmaintained.
- Visit our [Nextcloud Apps Thread](https://community.start9.com/t/nextcloud-apps-master-thread/) to see which Apps are known to work (or not work) and share your own experiences!
