// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Agonist Development AB
/**
 * Validation of a conformance statement.
 *
 * The schema is only worth something if a third party can check a record
 * without the producer's code. This implementation exists so that claim is
 * demonstrable rather than asserted; it deliberately encodes nothing that the
 * specification does not state, so an independent implementation should agree
 * with it on every input.
 *
 * Errors are returned, not thrown. A caller validating a batch of records
 * wants all the problems at once, and half of them are about honesty rather
 * than syntax — worth reading in full before acting.
 */

import {
  OUTCOMES,
  PREDICATE_TYPE,
  STATEMENT_TYPE,
  type ConformanceStatement,
  type Outcome,
} from "./types.js";

export interface ValidationError {
  /** JSON path to the offending value. */
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
const INDEPENDENCE = new Set(["self", "second-party", "third-party"]);

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function nonEmptyString(v: unknown): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

/**
 * Check a value against the schema.
 *
 * Accepts `unknown` on purpose: a validator whose input must already be the
 * right type is not a validator.
 */
export function validateStatement(value: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const err = (path: string, message: string): void => {
    errors.push({ path, message });
  };

  if (!isRecord(value)) {
    return { valid: false, errors: [{ path: "$", message: "statement must be an object" }] };
  }

  // ── Envelope ─────────────────────────────────────────────────────────────
  if (value._type !== STATEMENT_TYPE) {
    err("$._type", `must be "${STATEMENT_TYPE}"`);
  }
  if (!nonEmptyString(value.predicateType)) {
    err("$.predicateType", "must be a non-empty URI");
  }

  // ── Subject ──────────────────────────────────────────────────────────────
  if (!Array.isArray(value.subject) || value.subject.length === 0) {
    err("$.subject", "must be a non-empty array");
  } else {
    value.subject.forEach((s, i) => {
      const p = `$.subject[${i}]`;
      if (!isRecord(s)) return err(p, "must be an object");
      if (!nonEmptyString(s.name)) err(`${p}.name`, "must be a non-empty string");
      const pinned = isRecord(s.digest) && Object.keys(s.digest).length > 0;
      const unpinned = nonEmptyString(s.unpinned);
      if (!pinned && !unpinned) {
        // The rule that stops a subject being silently unfixed: not every
        // regulated subject has a digest, but the record must say which case
        // it is in.
        err(
          `${p}`,
          "must carry either a digest or an explicit 'unpinned' reason — an absent digest and an impossible one are different facts",
        );
      }
      if (pinned && unpinned) {
        err(`${p}`, "carries both a digest and an 'unpinned' reason; only one can be true");
      }
    });
  }

  // ── Predicate ────────────────────────────────────────────────────────────
  const pred = value.predicate;
  if (!isRecord(pred)) {
    err("$.predicate", "must be an object");
    return { valid: errors.length === 0, errors };
  }

  if (!isRecord(pred.profile)) {
    err("$.predicate.profile", "must be an object naming the axis and its version");
  } else {
    if (!nonEmptyString(pred.profile.id)) err("$.predicate.profile.id", "must be a non-empty string");
    if (!nonEmptyString(pred.profile.version))
      err("$.predicate.profile.version", "must be a non-empty string");
  }

  if (pred.catalogue !== undefined) {
    if (!isRecord(pred.catalogue)) {
      err("$.predicate.catalogue", "must be an object when present");
    } else {
      if (!nonEmptyString(pred.catalogue.id)) err("$.predicate.catalogue.id", "must be a non-empty string");
      if (!nonEmptyString(pred.catalogue.version))
        err("$.predicate.catalogue.version", "must be a non-empty string");
    }
  }

  // ── Assessment ───────────────────────────────────────────────────────────
  if (!Array.isArray(pred.assessment) || pred.assessment.length === 0) {
    err("$.predicate.assessment", "must be a non-empty array");
  } else {
    pred.assessment.forEach((a, i) => {
      const p = `$.predicate.assessment[${i}]`;
      if (!isRecord(a)) return err(p, "must be an object");
      if (!nonEmptyString(a.requirement)) err(`${p}.requirement`, "must be a non-empty string");
      if (!OUTCOMES.includes(a.outcome as Outcome)) {
        err(`${p}.outcome`, `must be one of: ${OUTCOMES.join(", ")}`);
      }
      if (!nonEmptyString(a.rationale)) {
        err(`${p}.rationale`, "must be a non-empty string — an outcome without a reason is not reviewable");
      }
      if (a.exemptionClaimed !== undefined) {
        if (!nonEmptyString(a.exemptionClaimed)) {
          err(`${p}.exemptionClaimed`, "must be a non-empty string when present");
        } else if (a.outcome !== "notApplicable") {
          err(
            `${p}.exemptionClaimed`,
            "an exemption lifts a requirement, so the outcome must be notApplicable",
          );
        }
      }
      if (a.bindingFrom !== undefined && !(typeof a.bindingFrom === "string" && ISO_DATE.test(a.bindingFrom))) {
        err(`${p}.bindingFrom`, "must be an ISO 8601 date (YYYY-MM-DD)");
      }
    });
  }

  // ── Method ───────────────────────────────────────────────────────────────
  if (!isRecord(pred.method)) {
    err("$.predicate.method", "must be an object");
  } else if (!Array.isArray(pred.method.techniques) || pred.method.techniques.length === 0) {
    err("$.predicate.method.techniques", "must be a non-empty array drawn from the profile's vocabulary");
  }

  // ── Limitations — the rule the whole schema exists for ───────────────────
  if (!Array.isArray(pred.limitations) || pred.limitations.length === 0) {
    err(
      "$.predicate.limitations",
      "must be a non-empty array: a record that does not say what it failed to examine is an advertisement, not an assessment",
    );
  } else if (!pred.limitations.every((l) => nonEmptyString(l))) {
    err("$.predicate.limitations", "every limitation must be a non-empty string");
  }

  // ── Assessor ─────────────────────────────────────────────────────────────
  if (!isRecord(pred.assessor)) {
    err("$.predicate.assessor", "must be an object");
  } else {
    if (!nonEmptyString(pred.assessor.name)) err("$.predicate.assessor.name", "must be a non-empty string");
    if (!INDEPENDENCE.has(pred.assessor.independence as string)) {
      err("$.predicate.assessor.independence", "must be one of: self, second-party, third-party");
    }
  }

  // ── Validity ─────────────────────────────────────────────────────────────
  if (!isRecord(pred.validity)) {
    err("$.predicate.validity", "must be an object");
  } else if (!(typeof pred.validity.issued === "string" && ISO_INSTANT.test(pred.validity.issued))) {
    err("$.predicate.validity.issued", "must be an ISO 8601 instant");
  }

  return { valid: errors.length === 0, errors };
}

/** Narrowing wrapper for callers that only need a yes or no. */
export function isConformanceStatement(value: unknown): value is ConformanceStatement {
  return validateStatement(value).valid;
}

/** Whether a statement uses the provisional predicate type shipped here. */
export function usesProvisionalPredicateType(statement: ConformanceStatement): boolean {
  return statement.predicateType === PREDICATE_TYPE;
}
