# FHIR Forms specification

This specification defines a renderer-independent wire contract between ordinary
HTML forms and FHIR Questionnaire/QuestionnaireResponse.

Read the normative pages in this order:

1. [Concepts](concepts.md)
2. [Field names and wire mapping](field-names.md)
3. [Type mapping](types.md)
4. [Collect and render](collect-and-render.md)
5. [Request and response exchange](exchange.md)
6. [Skip logic and calculated expressions](expressions.md)
7. [Extraction](extraction.md)
8. [Conformance and corner cases](conformance.md)
9. [Decision register](decisions.md)
10. [Open questions and implementation gaps](open-questions.md)

Worked examples:

- [Blood pressure and quantities](examples/blood-pressure.md)
- [PHQ-9 scoring](examples/phq9.md)
- [Diagnosis](examples/diagnosis.md)

A normative rule belongs on exactly one topical page. Examples illustrate rules
but do not define a second version of them. Rationale remains in
[prior-art.md](../prior-art.md).

## QuestionnaireResponse parser

- [QuestionnaireResponse form parser](parser.md) defines the strict conversion
  from an ordered HTML form entry list into a typed QuestionnaireResponse.
