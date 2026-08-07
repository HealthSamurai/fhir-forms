# Server lifecycle

The Collector is independent of HTTP and persistence. A host endpoint supplies a
Questionnaire, ordered entries and trusted context, then decides whether to
render, store or extract.

~~~text
recompute -> collect + validate -> persist -> extract
                  |
                  `-> render issues
~~~

## Request modes

| mode | action | writes |
|---|---|---|
| recompute | evaluate rules and render current state | none |
| invalid final submit | render all keyed issues | none |
| valid final submit | persist response and run post-processing | response + extraction |
| draft save, when supported | apply draft policy and persist | draft response |

Recompute is always non-writing. It allows server-side enablement and
calculations while required answers are incomplete.

Host controls such as `__submit`, repeat commands and the Questionnaire canonical
are consumed before answer entries reach the Collector. Hidden fields do not make
subject, encounter, author, response identity or authorization context trusted.

## Progressive enhancement

Native form submission is the baseline. htmx may request a fragment and compiled
client rules may avoid recompute requests. Neither changes canonical field names
or final server collection.

When collection fails, issues use the submitted path and `linkId` when known:

~~~json
{
  "code": "value.invalid-lexical-form",
  "path": "item[visit][0].item[weight].value",
  "linkId": "weight",
  "message": "Expected a FHIR decimal"
}
~~~

Paths distinguish repeated occurrences. Cross-field, expression and context
failures may remain form-level issues. The host returns independent issues
together so the user can correct them in one cycle.

## Persistence

Only successful final collection produces a completed QuestionnaireResponse.
The host verifies canonical version and trusted context, applies concurrency and
amendment policy, persists atomically and records required audit data.

Editing an existing response preserves its server-owned identity. A crafted form
entry cannot select another subject, encounter or response.

## Extraction

Extraction runs after successful collection and turns QuestionnaireResponse into
other FHIR resources. HTML layout and field components never select the mechanism;
the Questionnaire carries extraction metadata.

| result | SDC mechanism |
|---|---|
| measurements, scores and screening results | observation-based |
| Condition, AllergyIntolerance or another resource type | definition-based |
| resources with fixed surrounding content | template-based |
| explicit complex transformations | StructureMap-based |

A Questionnaire may combine mechanisms. The host resolves the exact
Questionnaire version, prevents duplicate resources on amendment and treats
missing or partial expected extraction as operation failure. Recompute never
persists or extracts.

The same valid QuestionnaireResponse must produce the same extracted resources
regardless of which conforming HTML presentation created it.

