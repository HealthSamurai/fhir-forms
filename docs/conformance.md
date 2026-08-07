# Conformance

Forms and components conform independently. Providing a conforming renderer or
linter does not make submitted data trustworthy.

## HTML form

A form conforms to a Questionnaire when:

- every successful answer control resolves through a canonical path;
- answer capabilities are sound and declared coverage is complete;
- lexical values and components match Questionnaire item types;
- repeat indexes are explicit, contiguous and correctly scoped;
- required, enabled, read-only and calculated behavior matches the definition;
- collection produces the expected QuestionnaireResponse.

DOM structure and visual similarity are not requirements.

## Component requirements

| component | required behavior |
|---|---|
| Collector | consumes ordered entries, resolves against Questionnaire, applies shared type/rule semantics and returns deterministic response or issues |
| Form Linter | checks soundness and coverage, inspects templates and separates proven, invalid and unverified behavior |
| Reactive Runtime | resolves dependencies, matches server evaluation, clears closed branches and falls back for unsupported rules |
| Scaffold Generator | emits canonical editable controls and explicit warnings without claiming unresolved behavior is conforming |

All components use the same binding kernel. Client previews, DOM markers and
lint results never replace final server validation.

## Shared fixtures

One fixture exercises static structure, runtime behavior and collection:

~~~yaml
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
~~~

Required coverage includes empty/zero/false values, optional complex defaults,
encoded linkIds, malformed paths, duplicates, sparse and nested repeats, answer
children, representation conflicts, closed required branches, hostile calculated
values, server fallback and existing-response round trips.

