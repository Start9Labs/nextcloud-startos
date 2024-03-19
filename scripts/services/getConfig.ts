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
  "default-locale": {
    "name": "Default Locale",
    "description": 'This sets the default locale on your Nextcloud server.  It overrides automatic locale detection on public pages like login or shared items. User\'s locale preferences configured under “personal -> locale” override this setting after they have logged in.',
    "type": "enum",
    "values": ["en_US", "en_GB", "zh", "es", "es_419", "hi", "pt", "ru", "ja", "de", "fr", "pl"],
    "value-names": {
      "en_US": "English (US)",
      "en_GB": "English (GB)",
      "zh": "Chinese",
      "es": "Spanish",
      "es_419": "Spanish (LA)",
      "hi": "Hindi",
      "pt": "Portuguese",
      "ru": "Russian",
      "ja": "Japanese",
      "de": "German",
      "fr": "French",
      "pl": "Polish",
    },
    "default": "en_US",
  },
  "default-phone-region": {
    "name": "Default Phone Region",
    "description": 'This sets the default region for phone numbers on your Nextcloud server.  It is required to allow inserting phone numbers in the user profiles starting without the country code (e.g. +49 for Germany).',
    "type": "enum",
    "values": ["US", "GB", "CN", "ES", "MX", "IN", "BR", "RU", "JP", "DE", "FR", "PL"],
    "value-names": {
      "US": "United States",
      "GB": "United Kingdom",
      "CN": "China",
      "ES": "Spain",
      "MX": "Mexico",
      "IN": "India",
      "BR": "Brazil",
      "RU": "Russia",
      "JP": "Japan",
      "DE": "Germany",
      "FR": "France",
      "PL": "Poland",
    },
    "default": "US",
  },
  "webdav": {
    "type": "object",
    "name": "WebDAV Settings",
    "description": "WebDAV configuration options.",
    "spec": {
      "max-upload-file-size-limit": {
        "name": "Maximum upload file size",
        "description": "Maximum upload file size for WebDAV (set to 0 for an unlimited upload size).  You may want to raise this value if you are having issues with WebDAV uploads.  <b>Default: 1024</b>",
        "type": "number",
        "units": "MiB",
        "nullable": false,
        "integral": true,
        "range": "(0,65536]",
        "default": 1024
      }
    }
  }
});
