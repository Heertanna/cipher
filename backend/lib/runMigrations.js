import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pool from "../db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const migrationsDir = path.join(__dirname, "..", "migrations");
  const migrationFiles = (await readdir(migrationsDir))
    .filter((name) => name.endsWith(".sql"))
    .sort();

  for (const fileName of migrationFiles) {
    const migrationPath = path.join(migrationsDir, fileName);
    const sql = await readFile(migrationPath, "utf8");
    const statements = sql
      .split(/;\s*(?:\r?\n|$)/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      const text = statement.endsWith(";") ? statement : `${statement};`;
      await pool.query(text);
    }
  }

  console.log("Migration complete");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
