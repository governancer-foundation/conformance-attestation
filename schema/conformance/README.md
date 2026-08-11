<!--
SPDX-FileCopyrightText: 2026 Agonist Development AB
SPDX-License-Identifier: Apache-2.0
-->

# Conformance suite

Records with known verdicts, so any implementation of the schema can be
checked rather than trusted. Every record here is a complete, literal
statement — no annotations, nothing to strip before use.

Run them against your implementation: everything under `valid/` must pass and
everything under `invalid/` must fail. A disagreement is worth reporting: it
means either an implementation is wrong or the specification admits two
readings, and the second is the more interesting answer.

## Must pass

| Record | Why |
|---|---|
| `exemption-under-not-applicable.json` | An exemption lifts the requirement, so it sits beside notApplicable. |
| `minimal-unpinned-subject.json` | The smallest well-formed record: a subject that cannot be digested, saying so. |
| `pinned-subject.json` | A subject that is an artefact carries a digest and no reason. |
| `unknown-axis-and-vocabulary.json` | The schema accepts an axis and a technique vocabulary it has never heard of; that is what makes it shared. |

## Must fail

| Record | Why |
|---|---|
| `binding-date-not-a-date.json` | a binding date is a calendar date, not an instant. |
| `exemption-under-wrong-outcome.json` | claiming an exemption while claiming support asserts two incompatible things. |
| `no-assessment.json` | a conformance record with nothing assessed asserts nothing. |
| `no-limitations.json` | a record that does not say what it failed to examine is an advertisement. |
| `outcome-without-rationale.json` | an outcome with no reason is not reviewable. |
| `silently-unpinned-subject.json` | an omitted digest and one that was never possible must not look alike. |
| `subject-pinned-and-unpinned.json` | a subject cannot be both fixed and not fixed. |
| `unknown-outcome.json` | the outcome vocabulary is closed. |
