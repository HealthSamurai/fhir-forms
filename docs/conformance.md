# Conformance

Conformance is defined separately for HTML forms and presentation-layer
components. Providing one component does not imply conformance of the others.

## Conforming HTML form

A form conforms to a Questionnaire when:

- every successful answer control uses a canonical path that resolves against the
  Questionnaire;
- its answer capabilities are sound and its declared coverage is complete;
- lexical values and compound controls are compatible with the item types;
- repetitions preserve explicit, contiguous occurrence indexes;
- enabled, calculated, read-only and required behavior matches the Questionnaire;
- collecting its entry list produces the expected QuestionnaireResponse.

Visual similarity to a generic renderer is not required.

## Conforming Collector

A Collector:

- consumes an ordered entry list rather than a pre-merged object;
- resolves every answer through the Questionnaire;
- rejects malformed paths, ancestry, cardinality and components;
- applies the shared type and empty-answer rules;
- re-evaluates enabled and calculated state on the server;
- returns deterministic responses or deterministic issues.

## Conforming Form Linter

A Form Linter:

- uses the same binding kernel as the Collector;
- checks soundness and declared completeness;
- inspects both current controls and repeat templates;
- distinguishes proven, invalid and unverified dynamic behavior;
- can execute required browser scenarios through the real Collector.

## Conforming Reactive Runtime

A Reactive Runtime:

- resolves dependencies against the Questionnaire;
- produces the same enabled and calculated results as the server evaluator;
- clears unsaved values when an enabled branch closes;
- treats client calculation as a preview rather than authority;
- falls back to server recompute for unsupported rules.

## Shared fixture format

One fixture should exercise every component:

```yaml
questionnaire: { ... }
form: form.html
entries:
  - [item[weight].value, "70"]
  - [item[weight].unit, kg]
expectedResponse: { ... }
scenarios:
  - change: item[height].value
    to: "175"
    expectCalculated: { item[bmi].value: "22.9" }
```

The static linter checks `form.html`, runtime scenarios manipulate it, and the
Collector evaluates each resulting entry list. This prevents separate test suites
from encoding separate interpretations of the contract.

## Required corner cases

Conformance fixtures include:

- empty, zero and false primitive values;
- optional complex values with only ancillary defaults;
- malformed and percent-encoded linkIds;
- duplicate scalar and sparse repeat occurrences;
- nested repeated groups and child items under answers;
- conflicting atomic and component representations;
- closed required branches;
- calculated values submitted by a hostile client;
- unsupported client expressions falling back to server evaluation;
- round-trip of an existing response.
