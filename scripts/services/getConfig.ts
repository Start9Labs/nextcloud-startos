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
      "interface": "main",
  },
  "log-level": {
    "name": "Log Level",
    "description": "How much logs do you want?",
    "type": "enum",
    "values": ["0", "1", "2", "3", "4"],
    "value-names": {
      "0": "Debug",
      "1": "Info",
      "2": "Warn",
      "3": "Error",
      "4": "Fatal",
    },
    "default": "2",
  },
});
