// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Agonist Development AB
/**
 * Requirement identifiers, and what they must be able to do.
 *
 * The weak point of every format of this kind is requirements transcribed by
 * hand from the law, which drift from the law at the first amendment. The
 * answer is that a record names a requirement by identifier and never by
 * restated text, and that the identifier resolves to primary source.
 *
 * That answer is only worth anything if the resolution actually exists. This
 * module is the part that can be shared across axes: the grammar of an
 * identifier, and the shape a profile's resolver returns. Resolving is the
 * profile's job — it is the only party that knows its own instrument.
 *
 * Grammar:  <instrument>:<provision>
 *
 *   EU-2024-1689:Art50.1     the AI Act, Article 50(1)
 *   EN301549-3.2.1:9.1.1.1   the accessibility standard, clause 9.1.1.1
 *
 * The instrument segment is deliberately unconstrained beyond its character
 * set. A shared schema that enumerated the world's legal instruments would be
 * wrong the week after it shipped.
 */

/** An identifier split into its two parts. */
export interface RequirementId {
  /** The instrument the requirement lives in. */
  instrument: string;
  /** The provision within it. */
  provision: string;
}

/**
 * Where a requirement can be read, in the words that bind.
 *
 * A resolver returns this and does not fetch. Fetching needs a corpus, a
 * network or both, and a package that quietly acquired either would be a
 * different kind of dependency than its callers agreed to. Saying precisely
 * where to look is the useful, honest half.
 */
export interface RequirementLocation extends RequirementId {
  /** The identifier this was resolved from. */
  requirement: string;
  /** Human-readable name of the instrument. */
  instrumentName: string;
  /**
   * A stable, publisher-assigned identifier for the instrument, where one
   * exists — a CELEX number, a standard's designation. This is what makes the
   * resolution checkable by somebody who has never heard of us.
   */
  citation?: string;
  /** Where the authoritative text is published. */
  sourceUrl?: string;
  /**
   * Where a local corpus serves the validated extract, if the profile has one.
   * A caller holding that corpus can fetch verbatim text; a caller without one
   * still has the published source above.
   */
  corpusUri?: string;
}

/** A profile's resolver: identifier in, location out, nothing fetched. */
export type RequirementResolver = (requirement: string) => RequirementLocation | undefined;

const ID_PATTERN = /^([A-Za-z0-9][A-Za-z0-9.\-_]*):([A-Za-z0-9][A-Za-z0-9.()\-_/]*)$/;

/**
 * Split an identifier, or return undefined if it is not one.
 *
 * Returns rather than throws: a validator walking a record wants to report a
 * malformed identifier alongside everything else wrong with it, not stop.
 */
export function parseRequirementId(requirement: string): RequirementId | undefined {
  const m = ID_PATTERN.exec(requirement.trim());
  if (!m) return undefined;
  return { instrument: m[1]!, provision: m[2]! };
}

/** Join the two parts back into an identifier. */
export function formatRequirementId(id: RequirementId): string {
  return `${id.instrument}:${id.provision}`;
}

/** Whether a string is a well-formed identifier. */
export function isRequirementId(requirement: string): boolean {
  return parseRequirementId(requirement) !== undefined;
}
