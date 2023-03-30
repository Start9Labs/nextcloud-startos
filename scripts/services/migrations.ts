import { compat, matches, types as T } from "../deps.ts";

export const migration: T.ExpectedExports.migration = compat.migrations
  .fromMapping(
    {
      "25.0.3.3": {
        up: compat.migrations.updateConfig(
          async (config, effects) => {
            if (
              matches.shape({
                "username": matches.unknown,
                "password": matches.string.optional(),
                "enable-tor": matches.unknown,
              }).test(config)
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
          { version: "25.0.3.3", type: "up" },
        ),
        down: () => { throw new Error('Downgrades are prohibited per Nextcloud development team recommendations') },
      },
      "25.0.4.1": {
        up: compat.migrations.updateConfig(
          _ =>  ({
            "default-locale": "en_US",
            "default-phone-region": "US",
          }),
          true,
          { version: "25.0.4.1", type: "up" },
        ),
        down: () => { throw new Error('Downgrades are prohibited per Nextcloud development team recommendations') },
      },
    },
    "25.0.5",
  );
