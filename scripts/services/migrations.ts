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
          false, // setting to needs config due to potential bug on service update
          { version: "25.0.3.3", type: "up" },
        ),
        down: () => { throw new Error('Downgrades prohibited') },
      },
    },
    // No migrations for 25.0.4
    "25.0.4",
  );
