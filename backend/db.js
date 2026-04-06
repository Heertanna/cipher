import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
require("dotenv").config();

import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_SSL === "true" ||
    (process.env.DATABASE_URL?.includes("sslmode=require") ?? false)
      ? { rejectUnauthorized: false }
      : undefined,
});

export default pool;
