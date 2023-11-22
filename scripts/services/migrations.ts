import { EmVer } from "https://deno.land/x/embassyd_sdk@v0.3.3.0.9/emver-lite/mod.ts";
import { compat, types as T } from "../deps.ts";

export const migration: T.ExpectedExports.migration = (
  effects: T.Effects,
  version: string,
  ...args: unknown[]
) => {
  const emver = EmVer.parse(version);
  if (args[0] === "from" && emver.values[0] < 25) {
    let major = emver.values[0] + 1;
    let msg = `Cannot update directly from ${version} to v26.0.8. Please visit the marketplace and install v${major++}`;
    while (major < 25) {
      msg += `, then v${major++}`;
    }
    msg +=
      " first. Go to https://docs.start9.com/user-manual/managing-services/#install-specific to learn how to install older versions of a service from the marketplace.";

    throw new Error(msg);
  }
  return compat.migrations.fromMapping({}, "26.0.8")(effects, version, ...args);
};
