# Form linter

The Form Linter checks whether an HTML form is a valid presentation of a
Questionnaire before a user submits it.

```ts
lint({ questionnaire, document, runtime })
  -> { findings, coverage, unverified }
```

It uses the same path resolver and type registry as the Collector. It does not
reimplement the contract with CSS selectors and naming heuristics.

## Structural checks

For controls in the current DOM and trusted repeat templates, the linter checks:

- every answer name parses and resolves to the Questionnaire;
- no control targets a group or display item as an answer;
- scalar, repeating and component representations match cardinality;
- compound widgets provide compatible components for their FHIR type;
- readonly and calculated items cannot become trusted user input;
- enabled required items have a representable control;
- occurrence tokens in nested repeat templates are scoped independently;
- no unexpected successful control reaches the Collector.

The linter compares answer capabilities, not DOM trees. A radio group and a
select may be equivalent presentations of the same choice item.

## Coverage

Coverage has two directions:

**Soundness** means every answer the form can submit is permitted by the
Questionnaire.

**Completeness** means every enabled answerable item the form claims to implement
can be answered through the form.

Optional omission may be intentional. A linter configuration can declare a form
as a partial view of a Questionnaire; without that declaration, missing editable
items are findings.

## What static linting cannot prove

One DOM snapshot cannot prove every state of a dynamic form. Arbitrary JavaScript
may insert controls, change names, implement calculations or enable branches only
after an interaction.

The linter therefore separates:

- properties proven from the DOM and templates;
- definite violations;
- behavior requiring runtime conformance scenarios.

It must not label unexamined behavior equivalent merely because the initial page
contains no invalid control.

## Runtime scenarios

Dynamic conformance exercises the form in a browser with Questionnaire-derived
fixtures:

- each `enableWhen` condition is crossed in both directions;
- calculated dependencies change independently and together;
- every repeat supports add, middle removal and index compaction;
- nested repeats preserve parent occurrence scope;
- unit and choice variants produce the expected typed answer;
- an existing response round-trips through display and submission.

Each scenario collects the resulting FormData through the real Collector. A
visual assertion alone does not prove FHIR equivalence.

## Linter output

A finding contains a stable code, severity, item path, DOM location when
available, and a message. Unverified behavior names the scenario required to
establish conformance.

The linter is development and publication tooling. Passing it does not let the
server skip validation of a real submission.
