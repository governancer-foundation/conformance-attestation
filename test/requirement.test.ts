// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Agonist Development AB
/**
 * The identifier grammar — the part of "requirements resolve to primary
 * source" that can be shared across axes.
 */
import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  formatRequirementId,
  isRequirementId,
  parseRequirementId,
} from "../src/requirement.js";

describe("parsing", () => {
  it("splits an instrument from a provision", () => {
    expect(parseRequirementId("EU-2024-1689:Art50.1")).toEqual({
      instrument: "EU-2024-1689",
      provision: "Art50.1",
    });
  });

  it("accepts an instrument it has never heard of", () => {
    // A shared schema enumerating the world's legal instruments would be wrong
    // the week after it shipped.
    expect(parseRequirementId("EN301549-3.2.1:9.1.1.1")?.instrument).toBe("EN301549-3.2.1");
    expect(parseRequirementId("ISO-5230:4.1")?.provision).toBe("4.1");
  });

  it("keeps a provision's own punctuation", () => {
    expect(parseRequirementId("EU-2024-1689:Art6(1)(a)")?.provision).toBe("Art6(1)(a)");
    expect(parseRequirementId("CFR-45:164.504/e")?.provision).toBe("164.504/e");
  });

  it("tolerates surrounding whitespace", () => {
    expect(parseRequirementId("  EU-2024-1689:Art50.1  ")?.provision).toBe("Art50.1");
  });

  it("returns nothing rather than throwing on a malformed identifier", () => {
    // A validator walking a record wants to report this alongside everything
    // else that is wrong, not stop at it.
    for (const bad of ["", ":", "no-colon", "EU-2024-1689:", ":Art50.1", "a:b:c", " : "]) {
      expect(parseRequirementId(bad), bad).toBeUndefined();
    }
  });

  it("never throws, whatever it is given", () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        expect(() => parseRequirementId(s)).not.toThrow();
      }),
      { numRuns: 500 },
    );
  });
});

describe("round-tripping", () => {
  it("formats back to what was parsed", () => {
    for (const id of ["EU-2024-1689:Art50.1", "EN301549-3.2.1:9.1.1.1", "ISO-5230:4.1"]) {
      expect(formatRequirementId(parseRequirementId(id)!)).toBe(id);
    }
  });

  it("round-trips any identifier it accepts", () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        const parsed = parseRequirementId(s);
        if (!parsed) return;
        expect(parseRequirementId(formatRequirementId(parsed))).toEqual(parsed);
      }),
      { numRuns: 500 },
    );
  });

  it("agrees with the predicate", () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        expect(isRequirementId(s)).toBe(parseRequirementId(s) !== undefined);
      }),
      { numRuns: 300 },
    );
  });
});
