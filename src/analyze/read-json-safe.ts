import { readFileSync } from "node:fs";

/** Read + parse JSON, returning null on any error (missing file, bad JSON). */
export function readJsonSafe<T>(absPath: string): T | null {
  try {
    return JSON.parse(readFileSync(absPath, "utf8")) as T;
  } catch {
    return null;
  }
}
