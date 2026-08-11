// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Agonist Development AB
/**
 * Validation of a conformance statement.
 *
 * Each case names the rule it exercises. The rules that carry weight are the
 * ones about honesty rather than syntax — a missing limitations list, a
 * silently unpinned subject, an exemption claimed under the wrong outcome —
 * and those get both sides tested.
 */
import { describe, expect, it } from "vitest";

import { PREDICATE_TYPE, STATEMENT_TYPE, type ConformanceStatement } from "../src/types.js";
import { isConformanceStatement, validateStatement } from "../src/validate.js";

function valid(): ConformanceStatement {
  return {
    _type: STATEMENT_TYPE,
    subject: [{ name: "support-bot", unpinned: "A deployed service has no artefact digest." }],
    predicateType: PREDICATE_TYPE,
    predicate: {
      profile: { id: "ai-act/art-50", version: "0.1" },
      assessment: [
        {
          requirement: "EU-2024-1689:Art50.1",
          outcome: "notEvaluated",
          rationale: "The system interacts directly with natural persons.",
          bindingFrom: "2026-08-02",
        },
      ],
      method: { techniques: ["declaredSystemDescription"] },
      limitations: ["Whether the disclosure was actually shown is not assessed."],
      assessor: { name: "Agonist Development AB", independence: "self" },
      validity: { issued: "2026-08-11T00:00:00.000Z" },
    },
  };
}

function paths(v: unknown): string[] {
  return validateStatement(v).errors.map((e) => e.path);
}

describe("a well-formed record", () => {
  it("passes", () => {
    const r = validateStatement(valid());
    expect(r.errors).toEqual([]);
    expect(r.valid).toBe(true);
  });

  it("narrows through the type guard", () => {
    expect(isConformanceStatement(valid())).toBe(true);
  });

  it("rejects a non-object without throwing", () => {
    for (const v of [null, undefined, 42, "x", []]) {
      expect(validateStatement(v).valid).toBe(false);
    }
  });
});

describe("the limitations rule", () => {
  it("rejects a record with no limitations", () => {
    const s = valid();
    s.predicate.limitations = [];
    expect(paths(s)).toContain("$.predicate.limitations");
  });

  it("says why, in terms a reader can act on", () => {
    const s = valid();
    s.predicate.limitations = [];
    const msg = validateStatement(s).errors.find(
      (e) => e.path === "$.predicate.limitations",
    )?.message;
    expect(msg).toMatch(/advertisement, not an assessment/i);
  });

  it("rejects a limitation that is only whitespace", () => {
    const s = valid();
    s.predicate.limitations = ["  "];
    expect(paths(s)).toContain("$.predicate.limitations");
  });
});

describe("the subject rule", () => {
  it("accepts a subject pinned by digest", () => {
    const s = valid();
    s.subject = [{ name: "clip.mp4", digest: { sha256: "abc" } }];
    expect(validateStatement(s).valid).toBe(true);
  });

  it("accepts a subject explicitly unpinned with a reason", () => {
    expect(validateStatement(valid()).valid).toBe(true);
  });

  it("rejects a subject that is silently unpinned", () => {
    // The point of the rule: an omitted digest and a digest that was never
    // possible are different facts.
    const s = valid();
    s.subject = [{ name: "support-bot" }];
    expect(paths(s)).toContain("$.subject[0]");
  });

  it("rejects a subject claiming both a digest and an unpinned reason", () => {
    const s = valid();
    s.subject = [{ name: "x", digest: { sha256: "abc" }, unpinned: "also unpinned" }];
    expect(paths(s)).toContain("$.subject[0]");
  });

  it("rejects an empty subject list", () => {
    const s = valid();
    s.subject = [];
    expect(paths(s)).toContain("$.subject");
  });
});

describe("the exemption rule", () => {
  it("accepts an exemption under a not-applicable outcome", () => {
    const s = valid();
    s.predicate.assessment[0] = {
      requirement: "EU-2024-1689:Art50.1",
      outcome: "notApplicable",
      rationale: "Law-enforcement exemption claimed.",
      exemptionClaimed: "Use authorised by law to investigate criminal offences.",
    };
    expect(validateStatement(s).valid).toBe(true);
  });

  it("rejects an exemption under any other outcome", () => {
    // An exemption lifts a requirement. Claiming one beside "supports" would
    // assert two incompatible things at once.
    const s = valid();
    s.predicate.assessment[0] = {
      requirement: "EU-2024-1689:Art50.1",
      outcome: "supports",
      rationale: "…",
      exemptionClaimed: "Something.",
    };
    expect(paths(s)).toContain("$.predicate.assessment[0].exemptionClaimed");
  });
});

describe("assessment entries", () => {
  it("rejects an unknown outcome", () => {
    const s = valid();
    (s.predicate.assessment[0] as { outcome: string }).outcome = "mostlyFine";
    expect(paths(s)).toContain("$.predicate.assessment[0].outcome");
  });

  it("rejects an outcome with no rationale", () => {
    const s = valid();
    s.predicate.assessment[0]!.rationale = "";
    const msg = validateStatement(s).errors.find(
      (e) => e.path === "$.predicate.assessment[0].rationale",
    )?.message;
    expect(msg).toMatch(/not reviewable/i);
  });

  it("rejects a binding date that is not a plain ISO date", () => {
    const s = valid();
    s.predicate.assessment[0]!.bindingFrom = "2026-08-02T00:00:00Z";
    expect(paths(s)).toContain("$.predicate.assessment[0].bindingFrom");
  });

  it("rejects an empty assessment list", () => {
    const s = valid();
    s.predicate.assessment = [];
    expect(paths(s)).toContain("$.predicate.assessment");
  });
});

describe("method, assessor and validity", () => {
  it("rejects an empty technique list", () => {
    const s = valid();
    s.predicate.method.techniques = [];
    expect(paths(s)).toContain("$.predicate.method.techniques");
  });

  it("accepts a technique vocabulary this schema has never heard of", () => {
    // The vocabulary belongs to the profile. A shared list would only ever fit
    // the axis it was written for.
    const s = valid();
    s.predicate.method.techniques = ["carbonLedgerReconciliation"];
    expect(validateStatement(s).valid).toBe(true);
  });

  it("rejects an unknown independence value", () => {
    const s = valid();
    (s.predicate.assessor as { independence: string }).independence = "very";
    expect(paths(s)).toContain("$.predicate.assessor.independence");
  });

  it("rejects an issued value that is not an instant", () => {
    const s = valid();
    s.predicate.validity.issued = "2026-08-11";
    expect(paths(s)).toContain("$.predicate.validity.issued");
  });
});

describe("the optional catalogue", () => {
  it("accepts a record with no catalogue", () => {
    // Right for hundreds of amended criteria, overhead for six paragraphs of
    // one article whose identifiers already resolve on their own.
    expect(validateStatement(valid()).valid).toBe(true);
  });

  it("accepts a well-formed catalogue", () => {
    const s = valid();
    s.predicate.catalogue = { id: "en301549", version: "3.2.1", digest: { sha256: "abc" } };
    expect(validateStatement(s).valid).toBe(true);
  });

  it("rejects a catalogue missing its version", () => {
    const s = valid();
    (s.predicate as { catalogue: unknown }).catalogue = { id: "en301549" };
    expect(paths(s)).toContain("$.predicate.catalogue.version");
  });
});

describe("reporting", () => {
  it("returns every problem at once rather than the first", () => {
    const broken = {
      _type: "wrong",
      subject: [],
      predicateType: "",
      predicate: {
        profile: {},
        assessment: [],
        method: {},
        limitations: [],
        assessor: {},
        validity: {},
      },
    };
    expect(validateStatement(broken).errors.length).toBeGreaterThanOrEqual(8);
  });
});
