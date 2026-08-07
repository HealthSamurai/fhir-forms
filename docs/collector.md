# Collection and validation

The Collector converts a Questionnaire plus an ordered HTML entry list into a
typed QuestionnaireResponse or structured issues.

~~~ts
collect({ questionnaire, entries, context })
  -> { ok: true, response }
   | { ok: false, issues }
~~~

The operation is deterministic.

## Pipeline

1. The host removes application controls and supplies trusted context.
2. Names are tokenized into item, occurrence and component steps.
3. Every step resolves against Questionnaire ancestry and cardinality.
4. Entries sharing a path and occurrence assemble into answer candidates.
5. The type registry binds lexical values to FHIR `value[x]`.
6. Server rules discard disabled answers and replace calculated values.
7. The Questionnaire is walked in definition order to materialize the response.
8. Required, terminology, range and cross-field constraints are validated.

The request body never determines its own object shape or type. A general FHIR
resource validator may run afterward, but does not replace binding validation.

## Issues

Issues identify the submitted path and Questionnaire item when known:

~~~json
{
  "code": "value.invalid-lexical-form",
  "path": "item[weight].value",
  "linkId": "weight",
  "message": "Expected a FHIR decimal"
}
~~~

Independent issues are accumulated. No partial response is returned when an
issue makes materialization ambiguous or invalid.

## Authority boundary

The Collector trusts authenticated server context and the Questionnaire
definition. DOM markers, hidden controls, readonly state, client calculations and
linter results are input hints, never authority.

The complete path and entry contract is in [HTML binding](html-binding.md), and
lexical conversion is in [FHIR type binding](type-binding.md).

