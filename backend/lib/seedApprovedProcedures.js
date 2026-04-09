import fs from "node:fs/promises";
import path from "node:path";
import XLSX from "xlsx";
import pool from "../db.js";
import { loadApprovedProcedures } from "./loadApprovedProcedures.js";

function toBool(v) {
  if (typeof v === "boolean") return v;
  const s = String(v ?? "").trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes" || s === "y";
}

function toInt(v) {
  if (typeof v === "number" && Number.isFinite(v)) return Math.round(v);
  const s = String(v ?? "").replace(/,/g, "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function normalizeKey(k) {
  return String(k ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function normalizeRow(row) {
  const out = {};
  for (const [key, value] of Object.entries(row ?? {})) {
    out[normalizeKey(key)] = value;
  }
  return out;
}

async function findWorkbookPath() {
  const candidates = [
    path.resolve(process.cwd(), "approved_procedures_csv.xlsx"),
    path.resolve(process.cwd(), "data", "approved_procedures_csv.xlsx"),
  ];
  for (const p of candidates) {
    try {
      await fs.access(p);
      return p;
    } catch {
      // continue
    }
  }
  return null;
}

export async function ensureProcedureTables() {
  await pool.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS approved_procedures (
      id SERIAL PRIMARY KEY,
      procedure_name TEXT NOT NULL,
      max_cost_inr INTEGER,
      is_experimental BOOLEAN DEFAULT false,
      is_rare BOOLEAN DEFAULT false,
      governance_flagged BOOLEAN DEFAULT false
    )`);
}

export async function seedApprovedProceduresIfEmpty() {
  await ensureProcedureTables();

  const countResult = await pool.query(`SELECT COUNT(*)::int AS count FROM approved_procedures`);
  const count = Number(countResult.rows[0]?.count ?? 0);
  if (count > 0) {
    return { seeded: false, count };
  }

  const workbookPath = await findWorkbookPath();
  if (!workbookPath) {
    console.warn("[Seed] approved_procedures_csv.xlsx not found. Falling back to CSV seed.");
    const csvRows = await loadApprovedProcedures();
    let insertedFromCsv = 0;
    for (const row of csvRows) {
      await pool.query(
        `INSERT INTO approved_procedures
          (procedure_name, max_cost_inr, is_experimental, is_rare, governance_flagged)
         VALUES ($1, $2, false, false, false)`,
        [row.procedure_name, row.max_cost_inr],
      );
      insertedFromCsv += 1;
    }
    console.log(`[Seed] Inserted ${insertedFromCsv} rows into approved_procedures from CSV fallback`);
    return { seeded: true, count: insertedFromCsv };
  }

  const workbook = XLSX.readFile(workbookPath);
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: null });

  let inserted = 0;
  for (const raw of rawRows) {
    const row = normalizeRow(raw);
    const procedureName =
      String(row.procedure_name ?? row.procedure ?? row.name ?? "").trim();
    const maxCost = toInt(row.max_cost_inr ?? row.max_cost ?? row.cost_inr ?? row.cost);
    if (!procedureName) continue;

    await pool.query(
      `INSERT INTO approved_procedures
        (procedure_name, max_cost_inr, is_experimental, is_rare, governance_flagged)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        procedureName,
        maxCost,
        toBool(row.is_experimental),
        toBool(row.is_rare),
        toBool(row.governance_flagged),
      ],
    );
    inserted += 1;
  }

  console.log(`[Seed] Inserted ${inserted} rows into approved_procedures from ${workbookPath}`);
  return { seeded: true, count: inserted };
}

