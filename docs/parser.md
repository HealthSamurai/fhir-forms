# Collector and result validation

The Collector converts an ordered HTML form entry list into a typed
QuestionnaireResponse. It also validates that the submitted representation is
permitted by the Questionnaire.

```ts
collect({ questionnaire, entries, context })
  -> { ok: true, response }
   | { ok: false, issues }
```

The operation is deterministic. The same Questionnaire and ordered entries must
produce the same response or the same ordered issues.

## Pipeline

### 1. Separate host controls

The HTTP endpoint consumes application controls such as submit actions before
calling the collector. The remaining names must use the Questionnaire path
grammar.

### 2. Tokenize paths

Each name is parsed into item steps, occurrence indexes and datatype components:

```text
item[visit][2].item[diagnosis][0].code
```

Malformed syntax, indexes and percent encoding produce path issues without
guessing an alternate interpretation.

### 3. Resolve against the Questionnaire

Every item step is resolved through the Questionnaire tree. Resolution checks:

- item existence and ancestry;
- whether an occurrence index is required or forbidden;
- whether the final item can carry an answer;
- whether a component is supported by the declared answer type.

The body never determines its own JSON shape.

### 4. Assemble answer candidates

Entries with the same item path and occurrence form one candidate answer.
Primitive answers have one atomic value. Complex answers coalesce named
components such as `.value`, `.unit`, `.system` and `.code`.

An optional complex answer with no primary component is empty even when ancillary
defaults were submitted. `Quantity.unit` without `Quantity.value` does not create
an answer. A non-empty invalid primary component remains an error.

### 5. Bind FHIR types

The type registry converts lexical values into the appropriate `value[x]` and
validates complex invariants. Examples include strict booleans, finite decimals,
FHIR date precision, Coding identity and Quantity components.

### 6. Apply reactive semantics

The server evaluator determines which items are enabled and recalculates derived
answers. Submitted answers for disabled items are discarded. Submitted values for
calculated or server-owned items are ignored and replaced by the server result.

### 7. Materialize the response tree

The collector walks the Questionnaire in definition order and places validated
answers under matching `QuestionnaireResponse.item`. Repeated occurrences are
ordered by numeric index. Child items are placed under either `item.item` or
`answer.item` according to the Questionnaire structure.

### 8. Validate the result

Validation includes required answers, cardinality, allowed options, units, ranges
and cross-field constraints supported by the Questionnaire profile. A general
FHIR resource validator may run afterward; it complements rather than replaces
binding validation.

## Issue shape

Issues identify both the submitted path and the Questionnaire item when known:

```json
{
  "code": "value.invalid-lexical-form",
  "path": "item[weight].value",
  "linkId": "weight",
  "message": "Expected a FHIR decimal"
}
```

Collectors should accumulate independent issues so one correction cycle can fix
more than one field. Materialization does not return a partial response when any
issue makes the result ambiguous or invalid.

## Authority boundary

DOM attributes, hidden controls, readonly state and client calculations are input
hints, not authority. The collector trusts only authenticated server context, the
Questionnaire definition and values the definition permits the user to answer.

This boundary is why arbitrary HTML can participate safely: presentation is open,
while result construction remains strict and Questionnaire-aware.
