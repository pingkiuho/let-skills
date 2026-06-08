import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, test } from "node:test";
import {
  LEGACY_STORAGE_DIRNAME,
  STORAGE_DIRNAME,
  STORAGE_ENV_VAR,
  storageDir,
} from "../src/storage.js";

let sandbox;
let previousHome;
let previousManagerHome;

beforeEach(async () => {
  sandbox = await mkdtemp(path.join(os.tmpdir(), "let-skills-storage-"));
  previousHome = process.env.HOME;
  previousManagerHome = process.env[STORAGE_ENV_VAR];
  process.env.HOME = path.join(sandbox, "home");
  delete process.env[STORAGE_ENV_VAR];
});

afterEach(async () => {
  if (previousHome === undefined) delete process.env.HOME;
  else process.env.HOME = previousHome;

  if (previousManagerHome === undefined) delete process.env[STORAGE_ENV_VAR];
  else process.env[STORAGE_ENV_VAR] = previousManagerHome;

  await rm(sandbox, { recursive: true, force: true });
});

test("uses the override path when SKILLS_MANAGER_HOME is set", () => {
  process.env[STORAGE_ENV_VAR] = path.join(sandbox, "custom-storage");

  assert.equal(storageDir(), path.join(sandbox, "custom-storage"));
});

test("defaults to the new ~/.let-skills directory", () => {
  assert.equal(storageDir(), path.join(process.env.HOME, STORAGE_DIRNAME));
});

test("falls back to the legacy ~/.skills-manager directory when it already exists", async () => {
  await mkdir(path.join(process.env.HOME, LEGACY_STORAGE_DIRNAME), { recursive: true });

  assert.equal(storageDir(), path.join(process.env.HOME, LEGACY_STORAGE_DIRNAME));
});

test("prefers ~/.let-skills over the legacy directory when both exist", async () => {
  await mkdir(path.join(process.env.HOME, STORAGE_DIRNAME), { recursive: true });
  await mkdir(path.join(process.env.HOME, LEGACY_STORAGE_DIRNAME), { recursive: true });

  assert.equal(storageDir(), path.join(process.env.HOME, STORAGE_DIRNAME));
});
