import { EmVer } from "https://deno.land/x/embassyd_sdk@v0.3.3.0.9/emver-lite/mod.ts";
import { compat, matches, util, types as T } from "../deps.ts";
import { getConfig } from "./getConfig.ts";

const current = "28.0.14";
const currentMajor = EmVer.parse(current).values[0];
const minMajor = currentMajor - 1;

export const migration: T.ExpectedExports.migration = async (
  effects: T.Effects,
  version: string,
  ...args: unknown[]
) => {
  const emver = EmVer.parse(version);
  if (args[0] === "from" && emver.values[0] < minMajor) {
    let major = emver.values[0] + 1;
    let msg = `Cannot update directly from ${version} to v${current}. Please visit the marketplace and install v${major++} and allow it to run until all heath checks pass`;
    while (major < minMajor) {
      msg += `, then v${major++}`;
    }
    msg +=
      " first. Go to https://docs.start9.com/user-manual/managing-services/#install-specific to learn how to install older versions of a service from the marketplace.";

    throw new Error(msg);
  }
  if (args[0] === "to" && emver.lessThan(EmVer.parse(current))) {
    throw new Error("Per Nextcloud recommendations, downgrades are prohibited");
  }

  if (
    emver.values[0] == minMajor &&
    minMajor >= 26 &&
    !(await util.exists(effects, {
      volumeId: "main",
      path: `migrations/${minMajor}.complete`,
    }))
  ) {
    throw new Error(
      `The migration for v${minMajor} did not complete. Please start the service and wait for all health checks to pass before updating to v${currentMajor}.`
    );
  }

  return compat.migrations.fromMapping(
    {
      "25.0.3.3": {
        up: compat.migrations.updateConfig(
          async (config, effects) => {
            if (
              matches
                .shape({
                  username: matches.unknown,
                  password: matches.string.optional(),
                  "enable-tor": matches.unknown,
                })
                .test(config)
            ) {
              delete config.username;
              await effects.writeFile({
                path: "start9/password.dat",
                toWrite: config.password || "",
                volumeId: "main",
              });
              delete config.password;
              delete config["enable-tor"];
            }
            return config;
          },
          true,
          { version: "25.0.3.3", type: "up" }
        ),
        down: () => {
          throw new Error(
            "Downgrades are prohibited per Nextcloud development team recommendations"
          );
        },
      },
      "25.0.4.1": {
        up: compat.migrations.updateConfig(
          (_) => ({
            "default-locale": "en_US",
            "default-phone-region": "US",
          }),
          true,
          { version: "25.0.4.1", type: "up" }
        ),
        down: () => {
          throw new Error(
            "Downgrades are prohibited per Nextcloud development team recommendations"
          );
        },
      },
      "27.1.7": {
        up: compat.migrations.updateConfig(
          (config) => {
            config.webdav = {"max-upload-file-size-limit": 1024}
            return config;
          },
          true,
          { version: "27.1.7", type: "up" }
        ),
        down: () => {
          throw new Error(
            "Downgrades are prohibited per Nextcloud development team recommendations"
          );
        },
      },
      "28.0.14": {
        up: compat.migrations.updateConfig(
          (config) => {
            config['extra-addresses'] = []
            config['maintenance_window_start'] = 24
            return config;
          },
          true,
          { version: "28.0.14", type: "up" },
        ),
        down: () => {
          throw new Error(
            "Downgrades are prohibited per Nextcloud development team recommendations",
          );
        },
      },
    },
    current
  )(effects, version, ...args);
};
