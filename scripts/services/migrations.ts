import { compat, types as T } from "../deps.ts";

export const migration: T.ExpectedExports.migration = compat.migrations
  .fromMapping( {
      // 24.0.4 No migration needed 
    },
    "24.0.4.1" 
);