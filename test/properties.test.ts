// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Agonist Development AB
/**
 * Invariants of the validator, across records nobody would write by hand.
 *
 * The fixture corpus covers the rules a reader needs explained. These cover the
 * shape of the validator itself: that it never throws whatever it is handed,
 * that its two rules about honesty hold for every record rather than the ones
 * we thought of, and that a valid record stays valid when an optional field is
 * added — the property a schema has to have if anyone is to build on it.
 */
import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { OUTCOMES, PREDICATE_TYPE, STATEMENT_TYPE } from "../src/types.js";
import { validateStatement } from "../src/validate.js";

/**
 * A string that carries information.
 *
 * The specification requires a non-blank value wherever it requires a string:
 * a rationale of one space is not a rationale. A generator that emits
 * whitespace is testing the wrong thing — and it found the schema disagreeing
 * with the validator on exactly that, which is why the rule is now in both.
 */
const meaningful = (max: number): fc.Arbitrary<string> =>
  fc.string({ minLength: 1, maxLength: max }).map((s) => s.replace(/\s/g, "x")).filter((s) => s.trim().length > 0);

const arbDigest = (): fc.Arbitrary<Record<string, string>> =>
  fc.dictionary(fc.constantFrom("sha256", "sha512"), fc.string({ unit: "grapheme-ascii", minLength: 8, maxLength: 64 }), {
    minKeys: 1,
  });

const arbSubject = (): fc.Arbitrary<Record<string, unknown>> =>
  fc.oneof(
    fc.record({ name: meaningful(30), digest: arbDigest() }),
    fc.record({
      name: meaningful(30),
      unpinned: meaningful(60),
    }),
  );

const arbEntry = (): fc.Arbitrary<Record<string, unknown>> =>
  fc
    .record({
      requirement: meaningful(40),
      outcome: fc.constantFrom(...OUTCOMES),
      rationale: meaningful(80),
    })
    .map((e) => e as Record<string, unknown>);

const arbValid = (): fc.Arbitrary<Record<string, unknown>> =>
  fc.record({
    _type: fc.constant(STATEMENT_TYPE),
    subject: fc.array(arbSubject(), { minLength: 1, maxLength: 3 }),
    predicateType: fc.constant(PREDICATE_TYPE),
    predicate: fc.record({
      profile: fc.record({
        id: meaningful(20),
        version: meaningful(8),
      }),
      assessment: fc.array(arbEntry(), { minLength: 1, maxLength: 5 }),
      method: fc.record({
        techniques: fc.array(meaningful(20), { minLength: 1, maxLength: 3 }),
      }),
      limitations: fc.array(meaningful(60), { minLength: 1, maxLength: 4 }),
      assessor: fc.record({
        name: meaningful(30),
        independence: fc.constantFrom("self", "second-party", "third-party"),
      }),
      validity: fc.record({ issued: fc.constant("2026-08-12T00:00:00.000Z") }),
    }),
  });

describe("the validator never throws", () => {
  it("whatever it is handed", () => {
    // A validator that crashes on hostile input has moved the problem rather
    // than solved it: the caller checking a batch loses the whole batch.
    fc.assert(
      fc.property(fc.anything(), (value) => {
        expect(() => validateStatement(value)).not.toThrow();
      }),
      { numRuns: 500 },
    );
  });

  it("and always answers with a verdict and a list", () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        const r = validateStatement(value);
        expect(typeof r.valid).toBe("boolean");
        expect(Array.isArray(r.errors)).toBe(true);
        expect(r.valid).toBe(r.errors.length === 0);
      }),
      { numRuns: 500 },
    );
  });
});

describe("a well-formed record stays well-formed", () => {
  it("for any shape the schema permits", () => {
    fc.assert(
      fc.property(arbValid(), (record) => {
        expect(validateStatement(record).errors).toEqual([]);
      }),
      { numRuns: 300 },
    );
  });

  it("when an optional field is added", () => {
    // Growth without breakage is the property a schema must have before anyone
    // will build a second profile on it.
    fc.assert(
      fc.property(arbValid(), meaningful(40), (record, note) => {
        const grown = structuredClone(record) as { predicate: Record<string, unknown> };
        grown.predicate.scope = { excluded: [note] };
        expect(validateStatement(grown).errors).toEqual([]);
      }),
    );
  });
});

describe("the two rules about honesty hold for every record", () => {
  it("no record without limitations is ever accepted", () => {
    fc.assert(
      fc.property(arbValid(), (record) => {
        const stripped = structuredClone(record) as { predicate: Record<string, unknown> };
        stripped.predicate.limitations = [];
        const r = validateStatement(stripped);
        expect(r.valid).toBe(false);
        expect(r.errors.some((e) => e.path === "$.predicate.limitations")).toBe(true);
      }),
    );
  });

  it("no silently unpinned subject is ever accepted", () => {
    fc.assert(
      fc.property(arbValid(), (record) => {
        const stripped = structuredClone(record) as { subject: Record<string, unknown>[] };
        stripped.subject = stripped.subject.map((s) => ({ name: s.name }));
        expect(validateStatement(stripped).valid).toBe(false);
      }),
    );
  });

  it("an exemption is never accepted beside an outcome that is not notApplicable", () => {
    fc.assert(
      fc.property(
        arbValid(),
        fc.constantFrom(...OUTCOMES.filter((o) => o !== "notApplicable")),
        (record, outcome) => {
          const bent = structuredClone(record) as {
            predicate: { assessment: Record<string, unknown>[] };
          };
          bent.predicate.assessment[0] = {
            ...bent.predicate.assessment[0],
            outcome,
            exemptionClaimed: "claimed",
          };
          expect(validateStatement(bent).valid).toBe(false);
        },
      ),
    );
  });
});
