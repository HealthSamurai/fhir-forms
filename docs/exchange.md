# Request and response exchange

The Collector is independent of HTTP. It receives a Questionnaire, an ordered
entry list, and trusted context. A host endpoint decides when to collect, whether
to persist, and which HTML or API representation to return.

## Interaction modes

A form endpoint commonly supports three modes:

| mode | host action | persistence |
|---|---|---|
| recompute | collect draft entries, run server-side rules, render updated state and issues | none |
| final submit with issues | collect and render the form with keyed issues | none |
| valid final submit | persist the QuestionnaireResponse and run configured post-processing | write |
| draft save, when supported | collect with draft policy and render the saved state | write without final extraction |

Application controls that select a mode are consumed by the host before the
remaining entries reach the Collector. This repository uses a submit marker such
as <code>__submit=1</code>, but the marker is not part of the Questionnaire path
grammar.

A recompute is always non-writing. This permits server execution of enableWhen
and calculated fields without turning every change into a clinical update.

## Progressive enhancement

The server exchange is the baseline. A native form can submit explicitly and
receive its next correct state. htmx may initiate debounced recomputes and replace
a form or fragment; compiled client rules may avoid a request entirely. Neither
changes the field paths or Collector result.

When client and server strategies are mixed, final collection still evaluates
all rules on the server. Client state is a preview, not an assertion about what
may be stored.

## Errors

Collector issues use the canonical submitted path and linkId when known:

~~~json
{
  "code": "value.invalid-lexical-form",
  "path": "item[visit][0].item[weight].value",
  "linkId": "weight",
  "message": "Expected a FHIR decimal"
}
~~~

The renderer associates an issue with the corresponding widget and exposes
accessible invalid and error state. A path, rather than linkId alone, is required
to distinguish repeated occurrences. Form-level issues remain possible for
cross-field constraints, expression failures, or request context.

The host should return all independent issues from one collection attempt so the
user can correct them together.

## Identity and trusted context

Questionnaire canonical URL, response identity, subject, encounter, author, and
authorization context are endpoint concerns. They may be represented in a route,
session, signed token, or other host protocol, but a hidden control alone does
not make them trusted.

The host verifies context before persistence and supplies authoritative values to
the Collector or persistence adapter. Editing an existing response must preserve
identity and apply the host's concurrency and amendment policy.

## Persistence and extraction

A successful collection yields a typed QuestionnaireResponse. Persistence,
status transitions, extraction, Task completion, audit, and redirect behavior
belong to host adapters. They must not change the meaning of the entry-list
contract.

If extraction is declared, failure is reported as a failed operation rather than
silently returning success. Recompute never invokes persistence or extraction.
See [Extraction](extraction.md).
