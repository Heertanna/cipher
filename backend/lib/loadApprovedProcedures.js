import fs from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";

/**
 * Parse CSV text into approved procedure objects.
 * Expected headers:
 * icd10_code,procedure_name,max_cost_inr
 */
function toNumber(value) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value !== "string") {
    return Number.NaN;
  }

  // Support values like "15,000" or " 15000 ".
  const normalized = value.replace(/,/g, "").trim();
  return Number(normalized);
}

function parseProceduresCsv(csvText) {
  const rows = parse(csvText, {
    columns: (headers) => headers.map((header) => header.trim().toLowerCase()),
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });

  if (!Array.isArray(rows) || rows.length === 0) {
    return [];
  }

  const requiredHeaders = ["icd10_code", "procedure_name", "max_cost_inr"];
  const missingHeaders = requiredHeaders.filter(
    (header) => !(header in rows[0]),
  );
  if (missingHeaders.length > 0) {
    throw new Error(
      `CSV must include headers: icd10_code, procedure_name, max_cost_inr. Missing: ${missingHeaders.join(", ")}`,
    );
  }

  const procedures = [];
  for (const row of rows) {
    const icd10_code = String(row.icd10_code ?? "").trim();
    const procedure_name = String(row.procedure_name ?? "").trim();
    const max_cost_inr = toNumber(row.max_cost_inr);

    if (!icd10_code || !procedure_name || Number.isNaN(max_cost_inr)) {
      console.warn("[CSV Loader] Skipping invalid row:", row);
      continue;
    }

    procedures.push({ icd10_code, procedure_name, max_cost_inr });
  }

  return procedures;
}

export async function loadApprovedProcedures() {
  const csvPath = path.resolve(process.cwd(), "data", "approved_procedures.csv");

  try {
    const csvText = await fs.readFile(csvPath, "utf8");
    const procedures = parseProceduresCsv(csvText);
    console.log(
      `[CSV Loader] Loaded ${procedures.length} approved procedures from ${csvPath}`,
    );
    return procedures;
  } catch (error) {
    if (error.code === "ENOENT") {
      console.warn(
        `[CSV Loader] File not found at ${csvPath}. Starting with empty procedures list.`,
      );
      return [];
    }

    console.error("[CSV Loader] Failed to load procedures:", error.message);
    throw error;
  }
}
