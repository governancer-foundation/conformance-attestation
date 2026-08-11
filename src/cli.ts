#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Agonist Development AB
/**
 * Check records against the schema, from a terminal.
 *
 * Two uses. Point it at your own records to find out whether they are valid.
 * Or run it with no arguments to put the shipped conformance corpus through
 * this implementation — which is how somebody who has written their own
 * validator finds out whether it agrees with this one, and where it does not.
 *
 * A corpus nobody can run is a corpus nobody checks against.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { validateStatement } from "./validate.js";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const CORPUS = join(HERE, "..", "schema", "conformance");

const USAGE = `conformance-attestation — check records against the schema

  conformance-attestation <file|dir>...   check the records you name
  conformance-attestation --corpus        run the shipped conformance corpus
  conformance-attestation --help

Exit status is 0 when every record has the verdict it should, 1 otherwise.
`;

function jsonFilesIn(path: string): string[] {
  if (!statSync(path).isDirectory()) return [path];
  return readdirSync(path)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => join(path, f));
}

function report(label: string, ok: boolean, detail?: string): void {
  process.stdout.write(`${ok ? "  ok  " : "  FAIL"}  ${label}${detail ? `\n        ${detail}` : ""}\n`);
}

/** Check the shipped corpus: everything under valid/ must pass, invalid/ must fail. */
function runCorpus(): number {
  let failures = 0;
  let checked = 0;
  for (const kind of ["valid", "invalid"] as const) {
    const expected = kind === "valid";
    for (const file of jsonFilesIn(join(CORPUS, kind))) {
      const doc: unknown = JSON.parse(readFileSync(file, "utf8"));
      const result = validateStatement(doc);
      const ok = result.valid === expected;
      if (!ok) failures++;
      checked++;
      report(
        `${kind}/${file.split("/").pop()}`,
        ok,
        ok
          ? undefined
          : `expected ${expected ? "valid" : "invalid"}, got ${result.valid ? "valid" : "invalid"}`,
      );
    }
  }
  process.stdout.write(
    `\n${checked} record(s) checked, ${failures} disagreement(s).\n` +
      (failures === 0
        ? "This implementation agrees with the corpus.\n"
        : "A disagreement means either an implementation is wrong or the specification\nadmits two readings. The second is the more interesting answer — please report it.\n"),
  );
  return failures === 0 ? 0 : 1;
}

/** Check records the caller names. */
function runFiles(paths: string[]): number {
  let failures = 0;
  for (const path of paths.flatMap(jsonFilesIn)) {
    let doc: unknown;
    try {
      doc = JSON.parse(readFileSync(path, "utf8"));
    } catch (err) {
      failures++;
      report(path, false, `not readable as JSON: ${err instanceof Error ? err.message : err}`);
      continue;
    }
    const result = validateStatement(doc);
    if (result.valid) {
      report(path, true);
    } else {
      failures++;
      report(path, false, result.errors.map((e) => `${e.path}: ${e.message}`).join("\n        "));
    }
  }
  return failures === 0 ? 0 : 1;
}

function main(argv: string[]): number {
  const args = argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    process.stdout.write(USAGE);
    return 0;
  }
  if (args.length === 0 || args.includes("--corpus")) return runCorpus();
  return runFiles(args);
}

process.exit(main(process.argv));
