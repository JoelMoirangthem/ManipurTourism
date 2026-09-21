// Unit checks for the WMO weather-code mapping.
//
// A mis-mapped code is a factual error on a travel page, so every documented
// code is asserted explicitly rather than trusting band arithmetic.
//
// The app's modules use extensionless imports that Node's ESM resolver will not
// follow to .ts, so the function under test is transpiled in-process with the
// TypeScript compiler (already a dependency) instead of restructuring the app's
// import style to suit a test.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import ts from "typescript";

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = join(here, "..", "..", "..");

/** Extract and evaluate a single exported function from a TS file. */
function loadPureFunction(file, name) {
  const source = readFileSync(join(webRoot, "src/lib", file), "utf8");
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  // Take only the named function's declaration, then evaluate it standalone.
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

const weatherDescription = loadPureFunction("adapters.ts", "weatherDescription");

const CASES = [
  [0, "clear sky"],
  [1, "mainly clear"],
  [2, "partly cloudy"],
  [3, "overcast"],
  [45, "fog"],
  [48, "fog"],
  [51, "drizzle"],
  [53, "drizzle"],
  [55, "drizzle"],
  [56, "freezing drizzle"],
  [57, "freezing drizzle"],
  [61, "rain"],
  [63, "rain"],
  [65, "rain"],
  [66, "freezing rain"],
  [67, "freezing rain"],
  [71, "snowfall"],
  [73, "snowfall"],
  [75, "snowfall"],
  [77, "snow grains"],
  [80, "rain showers"],
  [81, "rain showers"],
  [82, "rain showers"],
  [85, "snow showers"],
  [86, "snow showers"],
  [95, "thunderstorm"],
  [96, "thunderstorm with hail"],
  [99, "thunderstorm with hail"],
];

test("every documented WMO code maps to its correct description", () => {
  for (const [code, expected] of CASES) {
    assert.equal(weatherDescription(code), expected, `code ${code}`);
  }
});

test("overcast (3) is not described as partly cloudy", () => {
  assert.notEqual(weatherDescription(3), weatherDescription(2));
});

test("freezing variants are never collapsed into plain drizzle or rain", () => {
  assert.match(weatherDescription(57), /freezing/);
  assert.match(weatherDescription(67), /freezing/);
});

test("unmapped codes degrade honestly rather than guessing", () => {
  assert.equal(weatherDescription(999), "unknown conditions");
  assert.equal(weatherDescription(-1), "unknown conditions");
});
