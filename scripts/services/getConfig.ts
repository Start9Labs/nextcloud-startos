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
    "description": 'How much logs do you want? The most is "Debug" and the least is "Fatal" (neither recommended). "Warn" is recommended in most cases.',
    "type": "enum",
    "values": ["debug", "info", "warn", "error", "fatal"],
    "value-names": {
      "debug": "Debug",
      "info": "Info",
      "warn": "Warn",
      "error": "Error",
      "fatal": "Fatal",
    },
    "default": "warn",
  },
});
