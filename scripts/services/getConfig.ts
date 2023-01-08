import { compat, types as T } from "../deps.ts";

export const getConfig: T.ExpectedExports.getConfig = compat.getConfig({
  "tor-address": {
    "name": "Tor Address",
    "description": "The Tor address of the network interface",
    "type": "pointer",
    "subtype": "package",
    "package-id": "nextcloud",
    "target": "tor-address",
    "interface": "main",
  },
  "lan-address": {
      "name": "LAN Address",
      "description": "The LAN address for the network interface.",
      "type": "pointer",
      "subtype": "package",
      "package-id": "nextcloud",
      "target": "lan-address",
      "interface": "main"
  },
  "username": {
    "type": "string" as const,
    "nullable": false,
    "name": "Nextcloud Username",
    "description": "The admin username for Nextcloud.",
    "default": "embassy",
    "masked": false,
    "pattern": "^[a-zA-Z0-9_]+$",
    "pattern-description":
      "Must be alphanumeric (can contain underscore).",
  },
  "password": {
    "type": "string" as const,
    "nullable": false,
    "name": "Nextcloud Password",
    "description": "The admin password for Nextcloud.",
    "default": {
      "charset": "a-z,A-Z,0-9",
      "len": 22
    },
    "pattern": '^[^\\n"]*$',
    "pattern-description":
      "Must not contain newline or quote characters.",
    "copyable": true,
    "masked": true
  },
  "enable-tor": {
    "name": "Enable Tor",
    "description": "- If OFF: You can use Nextcloud from the browser or from any mobile or desktop client using its .local URL while connected to the same Local Area Network (LAN) as your Embassy. Note: .onion will not work at all.\n- If ON: You can use NextCloud from the browser by visiting its .onion or .local URL. You can also use Nextcloud from any mobile or desktop client using its .onion URL. Note: .local will not work from mobile or desktop clients.",
    "type": "boolean",
    "default": false,
  }
});
