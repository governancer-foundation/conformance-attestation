// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Agonist Development AB
/**
 * conformance-attestation — a regulatory-conformance predicate for in-toto.
 *
 * The schema, its outcome vocabulary, the contract a profile must satisfy to
 * plug a regulatory axis into it, and a validator that exists so the claim
 * "a third party can check these records without our code" is demonstrable
 * rather than asserted.
 */

export {
  OUTCOMES,
  PREDICATE_TYPE,
  STATEMENT_TYPE,
  type AssessmentEntry,
  type AssessmentMethod,
  type Assessor,
  type AttestationSubject,
  type ConformancePredicate,
  type ConformanceStatement,
  type Digest,
  type Outcome,
  type ProfileDeclaration,
} from "./types.js";

export {
  formatRequirementId,
  isRequirementId,
  parseRequirementId,
  type RequirementId,
  type RequirementLocation,
  type RequirementResolver,
} from "./requirement.js";

export {
  isConformanceStatement,
  usesProvisionalPredicateType,
  validateStatement,
  type ValidationError,
  type ValidationResult,
} from "./validate.js";
