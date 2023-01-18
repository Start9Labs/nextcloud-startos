import { types as T, checkWebUrl, catchError } from "../deps.ts";

export const health: T.ExpectedExports.health = {
  "alive": checkWebUrl("http://nextcloud.embassy")
};
