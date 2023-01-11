# Connecting Joplin to Nextcloud

This guide will go over how to connect Joplin running on a Desktop machine to your Embassy's Nextcloud over LAN.

This guide assumes your Nextcloud username is _embassy_

It also assumes that you have set up LAN on your desktop machine. If you still need to do that, please head here - https://docs.start9.com/latest/user-manual/connecting/connecting-lan/

1. First go into Nextcloud on your Embassy and click here

    ![Joplin setup](./assets/joplin-setup0.png "Click on Folders")

Click on the + icon to add a new folder

<pic>

Create a new folder called _joplin_

<pic>

Click on _Files settings_ here and copy the WebDAV link

Open up Joplin and click on _Joplin_ in the top left and click _Preferences_ (on Mac).

<pic>

Click on _Synchronisation_

Under _Synchronization target_ select *Nextcloud*, paste the WebDAV and append onto the end of it _joplin_ so the entire URL should look like this:

_https://xxxx.local/remote.php/dav/files/embassy/joplin_

<pic>

Under _Nextcloud username_ enter _embassy_

Under _Nextcloud password_ enter your password

The username and password for your Nextcloud can be found in your Embassy UI by clicking on the Nextcloud service then clicking on _Properties_

<pic>

Now click _Show advanced settings_

Then check the box that says _Ignore TLS certificate errors_

Now scroll up and select _Check sychronisation configuration_ and you it should be successful.

You are have now connect your Joplin client to your Embassy's Nextcloud!
