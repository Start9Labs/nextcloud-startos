# Welcome to Nextcloud

Nextcloud is powerful and extensive software **Read these instructions carefully and reference them as needed**. Nextcloud also offers its own Apps. Scroll to the end of these instructions for more info about using Apps.


## Using Nextcloud from a browser

1. Click `Launch UI`.
1. Insert your default username and password, located in "Properties".
1. Bookmark the site for future visits, or better yet, save it to your Bitwarden server!
1. Optionally change your default username/password.

## Using Nextcloud client apps

Please see our [Nextcloud Master Thread](https://community.start9.com/t/nextcloud-master-thread) or [documentation](https://docs.start9.com/latest/user-manual/service-guides/nextcloud/index) for more detailed device guides and community feedback on clients and integrations.

### Desktop Client (LAN)

This is necessary even if you later plan to use Tor. It is also highly recommended that you perform initial sync over LAN for speed.

1. Make sure you have first set up LAN access for your OS (https://start9.com/latest/user-manual/connecting/connecting-lan/lan-os/index).
1. Download the appropriate desktop client from https://nextcloud.com/install/#install-clients
    - On Linux, your distribution may include built-in Nextcloud account integration. For the best experience, we recommend trying these first.  You also may prefer to use your package manager (i.e. apt, pacman, rpm, etc) to get the client.
1. Open the client and click "Log In"
1. From your Start9 server's Nextcloud Service page, go to "Interfaces" and copy the LAN address
1. Enter your LAN address under "Server Address" and click "Next"
1. You will be asked to Trust your server's certificate, which is safe to do as you generate and sign this during LAN Setup
1. Tick the box for "Trust this certificate anyway" and click "Next"
1. This will launch a page in your web browser, click "Log In" and then "Grant access" to link the desktop client. You can close this browser window afterwards
1. Next, configure the local directory that you want to sync with Nextcloud. You may use the default or change it, and edit the sync settings to desired. When satisfied, click "Connect"
1. Files will begin to sync immediately and you will see a green check when this is complete.
1. That's it! From this desktop client you will receive notifications, control accounts and syncing, and quickly access your Apps' WebUI pages

### Desktop Client (Tor)

If you would like to setup a remote connection for your desktop client, you may do so here.

1. Follow instructions for "Desktop Client (LAN)" (above).
1. In the desktop client, click the account in the top left, then Settings. Click Network, then "Specify proxy manually as" and "SOCKS5 proxy." Enter "127.0.0.1" for the Host and "9050" for the port.
1. Ensure you have the [Tor daemon running on your OS](https://start9.com/latest/user-manual/connecting/connecting-tor/tor-os/index).
1. Back in the desktop client, click the account in the top left, then Add Account.
1. On the following screen, click "Log in," then enter your Nextcloud Tor server address, which you can copy from your server's Nextcloud page -> Interfaces - Tor Address. This must start with *https://* (NOTE: You __will__ need to manually change this) and end with .onion. Click Next.
1. This will launch your browser and prompt you to log in to your account. Log in and then grant access as we did for LAN.
1. You may wish to set up some select folders for remote sync, but for large files, it is best to sync on LAN only, so you can "Skip folders configuration" on the resulting screen if you wish. Check your connection by clicking the newly created account in the client app.

### Mobile Client (LAN)

1. This will require your device to support .local addresses, and you will need to have completed [LAN setup for your device](https://start9.com/latest/user-manual/connecting/connecting-lan/lan-os/index). If your device does not support .local, skip to the Tor guide below.
1. Download the Nextcloud App for your device from wherever you get your apps (App Store, F-Droid, Play Store, etc).
1. As in the desktop client, we will first log in to our Nextcloud instance by scanning the QR code (or copy pasting) the LAN Address from the Nextcloud service page, under "Interfaces."
1. You will be sent to the login screen, enter your credentials from the server UI's Nextcloud Service page -> Properties.
1. Tap "Log in," then "Grant access."
1. You'll be asked to give Nextcloud permissions for file management, grant them.
1. Now you will be able to see the files on your Nextcloud file explorer.
    - These files will not download automatically, in order to save space. Next we will go over the options for controlling this behavior.
1. Next, you'll want to decide what files to sync from your mobile device.
1. Go to the hamburger menu in the top left -> Settings -> Auto upload.
1. Here, you can choose which folders to sync from your mobile device. Select the cloud icon next to the folder to select it for automatic syncing to your Nextcloud server.
    - You may get a warning about battery optimization. This is to keep apps from draining battery by running in the background. It is recommended to disable this for automatic uploads, unless you need to exercise caution in regard to your battery life.
    - Hit "Disable," then "Allow" to enable background syncing.
1. You can hit the hamburger menu next to each folder for advanced syncing options.
    - Files from your mobile will now automatically be synced to your server! These will, in turn, be synced to your Desktop via that client if you choose.

Congratulations! You now have Nextcloud setup across Desktop and Mobile with file sync!! You can add more devices if you wish.

### Mobile Client (Tor)

1. You will need to have [Orbot running on your device](https://start9.com/latest/user-manual/connecting/connecting-tor/tor-os/index).
1. Download the Nextcloud App for your device from wherever you get your apps (App Store, F-Droid, Play Store, etc).
1. For Android, make sure Orbot is running VPN mode and Nextcloud is added as a VPN app.
1. Launch the Nextcloud app. Tap the account menu in the top right, then "Add account."
1. Tap "Log in," then enter your Nextcloud Tor server address, which you can copy from your server's Nextcloud page -> Interfaces - Tor Address. This must start with *https://* (NOTE: You __will__ need to manually change this) and end with .onion. Tap Next.
1. This will launch your browser and prompt you to log in to your account. Log in and then grant access as we did for LAN.

That's it! You may wish to set up some select folders for remote sync. Check your connection by clicking the newly created account in the client app.

For more documentation on Nextcloud, visit the [Nextcloud Docs](https://docs.nextcloud.com/).

## Nextcloud Apps

Nextcloud has its own app store with many offerings!

It is important to realize that while these apps will generally work, not all of them have been tested by Start9 and there may be some limitations. It is a good idea to avoid experimental apps.

- Access Apps from the top right menu.
- The main page will show you installed Apps, and any available updates.
- On the left, you can choose a category, or use the Search field at the top-right of the page to find an App.
- It is recommended to avoid "experimental" apps, or those that do not support the current Nextcloud version, as they are likely unmaintained.
- See our [Nextcloud Apps Thread](https://community.start9.com/t/nextcloud-apps-master-thread/) to see which Apps are known to work (or not work) and add your own experiences!
