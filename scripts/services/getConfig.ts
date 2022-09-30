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
  "connection": {
    "type": "union",
    "name": "Client Connection Settings",
    "description": "Nextcloud Client Connection Settings",
    "tag": {
      "id": "type",
      "name": "Connection Type",
      "variant-names": {
        "both": "LAN and Tor",
        "lan-only": "LAN Only",
      },
      "description":
        "Nextcloud connection settings.\n If you select 'LAN and Tor' you will not be able to use the Desktop or Mobile clients with your .local address.\n If you select 'LAN Only' you will be able to use the Desktop and Mobile Apps with your .local address, but Tor will be disabled.",
      },
    "default": "lan-only",
    "variants": {
      "both": {},
      "lan-only": {},
    }
  }
});

