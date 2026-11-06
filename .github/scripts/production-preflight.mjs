/**
 * Decides whether production can be deployed, from the committed Worker config.
 *
 * Committing the real Hyperdrive id is the switch that turns deploys on (docs/runbooks/deploy.md).
 * Until then the Deploy workflow skips with a visible notice, so an unprovisioned production
 * can't turn every merge red. A manual run sets REQUIRE_READY and fails loudly instead.
 *
 * No dependencies: this runs before `pnpm install`.
 */
import { appendFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const CONFIG_PATH = new URL("../../apps/api/wrangler.jsonc", import.meta.url);
const RUNBOOK = "docs/runbooks/deploy.md";

/** Parse JSONC. String-aware, because values such as "https://…" contain comment markers. */
export function parseJsonc(text) {
  let out = "";
  let inString = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      out += c;
      if (c === "\\") out += text[++i];
      else if (c === '"') inString = false;
    } else if (c === '"') {
      inString = true;
      out += c;
    } else if (c === "/" && text[i + 1] === "/") {
      while (i < text.length && text[i] !== "\n") i++;
      out += "\n";
    } else if (c === "/" && text[i + 1] === "*") {
      const end = text.indexOf("*/", i + 2);
      if (end === -1) throw new Error("Unterminated block comment in JSONC");
      i = end + 1;
    } else {
      out += c;
    }
  }
  return JSON.parse(out.replace(/,(\s*[}\]])/g, "$1"));
}

/** Only `env.production` counts: the top-level config is local dev and keeps its placeholder. */
export function assessProduction(config) {
  const production = config.env?.production;
  const hyperdriveId = production?.hyperdrive?.[0]?.id ?? "";
  const url = production?.vars?.BETTER_AUTH_URL ?? "";
  const problems = [];
  if (!/^[0-9a-f]{32}$/i.test(hyperdriveId) || /^0+$/.test(hyperdriveId)) {
    problems.push("env.production.hyperdrive[0].id is still a placeholder");
  }
  if (!url.startsWith("https://")) {
    problems.push("env.production.vars.BETTER_AUTH_URL must be an https URL");
  }
  return { ready: problems.length === 0, url, problems };
}

function main() {
  const { ready, url, problems } = assessProduction(parseJsonc(readFileSync(CONFIG_PATH, "utf8")));
  const { GITHUB_OUTPUT, GITHUB_STEP_SUMMARY, REQUIRE_READY } = process.env;
  if (GITHUB_OUTPUT) appendFileSync(GITHUB_OUTPUT, `ready=${ready}\nurl=${url}\n`);

  if (ready) {
    console.log(`Production is provisioned; deploying to ${url}`);
    return;
  }
  const reasons = problems.map((p) => `- ${p}`).join("\n");
  const summary = `Production is not provisioned, so nothing was deployed.\n\n${reasons}\n\nSetup steps: ${RUNBOOK}\n`;
  if (GITHUB_STEP_SUMMARY) appendFileSync(GITHUB_STEP_SUMMARY, summary);
  console.log(summary);

  if (REQUIRE_READY === "true") {
    console.log(`::error::Cannot deploy: production is not provisioned (${RUNBOOK})`);
    process.exitCode = 1;
  } else {
    console.log(`::notice::Deploy skipped: production is not provisioned (${RUNBOOK})`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
