import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";

export const STORAGE_ENV_VAR = "SKILLS_MANAGER_HOME";
export const STORAGE_DIRNAME = ".let-skills";
export const LEGACY_STORAGE_DIRNAME = ".skills-manager";

export function storageDir() {
  const override = process.env[STORAGE_ENV_VAR];
  if (override) return override;

  const preferredDir = path.join(os.homedir(), STORAGE_DIRNAME);
  if (existsSync(preferredDir)) return preferredDir;

  const legacyDir = path.join(os.homedir(), LEGACY_STORAGE_DIRNAME);
  if (existsSync(legacyDir)) return legacyDir;

  return preferredDir;
}
