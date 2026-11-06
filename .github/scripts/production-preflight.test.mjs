import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { assessProduction, parseJsonc } from "./production-preflight.mjs";

const PLACEHOLDER = "0".repeat(32);
const REAL_ID = "abcdef0123456789abcdef0123456789";

const config = (productionId, url = "https://app.example.com") => ({
  // The local-dev block keeps its placeholder forever. It must never affect the result.
  hyperdrive: [{ binding: "HYPERDRIVE", id: PLACEHOLDER }],
  env: {
    production: {
      hyperdrive: [{ binding: "HYPERDRIVE", id: productionId }],
      vars: { BETTER_AUTH_URL: url },
    },
  },
});

test("a real production id is ready even though the dev block keeps its placeholder", () => {
  assert.deepEqual(assessProduction(config(REAL_ID)), {
    ready: true,
    url: "https://app.example.com",
    problems: [],
  });
});

test("a placeholder production id is not ready", () => {
  const result = assessProduction(config(PLACEHOLDER));
  assert.equal(result.ready, false);
  assert.match(result.problems[0], /placeholder/);
});

test("a missing production block is not ready", () => {
  assert.equal(assessProduction({ hyperdrive: [{ id: REAL_ID }] }).ready, false);
});

test("a non-https production URL is not ready", () => {
  assert.equal(assessProduction(config(REAL_ID, "http://app.example.com")).ready, false);
});

test("JSONC comments are removed but comment markers inside strings survive", () => {
  const parsed = parseJsonc(`{
    // line comment with "quotes"
    "url": "https://example.com/a//b", /* block
    comment */ "escaped": "quote \\" // not a comment",
    "list": [1, 2,],
  }`);
  assert.deepEqual(parsed, {
    url: "https://example.com/a//b",
    escaped: 'quote " // not a comment',
    list: [1, 2],
  });
});

test("the committed Worker config parses and has a production block", () => {
  const text = readFileSync(new URL("../../apps/api/wrangler.jsonc", import.meta.url), "utf8");
  const parsed = parseJsonc(text);
  assert.equal(parsed.env.production.name, "doubtless-api");
  assert.equal(typeof assessProduction(parsed).ready, "boolean");
});
