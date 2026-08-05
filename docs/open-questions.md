# Open questions

## Form coverage

How does a partial form declare which optional Questionnaire items it intentionally
does not expose, without inventing a second form-definition model?

## Prompt equivalence

Control paths prove answer binding but not that bespoke labels and help text
preserve the clinical meaning of `item.text`. Which parts can be linted and which
require human review?

## Dynamic proof

What is the smallest Questionnaire-derived scenario set that gives useful
confidence for arbitrary JavaScript without attempting exhaustive UI exploration?

## Expression languages

Which FHIRPath or CQL subset may compile to client JavaScript, and how does a form
advertise that the remaining rules require server evaluation?

## Repeat scope

How are cross-occurrence calculations and conditions represented when an
expression refers to siblings, parents or aggregates across repeated groups?

## Version binding

How are HTML, compiled runtime code and linter evidence bound to a specific
Questionnaire canonical URL and version so that a changed definition cannot reuse
stale presentation artifacts?

## Publication evidence

Should a published bespoke form carry a signed conformance report, or is running
the linter and scenario suite in CI sufficient?

## Editing and drafts

How are partial drafts and existing responses preserved across server recomputes
without turning browser state into an authoritative answer store?
