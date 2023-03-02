// deno-lint-ignore-file
import { compat, types as T } from "../deps.ts";

export const migration: T.ExpectedExports.migration = compat.migrations
  .fromMapping(
    {
      "25.0.4": {
        up: compat.migrations.updateConfig(
          async (config: any, effects) => {

            await effects.removeFile({
              path: "start9/password.dat",
              volumeId: "main",
            }).catch();

            delete config.username;
            delete config.password;
            delete config["enable-tor"];
            return config;
          },
          false, // setting to needs config due to potential bug on service update
          { version: "25.0.4", type: "up" },
        ),
        down: () => { throw new Error('Downgrades prohibited') },
      },
    },
    "25.0.4",
  );
