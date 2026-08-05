# fhir-forms

A bridge between HTML forms and FHIR Questionnaire — written so that a page with
its own markup, a test, or somebody else's UI can produce the same
QuestionnaireResponse as our renderer, with no client-side runtime required.

- [`spec.md`](spec.md) — the design. What a field is called, every `item.type` end
  to end, how a page is rendered, the exchange, the collect algorithm, how skip
  logic and formulas reach the browser; worked examples (blood pressure, a PHQ-9
  score, a diagnosis from ICD-10); and the register of corner cases, numbered
  decisions, open questions and what is specified but not built.
- [`prior-art.md`](prior-art.md) — who has solved parts of this before (Rails and
  the bracket tradition, W3C HTML JSON Forms, schema-driven form generators,
  XForms and Orbeon, the FHIR renderers, htmx, Datastar), what to take from each,
  and what stays ours.

It grew out of building clinical screens on Aidbox/FHIR, where the same form has
to be answered in a clinician's chart and in a patient's portal, and where the
answer has to become a measurement in the record rather than a document nobody
reads.
