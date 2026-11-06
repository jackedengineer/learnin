/**
 * Browser smoke test for the Phase 0 core loop, run against a live dev stack:
 *   pnpm --filter @doubtless/api dev  &  pnpm --filter @doubtless/web dev
 *   node apps/web/e2e/smoke.mjs [screenshotDir]
 * Uses the dev login (local only). Fails on console errors, failed requests or serious a11y violations.
 */

import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const here = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE_URL ?? "http://localhost:5173";
const shots = process.argv[2] ?? join(here, "screenshots");
mkdirSync(shots, { recursive: true });

const problems = [];
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();
// Browsers log every non-2xx as "Failed to load resource"; expected 4xx are asserted by the steps.
page.on("console", (m) => {
  if (m.type() === "error" && !m.text().startsWith("Failed to load resource"))
    problems.push(`console: ${m.text()}`);
});
page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
page.on("response", (r) => r.status() >= 500 && problems.push(`HTTP ${r.status()} ${r.url()}`));

const step = async (name, fn) => {
  const t = Date.now();
  await fn();
  console.log(`✓ ${name} (${Date.now() - t} ms)`);
};
const shot = (name) => page.screenshot({ path: join(shots, `${name}.png`), fullPage: false });
async function axe(label) {
  await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
  const res = await page.evaluate(async () =>
    window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa"] }),
  );
  const serious = res.violations.filter((v) => ["serious", "critical"].includes(v.impact));
  for (const v of serious) problems.push(`a11y(${label}): ${v.id} — ${v.help} (${v.nodes.length})`);
  console.log(
    `  axe ${label}: ${res.violations.length} violations, ${serious.length} serious/critical`,
  );
}

const email = `e2e-${Date.now()}@example.com`;

await step("signed-out visit redirects to /sign-in", async () => {
  await page.goto(BASE);
  await page.waitForURL("**/sign-in");
  await page.getByRole("button", { name: "Continue with Google" }).waitFor();
  await shot("01-sign-in");
  await axe("sign-in");
});

await step("dev login → onboarding", async () => {
  await page.getByLabel("Dev email").fill(email);
  await page.getByRole("button", { name: "Dev sign in" }).click();
  await page.waitForURL("**/welcome");
  await page.getByRole("heading", { name: /Welcome/ }).waitFor();
  await shot("02-welcome");
  await axe("welcome");
});

await step("complete onboarding → empty notebooks", async () => {
  await page
    .getByLabel("What are you trying to learn, and why?")
    .fill("Understand transformers well enough to implement one");
  await page.getByLabel("Your background").fill("Comfortable with Python, rusty on linear algebra");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL(`${BASE}/`);
  await page.getByText("No notebooks yet").waitFor();
  await shot("03-notebooks-empty");
  await axe("notebooks-empty");
});

await step("create notebook via keyboard-friendly dialog", async () => {
  await page.getByRole("button", { name: "New notebook" }).click();
  await page.getByLabel("Title").fill("Transformers from scratch");
  await shot("04-new-notebook-dialog");
  await page.keyboard.press("Enter");
  await page.waitForURL("**/notebooks/**");
  await page.getByRole("heading", { name: "Transformers from scratch" }).waitFor();
  await page.getByText("Add your first source").waitFor();
  await shot("05-notebook-empty");
});

const addDialog = () => page.getByRole("dialog", { name: "Add a source" });

await step("add a YouTube link", async () => {
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await addDialog().getByRole("tab", { name: "Link" }).click();
  await addDialog()
    .getByLabel("Web page or YouTube link")
    .fill("https://www.youtube.com/watch?v=kCc8FmEb1nY");
  await addDialog().getByRole("button", { name: "Add link" }).click();
  await page.getByText("YouTube video kCc8FmEb1nY").waitFor();
});

await step("unsafe link shows a readable error", async () => {
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await addDialog().getByRole("tab", { name: "Link" }).click();
  await addDialog().getByLabel("Web page or YouTube link").fill("http://127.0.0.1/admin");
  await addDialog().getByRole("button", { name: "Add link" }).click();
  await addDialog().getByText("IP-address URLs are not allowed").waitFor();
  await shot("06-unsafe-url-error");
  await page.keyboard.press("Escape");
});

await step("paste text", async () => {
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await addDialog().getByRole("tab", { name: "Paste text" }).click();
  await addDialog().getByLabel("Title").fill("My lecture 3 notes");
  await addDialog()
    .getByLabel("Text")
    .fill("Scaled dot-product attention divides by sqrt(d_k) to keep softmax gradients healthy.");
  await addDialog().getByRole("button", { name: "Add text" }).click();
  await page.getByText("My lecture 3 notes").waitFor();
});

for (const [file, label] of [
  ["attention-notes.pdf", "PDF"],
  ["lecture-3.vtt", "Transcript"],
]) {
  await step(`upload ${file} (ticket → PUT → verify → source)`, async () => {
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await addDialog().getByRole("tab", { name: "Upload file" }).click();
    await addDialog()
      .getByLabel("File")
      .setInputFiles(join(here, "fixtures", file));
    await addDialog().getByRole("button", { name: "Add file" }).click();
    await page.getByText(file).waitFor();
    await page.locator("li", { hasText: file }).getByText(label, { exact: true }).waitFor();
  });
}

await step("deselect a source updates the scope line", async () => {
  await page.getByText("Answering from 4 of 4").waitFor();
  await page.getByRole("checkbox", { name: /My lecture 3 notes/ }).click();
  await page.getByText("Answering from 3 of 4").waitFor();
  await shot("07-notebook-desktop");
  await axe("notebook");
});

await step("persists across reload", async () => {
  await page.reload();
  await page.getByText("Answering from 3 of 4").waitFor();
});

await step("mobile layout (390px): one pane at a time", async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("tab", { name: "Sources" }).click();
  await page.getByText("attention-notes.pdf").waitFor();
  await shot("08-notebook-mobile-sources");
  await page.getByRole("tab", { name: "Chat" }).click();
  await shot("09-notebook-mobile-chat");
  await page.setViewportSize({ width: 1440, height: 900 });
});

await step("notebooks list shows the notebook", async () => {
  await page.getByRole("link", { name: "Doubtless home" }).click();
  await page.getByRole("link", { name: /Transformers from scratch/ }).waitFor();
  await shot("10-notebooks-list");
});

await step("dark mode renders", async () => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.getByRole("link", { name: /Transformers from scratch/ }).click();
  await page.getByText("attention-notes.pdf").waitFor();
  await shot("11-notebook-dark");
  await axe("notebook-dark");
  await page.emulateMedia({ colorScheme: "light" });
});

await step("sign out returns to sign-in", async () => {
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL("**/sign-in");
});

await browser.close();
if (problems.length) {
  console.error(
    `\n✗ ${problems.length} problem(s):\n${problems.map((p) => `  - ${p}`).join("\n")}`,
  );
  process.exit(1);
}
console.log(`\nAll steps passed. Screenshots: ${shots}`);
