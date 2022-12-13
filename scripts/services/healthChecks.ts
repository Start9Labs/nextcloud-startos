import { types as T, checkWebUrl, catchError } from "../deps.ts";

export const health: T.ExpectedExports.health = {
  // deno-lint-ignore require-await
  async "alive"(effects, duration) {
    return checkWebUrl("http://nextcloud.embassy")(effects, duration).catch(catchError(effects))
  },
};