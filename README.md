# fhir-forms

A bridge between ordinary HTML forms and FHIR Questionnaire. A page with its own
markup, a test, an agent, or another UI can produce the same
QuestionnaireResponse as the renderer, without requiring a client-side runtime.

- [Specification index](docs/index.md): the normative protocol and reading order.
- [Field names](docs/field-names.md): the public wire grammar.
- [Types](docs/types.md): every Questionnaire item type end to end.
- [Collect and render](docs/collect-and-render.md): inverse algorithms.
- [Examples](docs/examples/blood-pressure.md): blood pressure, PHQ-9, and diagnosis.
- [Decisions](docs/decisions.md) and [open questions](docs/open-questions.md).
- [Prior art](prior-art.md): related form systems and lessons.

The design grew out of clinical screens on Aidbox/FHIR, where the same form must
work in a clinician chart and a patient portal, and where answers should become
useful clinical records rather than unread documents.
