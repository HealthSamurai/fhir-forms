# FHIR Forms Presentation Layer

FHIR Questionnaire and SDC describe clinical meaning, answer types, constraints
and a portable set of rendering hints. They do not attempt to encode every
possible user interface.

## Why this specification exists

The primary use case is not generating a default form. It is building an
intentionally designed, application-grade interface while continuing to use a
FHIR Questionnaire as the source of truth. The interface may be dense,
responsive, brand-specific and highly interactive, but its questions, answer
types, constraints and resulting QuestionnaireResponse should still follow the
Questionnaire.

A conventional Questionnaire renderer starts from the item tree and chooses a
generic widget for each item type. It can apply a theme and a portable set of SDC
rendering hints, but it can only render presentation decisions that the
Questionnaire actually contains. It cannot infer a designer's intent, such as:

- presenting a decimal and its unit as one compound quantity input;
- placing systolic and diastolic pressure on the same row while arranging other
  observations in a responsive grid;
- making repeated diagnoses look like rows in a compact paper form;
- composing several Questionnaire items into one application-specific widget;
- changing navigation, disclosure and interaction patterns for desktop and
  mobile workflows.

These decisions are deliberately outside the core Questionnaire semantic model.
A renderer can support them through proprietary extensions, templates or custom
components, but then the form becomes specific to that renderer. Another
implementation cannot reliably reproduce the presentation, and custom HTML no
longer has a standard way to prove that it still represents the Questionnaire.

This boundary is deliberate, not a missing feature that every generic renderer
should repair. Questionnaire and SDC remain portable semantic definitions;
HTML supplies the application-specific composition and interaction language.

Without a standard boundary between those semantics and the rendered interface,
implementers usually have to choose one of three compromises:

- restrict the interface to what a particular Questionnaire renderer supports;
- introduce a proprietary UI schema alongside the Questionnaire and duplicate
  paths, constraints and behavior across both models;
- bind custom HTML to application-specific extraction code that cannot be
  inspected, linted or reused by another implementation.

All three approaches weaken portability. The Questionnaire may remain formally
standard, while the form that users actually interact with becomes coupled to a
renderer, framework or backend.

This specification defines the missing presentation boundary. It treats HTML as
the presentation language and introduces a small, observable binding contract
between Questionnaire items, successful HTML form entries and
QuestionnaireResponse items. The contract makes it possible to ask and answer a
precise question: **is this arbitrary HTML form a valid rendering of this FHIR
Questionnaire?**

The goal is to preserve both sides of that boundary:

- the Questionnaire remains the source of clinical meaning, types and
  constraints;
- the HTML remains free to use any layout, design system, server framework or
  client runtime;
- a conforming Collector can reconstruct and validate the same
  QuestionnaireResponse independently of the renderer;
- a Form Linter can detect structural gaps before the form reaches a user;
- dynamic behavior can run as compiled client JavaScript, server re-rendering or
  a combination of both without changing the submission contract.

This is not a replacement for Questionnaire or SDC, and it is deliberately not
another universal UI schema. It does not prescribe CSS, DOM structure or a
JavaScript framework. It standardizes only the binding surface that must remain
stable when presentation and execution strategies change.

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
