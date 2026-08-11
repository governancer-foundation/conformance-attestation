// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Agonist Development AB
/**
 * A regulatory-conformance predicate for in-toto attestations.
 *
 * The supply-chain ecosystem settled the envelope, the signature and the
 * verification path years ago. Build provenance, component inventories and
 * vulnerability exploitability all travel as in-toto statements signed with
 * DSSE. Between them they answer what a thing is made of, who built it, and
 * which vulnerabilities apply to it. None of them answers **which regulatory
 * requirements it meets and on what evidence**.
 *
 * This schema is that missing predicate. It is deliberately not a new envelope:
 * anything that already verifies in-toto statements accepts these unchanged.
 *
 * ── What the schema knows, and what it refuses to know ─────────────────────
 *
 * It knows four things: what was assessed, against which body of requirements,
 * by what method, and under what limitations. It knows nothing about
 * accessibility, artificial intelligence or carbon, because a regulatory axis
 * is a **profile** plugged into it rather than a field inside it. Adding an
 * axis must not require changing this file.
 *
 * ── The rule that makes it honest ──────────────────────────────────────────
 *
 * A record without an explicit statement of what was NOT examined is invalid.
 * That single requirement is the difference between a machine-readable
 * assessment and a marketing claim, and it is enforced, not encouraged.
 *
 * @see https://github.com/in-toto/attestation
 */

/** Statement type, fixed by the framework. */
export const STATEMENT_TYPE = "https://in-toto.io/Statement/v1";

/**
 * Predicate type URI.
 *
 * PROVISIONAL, and known to be. A predicate type must be a stable URI, and the
 * neutral home this schema should live under is not yet settled — publishing it
 * under any one product's domain would tie a deliberately neutral schema to a
 * single brand for good. Consumers who need stability today should pin their
 * own and treat this as a placeholder that will change exactly once.
 */
export const PREDICATE_TYPE = "urn:conformance-attestation:v0.1";

/**
 * Outcome vocabulary, shared across every axis.
 *
 * Borrowed from the accessibility conformance report vocabulary that public
 * procurement already reads, plus one value that vocabulary lacks.
 *
 * `notEvaluated` is that addition, and it is load-bearing rather than
 * cosmetic. Without it, "we did not look at this" is indistinguishable from
 * "this passed" — tolerable in a document a human reads with judgement,
 * unacceptable in a record a machine consumes.
 *
 * Note for profile authors: these values describe whether something *supports*
 * a requirement, which fits a capability (a control is operable by keyboard, or
 * partly, or not) better than it fits a duty (you either told the user they
 * were talking to a machine, or you did not). A profile whose requirements are
 * duties MUST document how it maps them onto these values — see
 * {@link ProfileDeclaration.outcomeMapping}. Two profiles disagreeing about
 * what `partiallySupports` means would make the shared vocabulary worthless.
 */
export type Outcome =
  | "supports"
  | "partiallySupports"
  | "doesNotSupport"
  | "notApplicable"
  | "notEvaluated";

export const OUTCOMES: readonly Outcome[] = [
  "supports",
  "partiallySupports",
  "doesNotSupport",
  "notApplicable",
  "notEvaluated",
] as const;

/** A cryptographic digest, keyed by algorithm. */
export type Digest = Record<string, string>;

/**
 * What the assessment is about.
 *
 * in-toto is built for artefacts: a package, an image, a commit — things with
 * a digest. Not every regulated subject is one. A website changes between
 * requests; an obligation to disclose attaches to a deployed system's
 * behaviour, and an obligation to mark output attaches to output that does not
 * exist yet. There is nothing to hash, and hashing something anyway would tell
 * a verifier the subject was fixed when it is not.
 *
 * So a subject is either pinned by digest or **explicitly unpinned with a
 * reason**. What it may not be is silently unpinned: an omitted digest and a
 * digest that was never possible are different facts, and a reader has to be
 * able to tell them apart.
 */
export interface AttestationSubject {
  name: string;
  digest?: Digest;
  /**
   * Why this subject carries no digest. Required when `digest` is absent.
   */
  unpinned?: string;
}

/** One requirement, assessed. */
export interface AssessmentEntry {
  /**
   * Requirement identifier, drawn from the profile's catalogue where it has
   * one, or resolving to primary source on its own where it does not.
   */
  requirement: string;
  outcome: Outcome;
  /** Why the outcome is what it is. Free prose, addressed to a human reviewer. */
  rationale: string;
  /**
   * The exemption relied on, where the outcome rests on one.
   *
   * Separate from `rationale`, and separate from `notApplicable`, because a
   * requirement that never reached the subject and a requirement lifted by an
   * exemption the assessor *claims* are different in the way that matters: the
   * second is an assertion that can be false, and a wrongly claimed exemption
   * is usually where the liability sits. A reviewer must be able to find every
   * such claim by querying a field, not by reading prose.
   */
  exemptionClaimed?: string;
  /**
   * The date this requirement begins to bind this subject (ISO 8601).
   *
   * Distinct from `validity`, which describes the record. A requirement can
   * have its own start date: transitional provisions are the norm rather than
   * the exception, and a record asserting conformance with a duty that has not
   * yet begun says less than it appears to.
   */
  bindingFrom?: string;
  /** Evidence supporting the outcome. */
  evidence?: { name: string; digest?: Digest }[];
}

/** How the assessment was carried out. */
export interface AssessmentMethod {
  /**
   * Techniques used, drawn from the vocabulary the profile declares.
   *
   * Deliberately not a fixed shared list. The obvious candidates —
   * automated scanning, keyboard traversal, screen-reader review, testing with
   * users — describe how one observes a running interface, and an assessment
   * made by reading a declared description of a system fits none of them. A
   * vocabulary that only suits the axis it was written for is not shared.
   */
  techniques: string[];
  tools?: { name: string; version?: string; ruleset?: string; rulesetDigest?: Digest }[];
  coverage?: { surfaces?: number; sampling?: string };
}

/** Who made the assessment, and how independent they were of the subject. */
export interface Assessor {
  name: string;
  independence: "self" | "second-party" | "third-party";
}

export interface ConformancePredicate {
  /** The axis, and the version of the profile that interprets this payload. */
  profile: { id: string; version: string };
  /**
   * The requirement catalogue, where the profile uses one.
   *
   * Optional. A versioned catalogue artefact with a digest earns its keep for
   * hundreds of criteria that are amended over time; for a handful of
   * paragraphs in a single article it is overhead, and an identifier naming the
   * instrument and the provision is already unambiguous and resolvable.
   */
  catalogue?: { id: string; version: string; digest?: Digest };
  assessment: AssessmentEntry[];
  method: AssessmentMethod;
  scope?: { surfaces?: string[]; excluded?: string[] };
  /**
   * What this assessment did not examine.
   *
   * Mandatory and non-empty. This is the field that separates an assessment
   * from an advertisement, and the schema refuses records without it rather
   * than treating it as good practice.
   */
  limitations: string[];
  assessor: Assessor;
  validity: { issued: string; expires?: string; supersedes?: string };
}

export interface ConformanceStatement {
  _type: typeof STATEMENT_TYPE;
  subject: AttestationSubject[];
  predicateType: string;
  predicate: ConformancePredicate;
}

/**
 * What a profile must declare to plug an axis into this schema.
 *
 * Published as data rather than prose so the obligations of a profile author
 * are checkable rather than aspirational.
 */
export interface ProfileDeclaration {
  /** Stable profile identifier, e.g. "ai-act/art-50". */
  id: string;
  version: string;
  /** Human-readable name of the body of requirements. */
  requirements: string;
  /** The technique vocabulary this profile permits in `method.techniques`. */
  techniques: string[];
  /**
   * How this profile's requirements map onto the shared outcome vocabulary.
   *
   * Required. See the note on {@link Outcome}: the vocabulary is
   * capability-shaped, and a profile whose requirements are duties has to say
   * what it means by each value before anyone can compare its records with
   * another profile's.
   */
  outcomeMapping: Partial<Record<Outcome, string>>;
}
