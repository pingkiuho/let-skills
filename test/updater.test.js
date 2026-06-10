import assert from "node:assert/strict";
import { test } from "node:test";
import { updateInstalledSkills } from "../src/updater.js";

test("updates installed repository skills while leaving local and missing skills untouched", async () => {
  const pulled = [];
  let synced = false;

  const result = await updateInstalledSkills({
    listSkillsCommand: async () => [
      {
        name: "daily-plan",
        agents: ["codex", "claude-code"],
        source: "team-skills",
      },
      {
        name: "local-helper",
        agents: ["codex"],
      },
      {
        name: "removed-upstream",
        agents: ["hermes"],
        source: "team-skills",
      },
      {
        name: "old-source-skill",
        agents: ["codex"],
        source: "removed-source",
      },
      {
        name: "not-installed",
        agents: [],
        source: "team-skills",
      },
    ],
    listSourcesCommand: async () => [{ name: "team-skills" }],
    updateSourceCommand: async (source) => {
      pulled.push(source);
    },
    discoverSourceSkillsCommand: async () => [
      {
        name: "daily-plan",
        path: "/tmp/team-skills/daily-plan",
      },
    ],
    syncSkillsCommand: async () => {
      synced = true;
    },
  });

  assert.deepEqual(pulled, ["team-skills"]);
  assert.equal(synced, true);
  assert.deepEqual(result, {
    updatedSources: ["team-skills"],
    updatedSkills: [
      {
        skill: "daily-plan",
        source: "team-skills",
        path: "/tmp/team-skills/daily-plan",
      },
    ],
    skippedSkills: [
      {
        skill: "local-helper",
        source: "-",
        reason: "local skill",
      },
      {
        skill: "removed-upstream",
        source: "team-skills",
        reason: "skill is no longer present in source",
      },
      {
        skill: "old-source-skill",
        source: "removed-source",
        reason: "source is not configured",
      },
    ],
  });
});
