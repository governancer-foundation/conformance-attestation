// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Agonist Development AB
/**
 * The conformance suite, and the cross-check that gives it meaning.
 *
 * The specification claims a third party can verify these records without the
 * producer's code. Two things are needed for that to be more than a sentence:
 * a machine-readable schema, and a corpus of records with known verdicts that
 * any implementation can be run against.
 *
 * Both are shipped, and this file checks the pair against each other. The
 * hand-written validator and the JSON Schema are two independent expressions
 * of the same rules; every fixture is put through both, and they must agree.
 * Where they disagree, the specification is ambiguous — which is exactly the
 * kind of defect a second implementation is supposed to surface, and better
 * found here than by whoever writes the third one.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import type { AnySchema } from "ajv";
import addFormats from "ajv-formats";
import { describe, expect, it } from "vitest";

import { validateStatement } from "../src/validate.js";

const SCHEMA_DIR = new URL("../schema", import.meta.url).pathname;
const FIXTURES = join(SCHEMA_DIR, "conformance");

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

function fixtures(kind: "valid" | "invalid"): { name: string; doc: unknown }[] {
  const dir = join(FIXTURES, kind);
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => ({ name: f.replace(/\.json$/, ""), doc: readJson(join(dir, f)) }));
}

const ajv = new Ajv2020({ strict: false, allErrors: true });
addFormats(ajv);
ajv.addSchema(readJson(join(SCHEMA_DIR, "conformance-predicate-v0.1.schema.json")) as AnySchema);
const bySchema = ajv.compile(
  readJson(join(SCHEMA_DIR, "conformance-statement-v0.1.schema.json")) as AnySchema,
);

describe("the shipped schema is loadable and self-consistent", () => {
  it("compiles", () => {
    expect(typeof bySchema).toBe("function");
  });

  it("ships fixtures on both sides of the line", () => {
    expect(fixtures("valid").length).toBeGreaterThan(0);
    expect(fixtures("invalid").length).toBeGreaterThan(0);
  });
});

describe.each(fixtures("valid"))("valid fixture: $name", ({ doc }) => {
  it("passes the validator", () => {
    expect(validateStatement(doc).errors).toEqual([]);
  });

  it("passes the JSON Schema", () => {
    const ok = bySchema(doc);
    expect(ok, JSON.stringify(bySchema.errors)).toBe(true);
  });
});

describe.each(fixtures("invalid"))("invalid fixture: $name", ({ doc }) => {
  it("fails the validator", () => {
    expect(validateStatement(doc).valid).toBe(false);
  });

  it("fails the JSON Schema", () => {
    expect(bySchema(doc)).toBe(false);
  });
});

describe("the two implementations agree", () => {
  it("reaches the same verdict on every fixture", () => {
    // The point of the exercise. A disagreement means the specification admits
    // two readings, and that is a defect in the specification rather than in
    // either implementation.
    const disagreements: string[] = [];
    for (const kind of ["valid", "invalid"] as const) {
      for (const { name, doc } of fixtures(kind)) {
        const byCode = validateStatement(doc).valid;
        const bySchemaOk = bySchema(doc) as boolean;
        if (byCode !== bySchemaOk) {
          disagreements.push(`${kind}/${name}: validator=${byCode} schema=${bySchemaOk}`);
        }
      }
    }
    expect(disagreements).toEqual([]);
  });
});
