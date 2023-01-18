import { compat, matches, types as T } from "../deps.ts";

export const migration: T.ExpectedExports.migration = compat.migrations
  .fromMapping(
    {
      // 25.0.2 - initial release
      //
      "25.0.3": {
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
          { version: "25.0.3", type: "up" },
        ),
        down: compat.migrations.updateConfig(
          async (config, effects) => {
            if (
              matches.shape({
                "username": matches.string,
                "password": matches.string,
                "enable-tor": matches.boolean,
              }).test(config)
            ) {
              config.username = "embassy";
              config.password = await effects.readFile({
                volumeId: "main",
                path: "start9/password.dat",
              });
              config["enable-tor"] = false;
            }
            return config;
          },
          false,
          { version: "25.0.3", type: "down" },
        ),
      },
    },
    "25.0.3",
  );
