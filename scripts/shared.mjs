import crypto from "node:crypto";
import { ClassicLevel } from "classic-level";

/**
 * Generates an stable Foundry ID from the input string.
 * @param {string} input The input string.
 * @returns {string} The generated ID.
 */
export function generateID(input) {
  return crypto.createHash("sha1").update(input).digest("hex").slice(0, 16);
}

export async function applyOpsToDb(dbPath, ops) {
  const db = new ClassicLevel(dbPath, { valueEncoding: "json" });
  await db.batch(ops);
  return db.close();
}
