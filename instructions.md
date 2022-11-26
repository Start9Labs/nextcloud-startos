# Welcome to Nextcloud

A safe home for all your data. Access & share your files, calendars, contacts, mail & more from any device, on your terms.

Nextcloud is powerful and extensive software.  It even has its own app store!  It is important to realize that while these apps will generally work, not all of them have been tested on Embassy and there may be some limitations.  It is a good idea to avoid experimental apps.


## Usage Instructions

1. Copy/paste your Nextcloud Tor address into any Tor-enabled browser.
2. Insert your default username and password. These are located in `Properties`.
3. Bookmark the site for future visits, or better yet, save it to your Bitwarden server!
4. Optionally change your default username/password.

## Device Sync Instructions

In the Config Menu you will be able to select one of the following options:

    * `Both LAN and Tor Connections`
    * `LAN Only Connection`

If you select `Both LAN and Tor Connections` you will be able to use your browser to navigate to both .local and .onion addresses for your NextCloud instance. 
However, you will not be able to connect to your instance using the Desktop Sync App with your .local address, only your .onion address will work with this option. 
You will also need to change your sync app network settings to accept socks5 proxy connections, and Tor should be running on your device connecting.

If you select `LAN Only Connection` you will be able to use the Desktop Sync App with your .local address, but all Tor access will be disabled.

For more documentation on Nextcloud, visit [this website](https://docs.nextcloud.com/desktop/3.6/navigating.html).