# Decision register

## Presentation rather than another model

HTML is the UI representation. The specification adds a binding layer, not a new
JSON UI schema. Questionnaire remains the semantic authority.

## Conformance by contract

A form is a rendering because its controls and behavior conform, not because a
particular renderer generated it. Bespoke and generic forms have equal standing.

## One canonical path grammar

`item[linkId][index].component` addresses items, occurrences and FHIR value
components. Child items use explicit `.item[linkId]` steps. Paths are resolved
against the Questionnaire rather than merged into an inferred object shape.

## Ordered entry lists

The Collector consumes browser form entries without first converting them to an
object. This preserves duplicate detection, document order, files and repeated
values.

## Strict server collection

The Collector validates structure and values against the Questionnaire. Unknown
fields, invalid ancestry, unsupported components and cardinality conflicts are
issues rather than ignored input.

## Shared binding kernel

Collector, linter, runtime and renderer share path resolution, type binding and
rule semantics. Parallel implementations of those rules are not acceptable
component boundaries.

## Lint plus runtime verification

The linter proves structural equivalence where possible. Arbitrary dynamic
behavior is verified through browser scenarios and real collection rather than
declared equivalent from one DOM snapshot.

## Dual reactive execution

Rules may compile to client JavaScript or execute through server re-rendering.
Selection is per rule, the compiler may refuse, and server evaluation remains the
authority on collection.

## Optional renderer

A renderer is convenience tooling and a reference producer. The presentation
layer can be used by a hand-written form with only the linter, runtime and
Collector.

## Generated source is project-owned

The Scaffold Generator is a one-time semantic bootstrap, like an application
scaffold. Generated HTML becomes ordinary project source and may be redesigned
by developers or agents. Regeneration does not own or merge bespoke markup and
must not overwrite an existing file without an explicit force operation.
