// Tavily adapter guards — real-time tool must be server-only, fail-null, labelled unverified.
// Run: node --test src/lib/__tests__/tavily.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import ts from "typescript";

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = join(here, "..", "..", "..");
const libFile = join(webRoot, "src/lib/tavily.ts");

function loadNamed(file, name) {
  const source = readFileSync(join(webRoot, "src/lib", file), "utf8");
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const start = js.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `could not find ${name} in ${file}`);
  let depth = 0;
  let end = js.indexOf("{", start);
  for (let i = end; i < js.length; i++) {
    if (js[i] === "{") depth++;
    else if (js[i] === "}") {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  const body = js.slice(start, end);
  return new Function(`${body}; return ${name};`)();
}

test("tavily.ts exists and is server-only", () => {
  assert.ok(existsSync(libFile), "src/lib/tavily.ts must exist");
  const src = readFileSync(libFile, "utf8");
  assert.ok(!/NEXT_PUBLIC/.test(src), "must never use NEXT_PUBLIC_ key");
  assert.ok(/process\.env\.TAVILY_API_KEY/.test(src), "must read TAVILY_API_KEY from server env");
  assert.ok(/Authorization/.test(src) && /Bearer/.test(src), "must use Bearer auth");
  assert.ok(/api\.tavily\.com\/search/.test(src), "must POST https://api.tavily.com/search");
});

test("exports fail-null search + topic picker", () => {
  const src = readFileSync(libFile, "utf8");
  assert.ok(/export (async )?function tavilySearch/.test(src), "must export tavilySearch");
  assert.ok(/export function pickTavilyTopic/.test(src), "must export pickTavilyTopic");
  assert.ok(/export function isTavilyConfigured/.test(src), "must export isTavilyConfigured");
  // Fail-null: empty key/query and non-ok/timeout must yield null, never throw to caller.
  assert.ok(/if \(!apiKey/.test(src) || /if \(!apiKey \|\|/.test(src), "missing key must return null");
  assert.ok(/catch/.test(src) && /return null/.test(src), "failures must resolve null");
  assert.ok(/AbortController/.test(src), "must bound upstream with timeout");
});

test("pickTavilyTopic routes real-time queries to news", () => {
  const pickTavilyTopic = loadNamed("tavily.ts", "pickTavilyTopic");
  assert.equal(pickTavilyTopic("what is the weather in Imphal today", "weather_context"), "news");
  assert.equal(pickTavilyTopic("latest news about Shirui", "place_fact"), "news");
  assert.equal(pickTavilyTopic("tell me about Loktak Lake", "place_fact"), "general");
});
