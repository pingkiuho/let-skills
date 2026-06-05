import { existsSync, readdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Resolve the real system home directory.
 *
 * When running inside a Hermes agent profile, $HOME is overridden to the
 * profile home (e.g. ~/.hermes/profiles/salad/home).  os.homedir() respects
 * $HOME, so it returns the profile home instead of the actual user home.
 * This breaks agentSkillsDir() because skills live under the real home
 * (~/.hermes/skills or ~/.hermes/profiles/<name>/skills), not under the
 * profile home.
 *
 * Detecting the profile-home pattern and walking up to the real home
 * avoids relying on os.userInfo() which breaks tests that override $HOME.
 */
function realHome() {
  const home = os.homedir();
  const marker = ".hermes/profiles/";
  const idx = home.indexOf(marker);
  if (idx !== -1 && home[idx + marker.length]) {
    return home.slice(0, idx);
  }
  return home;
}

export const AGENTS = {
  codex: {
    name: "Codex",
    detectDir: ".codex",
    globalSkillsDir: ".codex/skills",
  },
  "claude-code": {
    name: "Claude Code",
    detectDir: ".claude",
    globalSkillsDir: ".claude/skills",
  },
  "github-copilot": {
    name: "GitHub Copilot",
    detectDir: ".copilot",
    globalSkillsDir: ".copilot/skills",
  },
  hermes: {
    name: "Hermes",
    detectDir: ".hermes",
    globalSkillsDir: ".hermes/skills",
  },
};

export const DEFAULT_AGENT = "codex";

export function agentSkillsDir(agent) {
  if (!AGENTS[agent]) {
    throw new Error(`Unknown agent "${agent}".`);
  }

  return path.join(realHome(), AGENTS[agent].globalSkillsDir);
}

function agentDetectDir(agent) {
  if (!AGENTS[agent]) {
    throw new Error(`Unknown agent "${agent}".`);
  }

  return path.join(os.homedir(), AGENTS[agent].detectDir);
}

function hasHermesProfileSkills() {
  const profilesDir = path.join(os.homedir(), ".hermes", "profiles");
  if (!existsSync(profilesDir)) return false;

  try {
    return readdirSync(profilesDir, { withFileTypes: true }).some((entry) =>
      entry.isDirectory() && existsSync(path.join(profilesDir, entry.name, "skills"))
    );
  } catch {
    return false;
  }
}

function isAgentAvailable(agent) {
  if (agent === "hermes") {
    return existsSync(agentDetectDir(agent)) ||
      existsSync(agentSkillsDir(agent)) ||
      hasHermesProfileSkills();
  }

  return existsSync(agentDetectDir(agent)) || existsSync(agentSkillsDir(agent));
}

export function listSupportedAgents() {
  return Object.entries(AGENTS).map(([id, agent]) => ({
    id,
    ...agent,
    path: agentSkillsDir(id),
  }));
}

export function detectAvailableAgents() {
  return listSupportedAgents().filter(({ id }) => isAgentAvailable(id));
}
