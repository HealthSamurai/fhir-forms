# FHIR Forms Presentation Layer

FHIR Questionnaire and SDC describe clinical meaning, answer types, constraints
and a portable set of rendering hints. They do not attempt to encode every
possible user interface.

This specification adds an HTML presentation layer without adding another UI
schema:

```text
Questionnaire
    ↓ semantic binding
arbitrary dynamic HTML form
    ↓ canonical HTML entry list
QuestionnaireResponse
```

An HTML form is considered a rendering of a Questionnaire when it follows this
binding contract. It may be hand-written, server-rendered, progressively enhanced
or implemented as a client application. Conformance depends on behavior and form
entries, not on which renderer produced the DOM.

The presentation layer is implemented by independent components that share one
binding kernel:

- a **Collector and Validator** converts an ordered form entry list into a typed
  QuestionnaireResponse and reports structural or value issues;
- a **Form Linter** checks that an HTML form can represent the Questionnaire and
  identifies behavior that still requires runtime verification;
- a **Reactive Runtime** executes `enableWhen` and calculated fields through
  compiled client JavaScript, server re-rendering, or both;
- a **Renderer** is optional convenience tooling, not a requirement of the
  contract.

## Start

1. [The presentation layer](concepts.md)
2. [Components and shared kernel](components.md)

## HTML contract

1. [Rendering Questionnaire items as HTML](rendering.md)
2. [Field names and Questionnaire paths](field-names.md)
3. [HTML form entry list](entry-list.md)
4. [FHIR type binding](types.md)

## Runtime components

1. [Collector and result validation](parser.md)
2. [Form linter](linter.md)
3. [Reactive runtime](expressions.md)

## Protocol and output

1. [Request and response exchange](exchange.md)
2. [Extraction](extraction.md)
3. [Conformance](conformance.md)

## Worked examples

- [Blood pressure and quantities](examples/blood-pressure.md)
- [PHQ-9 scoring](examples/phq9.md)
- [Diagnosis](examples/diagnosis.md)

## Design notes

- [Decision register](decisions.md)
- [Open questions](open-questions.md)
- [Prior art](../prior-art.md)
- [Compatibility index](../spec.md)
