<!--
SPDX-FileCopyrightText: 2026 Agonist Development AB
SPDX-License-Identifier: Apache-2.0
-->

# Governance

A format governed by one company is a format nobody else writes a profile for.
This document exists before the second profile does, on purpose: a change
procedure published after other people depend on you is not a procedure, it is
an announcement.

## What is being governed

Three things, with different stability promises:

| | What it is | Changes how |
|---|---|---|
| **The predicate schema** | the shape of a conformance record | by the process below |
| **The outcome vocabulary** | the five values an assessment may report | by the process below, and reluctantly — every profile and every consumer reads it |
| **A profile** | one regulatory axis: its requirements, techniques and outcome mapping | by whoever maintains that axis, without asking anyone here |

The third line is the important one. A profile is not approved, reviewed or
blessed by this project. If your axis fits the schema, write the profile, ship
it, and open an issue asking to be listed. Nothing about that path runs through
a maintainer here, and it is meant not to.

## Proposing a change to the schema

Open an issue that answers three questions, and no others:

1. **What record can you not express?** A concrete case, with the record you
   would write if the schema allowed it. Not a category of case — one.
2. **What does the reader lose without it?** Somebody consumes these records to
   decide something. Say what they decide wrongly today.
3. **Which profile needs it?** A field wanted by no existing axis is a field
   nobody will fill in correctly.

That is the whole bar. Proposals that arrive with a failing record and a reader
who is misled by it get taken seriously regardless of who sends them.

## How a change is decided

While there is one maintainer, that maintainer decides, and says why in the
issue. This is stated plainly rather than dressed up: a single maintainer with
an honest process is more useful than a committee that does not exist.

That arrangement expires on its own terms. **From the second independently
maintained profile onward, a schema change needs the agreement of the
maintainers of every shipped profile**, because a change to the shared part is
a change to their records. The list of shipped profiles is in the README, and
it is the list that decides.

## What compatibility means here

- **Adding an optional field** is a minor version. Existing records stay valid.
- **Making an optional field required, removing a field, or changing what a
  value means** is a major version and a new predicate type URI. Records under
  the old URI stay readable forever; nothing is retroactively invalidated.
- **The predicate type URI is the compatibility boundary.** A consumer that
  understands one URI can refuse another it does not know, which is the whole
  reason the framework puts a type on the payload.

The URI shipped today is provisional and marked as such. It will change exactly
once, when a neutral home is settled, and that change will be a major version
with both URIs documented.

## What will not change

Two rules are not up for negotiation, because removing either turns the format
into something else:

- **A record that does not say what it failed to examine is invalid.** This is
  the entire difference between an assessment and an advertisement.
- **A subject is pinned by digest or explicitly unpinned with a reason.** An
  omitted digest and one that was never possible are different facts, and a
  reader must be able to tell them apart.

A proposal to relax either will be declined, and the reason is here so nobody
has to spend an issue finding out.

## Adding a profile to the list

Open a pull request adding a row to the README table. What is checked: the
profile ships a declaration as data, its records pass the conformance suite,
and its outcome mapping says what it means by each value it uses. What is not
checked: whether we agree with its reading of its own law. That is its
maintainer's responsibility and its maintainer's name on it.

## Security

See [`SECURITY.md`](./SECURITY.md). A wrong verdict from the validator is a
security issue in the sense that matters here, even though no memory is
corrupted — it is what a downstream decision rests on.

## Update history

| Version | Date | What changed |
|---|---|---|
| 1.0 | 2026-08-11 | Initial. Published before the second profile exists, so the process is a commitment rather than a description of what already happened. |
