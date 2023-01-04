# Welcome to Nextcloud
A safe home for all your data. Access & share your files, calendars, contacts, mail & more from any device, on your terms.

Nextcloud is powerful and extensive software.  It even has its own app store!  It is important to realize that while these apps will generally work, not all of them have been tested on Embassy and there may be some limitations.  It is a good idea to avoid experimental apps.
## Basic Usage
1. Hit `Launch UI` to visit your Nextcloud instance, hosted on your Embassy.
1. Insert your default username and password. These are located in "Properties".
1. Bookmark the site for future visits, or better yet, save it to your Bitwarden server!
1. Optionally change your default username/password.
### Device Syncing Config
In the Config Menu you will be able to select one of the following options:
- `LAN Only Connection`
- `Both LAN and Tor Connections`

If you select `LAN Only Connection` you will be able to use the Desktop Sync App with your .local address, but all Tor access will be disabled.  This is the default as it allows instant access from most systems, and easier setup.

If you select `Both LAN and Tor Connections` you will be able to use your browser to navigate to both .local and .onion addresses for your NextCloud instance. 
However, you will not be able to connect to your instance using the Desktop Sync App with your .local address, only your .onion address will work with this option. 
You will also need to change your sync app's network settings to accept socks5 proxy connections (except MacOS), and Tor must be running on your device.
### First Login
1. Start Nextcloud and Copy your credentials from Properties.
1. Launch the UI and enter your credentials copied from above to log in.
1. Save these credentials in Vaultwarden for safe-keeping and easy access.
1. Welcome to your Nextcloud Dashboard!
1. Across the top, you will find installed Apps (more on these later).
1. In the top right, you will find Notifications, Users, and the Main Menu.
1. In the Main Menu, you can access your instance's Settings and Apps.
### Settings
The Settings page has 2 main sections: Personal and Administration.
#### Personal Settings
- These settings are for your user, which if you only have one user, will also happen to be the administrator.
- You can create your profile in Personal Info, adjust your Notifications, control clients, and much more.
#### Administration Settings
- These settings will only appear for admin users, such as the default one.
- Here you can edit instance-wide settings, such as Themes, Priviliges, and Security.
- This is also where you will find Settings for the Apps you install (next section).
### Apps
Nextcloud has its own app store with many offerings!

- Access Apps from the top right menu.
- The main page will show you installed Apps, and any available updates.
- On the left, you can choose a category, or use the Search field at the top-right of the page to find an App.
- It is recommended to avoid "experimental" apps, or those that do not support the current Nextcloud version, as they are likely unmaintained.
- See our [Nextcloud Apps Thread](https://community.start9.com/t/nextcloud-apps-master-thread/) to see which Apps are known to work (or not work) and add your own experiences!

## Nextcloud Device Setup Guide
Please see our [Nextcloud Master Thread](https://community.start9.com/t/nextcloud-master-thread) or [documentation](https://docs.start9.com/latest/user-manual/service-guides/nextcloud/index) for more detailed device guides and community feedback on clients and integrations.
### Desktop Client (LAN)
Make sure you have first set up LAN access for your OS (https://start9.com/latest/user-manual/connecting/connecting-lan/lan-os/index).

1. Download the appropriate desktop client from https://nextcloud.com/install/#install-clients
    - On Linux, your distribution may include built-in Nextcloud account integration. For the best experience, we recommend trying these first.  You also may prefer to use your package manager (i.e. apt, pacman, rpm, etc) to get the client.
1. Open the client and click "Log In"
1. From your Embassy's Nextcloud Service page, go to "Interfaces" and copy the LAN address
1. Enter your LAN address under "Server Address" and click "Next"
1. You will be asked to Trust your Embassy's certificate, which is safe to do as you generate and sign this during LAN Setup
1. Tick the box for "Trust this certificate anyway" and click "Next"
1. This will launch a page in your web browser, click "Log In" and then "Grant access" to link the desktop client. You can close this browser window afterwards
1. Next, configure the local directory that you want to sync with Nextcloud. You may use the default or change it, and edit the sync settings to desired. When satisfied, click "Connect"
1. Files will begin to sync immediately and you will see a green check when this is complete.
1. That's it! From this desktop client you will recieve notifications, control accounts and syncing, and quickly access your Apps' WebUI pages

### Desktop Client (Tor)
If you would like to setup a remote connection for your desktop client, you may do so here.

You will need to have the [Tor daemon running on your OS](https://start9.com/latest/user-manual/connecting/connecting-tor/tor-os/index) first.

1. First, enable Tor in the Nextcloud Config on Embassy, Services -> Nextcloud -> Config -> Connection Settings -> Connection Type -> LAN and Tor.
1. (Mac users - skip this step) On your desktop application, click the account in the top left -> Settings, then in Settings, click Network, then "Specify proxy manually as" and "SOCKS5 proxy." Enter "127.0.0.1" for the Host and "9050" for the port.
1. Close the Settings screen and click the account in the top left again, then "Add Account."
1. On the following screen, click "Log in," then enter your Nextcloud Tor server address, which you can copy from the Nextcloud page on your Embassy -> Interfaces - Tor. This must start with http:// and end with .onion. Click Next.
1. This will launch your browser and prompt you to log in to your account. Log in and then grant access as we did for LAN.
1. That's it! You may wish to set up some select folders for remote sync, but for large files, it is best to sync on LAN only, so you can "Skip folders configuration" on the resulting screen if you wish. Check your connection by clicking the newly created account in the client app.

### Mobile Client (LAN)
This will require your device to support .local addresses, and you will need to have completed [LAN setup for your device](https://start9.com/latest/user-manual/connecting/connecting-lan/lan-os/index). If your device does not support .local, skip to the Tor guide below.

1. Download the Nextcloud App for your device from wherever you get your apps (App Store, F-Droid, Play Store, etc).
1. As in the desktop client, we will first log in to our Nextcloud instance by scanning the QR code (or copy pasting) the LAN address from the Nextcloud service page, under "Interfaces."
1. You'll be sent to the login screen, enter your credentials from the Embassy UI's Nextcloud Service page -> Properties.
1. Tap "Log in," then "Grant access."
1. You'll be asked to give Nextcloud permissions for file management, grant them.
1. Now you will be able to see the files on your Embassy's Nextcloud server.
    - These files will not download automatically, in order to save space. Next we'll go over the options for controlling this behavior.
1. Next, you'll want to decide what files to sync from your mobile device.
1. Go to the hamburger menu in the top left -> Settings -> Auto upload.
1. Here, you can choose which folders to sync from your mobile device. Select the cloud icon next to the folder to select it for automatic syncing to your Embassy's Nextcloud server.
    - You may get a warning about battery optimization. This is to keep apps from draining battery by running in the background. It is recommended to disable this for automatic uploads, unless you need to exercise caution in regard to your battery life.
    - Hit "Disable," then "Allow" to enable background syncing.
1. You can hit the hamburger menu next to each folder for advanced syncing options.
    - Files from your mobile will now automatically be synced to your Embassy! These will, in turn, be synced to your Desktop via that client if you choose.

Congratulations! You now have Nextcloud setup across Desktop and Mobile with file sync!! You can add more devices if you wish.

### Mobile Client (Tor)
You will need to have [Orbot running on your device](https://start9.com/latest/user-manual/connecting/connecting-tor/tor-os/index) first.

1. First, enable Tor in the Nextcloud Config on Embassy, Services -> Nextcloud -> Config -> Connection Settings -> Connection Type -> LAN and Tor.
1. On your mobile device, open Orbot and make sure it is connected. Add the Nextcloud app to the list of VPN apps, then enable VPN mode. Select "OK" if asked to allow Orbot to use a VPN connection.
1. Launch the Nextcloud app. Tap the account menu in the top right, then "Add account."
1. Tap "Log in," then enter your Nextcloud Tor server address, which you can copy from the Nextcloud page on your Embassy -> Interfaces - Tor. This must start with http:// and end with .onion. Tap Next.
1. This will launch your browser and prompt you to log in to your account. Log in and then grant access as we did for LAN.

That's it! You may wish to set up some select folders for remote sync. Check your connection by clicking the newly created account in the client app.

For more documentation on Nextcloud, visit the [Nextcloud Docs](https://docs.nextcloud.com/).
