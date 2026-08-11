# @governancer-foundation/conformance-attestation

> Which regulatory requirements a thing meets, on what evidence, and — mandatorily — what was not examined. As an in-toto predicate, not a new envelope.

The software supply-chain ecosystem settled the envelope, the signature and the
verification path years ago. Build provenance, component inventories and
vulnerability exploitability all travel as in-toto statements signed with DSSE.
Between them they answer what a thing is made of, who built it, and which
vulnerabilities apply to it.

None of them answers **which regulatory requirements it meets**. This is that
missing predicate. Anything that already verifies in-toto statements accepts
these records unchanged.

## What it knows, and what it refuses to know

Four things: what was assessed, against which body of requirements, by what
method, and under what limitations. Nothing about accessibility, artificial
intelligence or carbon — a regulatory axis plugs in as a **profile** rather
than appearing as a field, so adding one never changes this schema.

## The rule the schema exists for

**A record that does not say what it failed to examine is invalid.** Not
discouraged — rejected. That single requirement is the difference between a
machine-readable assessment and an advertisement, and it is why the outcome
vocabulary carries a `notEvaluated` value that the conformance-report
vocabulary it borrows from lacks: without it, "we did not look" and "it passed"
are indistinguishable.

Two more rules follow the same instinct:

- **A subject is pinned by digest or explicitly unpinned with a reason.** Not
  every regulated subject is an artefact — a service changes between requests,
  and a duty to mark output attaches to output that does not exist yet. An
  omitted digest and an impossible one are different facts, and a reader has to
  be able to tell them apart.
- **An exemption claimed is a field, not prose.** A requirement that never
  reached the subject and one lifted by an exemption the assessor claims look
  identical in a single "not applicable" value. The second is an assertion that
  can be false, and that is usually where liability sits.

## Use

```bash
npm install @governancer-foundation/conformance-attestation
```

```ts
import { validateStatement } from "@governancer-foundation/conformance-attestation";

const result = validateStatement(record);
result.valid;   // boolean
result.errors;  // [{ path: "$.predicate.limitations", message: "…" }]
```

Errors are returned rather than thrown, and all of them at once: a caller
checking a batch wants the whole picture, and half the rules are about honesty
rather than syntax.

## Writing a profile

A profile declares the requirements it covers, the technique vocabulary it
permits, and — required — **how its requirements map onto the shared outcome
vocabulary**. That vocabulary is capability-shaped: it fits "is this control
operable by keyboard" better than "did you tell the user they were talking to a
machine". A profile whose requirements are duties has to say what it means by
each value, or its records cannot be compared with anyone else's.

Known profiles:

| Profile | Requirements | Implemented in |
|---|---|---|
| `ai-act/art-50` | EU AI Act, Article 50 | [`art50-disclosure-sdk`](https://github.com/governancer-foundation/art50-disclosure-sdk) |

## Status

v0.1. **The predicate type URI shipped here is provisional and known to be.**
A predicate type must be stable, and the neutral home this schema should live
under is not settled — publishing it under one product's domain would tie a
deliberately neutral schema to a single brand. Pin your own if you need
stability today; this one will change exactly once.

This package is intended to move to a neutral home with its own change
procedure. A format governed by one company is a format nobody else writes a
profile for.

## License

**Apache-2.0** (see [`LICENSE`](./LICENSE) and [`NOTICE`](./NOTICE)).

---

Maintained by **Alexander Brichkin (Agonist Development AB)**.
