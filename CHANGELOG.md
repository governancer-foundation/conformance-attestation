<!--
SPDX-FileCopyrightText: 2026 Agonist Development AB
SPDX-License-Identifier: Apache-2.0
-->

# Changelog

Notable changes to `@governancer-foundation/conformance-attestation`, newest first. Versions follow
[Semantic Versioning](https://semver.org/); before 1.0 a minor version may add,
and does not break.

## Unreleased

### Added

- A command-line checker. Point it at your records, or run it with no arguments
  to put the shipped conformance corpus through this implementation — which is
  how somebody with their own validator finds out where it disagrees.

## 0.1.0 — 2026-08-11

First release.

### Added

- The conformance predicate: what was assessed, against which requirements, by
  what method, under what limitations. Axis-agnostic — a regulatory axis plugs
  in as a profile rather than appearing as a field.
- A validator, shipped with the schema so the claim that a third party can check
  these records without the producer's code is demonstrable rather than asserted.
- A machine-readable schema and a corpus of records with known verdicts. The
  suite checks the two implementations against each other; a disagreement means
  the specification admits two readings.
- A published change procedure, before a second profile exists.

### Compatibility

The predicate type URI is **provisional**. A predicate type must be stable, and
the neutral home this schema should live under is not settled. It will change
exactly once, as a major version, with both URIs documented. Pin your own if you
need stability today.
