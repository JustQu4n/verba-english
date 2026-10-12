#!/usr/bin/env node
// SDD traceability: every AC in specs/*/spec.md (except Draft or `manual`) must have a test carrying its ID,
// and tests must not reference non-existent ACs.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const AC_ID = /\b([A-Z]{2,6}-AC-\d{2,3})\b/g;

function walk(dir, filter) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p, filter));
    else if (filter(p)) out.push(p);
  }
  return out;
}

const specFiles = walk("specs", (p) => p.endsWith("spec.md") && !p.includes("_templates"));
const testFiles = walk("src", (p) => /\.test\.tsx?$/.test(p));

const testedIds = new Map(); // id -> files
for (const file of testFiles) {
  for (const [, id] of readFileSync(file, "utf8").matchAll(AC_ID)) {
    testedIds.set(id, [...(testedIds.get(id) ?? []), file]);
  }
}

const defined = new Map(); // id -> { spec, manual, checked }
const errors = [];

for (const file of specFiles) {
  const text = readFileSync(file, "utf8");
  const status = /\*\*Status:\*\*\s*([A-Za-z ]+)/.exec(text)?.[1].trim() ?? "Draft";
  for (const line of text.split("\n")) {
    const m = /^\s*-\s*\*\*([A-Z]{2,6}-AC-\d{2,3})\*\*(.*)$/.exec(line);
    if (!m) continue;
    const [, id, rest] = m;
    if (defined.has(id)) errors.push(`Duplicate ID ${id} (${file})`);
    defined.set(id, {
      spec: file,
      manual: /`manual`/.test(rest),
      checked: status !== "Draft",
    });
  }
}

const rows = [];
for (const [id, info] of defined) {
  const files = testedIds.get(id) ?? [];
  const kind = info.manual ? "manual" : files.length ? "test" : "MISSING";
  rows.push(`${id.padEnd(12)} ${kind.padEnd(7)} ${info.spec}`);
  if (info.checked && !info.manual && files.length === 0) {
    errors.push(`${id} has no test (${info.spec})`);
  }
}
for (const id of testedIds.keys()) {
  if (!defined.has(id)) errors.push(`Test references ${id} but no spec defines it`);
}

console.log(rows.join("\n"));
const manual = [...defined.values()].filter((d) => d.manual).length;
console.log(`\n${defined.size} AC (${manual} manual) · ${testFiles.length} test files`);

if (errors.length) {
  console.error("\nSpec traceability errors:\n- " + errors.join("\n- "));
  process.exit(1);
}
console.log("Spec traceability OK");
