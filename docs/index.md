# FHIR Forms Presentation Layer

FHIR Questionnaire describes clinical meaning, answer types, constraints and
portable behavior. It cannot describe every application-specific layout or
interaction.

## Why this specification exists

A generic Questionnaire renderer chooses widgets from the item tree. That works
for portable forms, but not for every product interface. A bespoke form may need
to:

- combine a number and unit into one quantity widget;
- arrange related measurements in a responsive clinical grid;
- present repeats as compact rows;
- compose several items into one workflow-specific control;
- use custom navigation, disclosure or decision support.

Encoding those decisions as proprietary Questionnaire extensions couples the
form to one renderer. Binding arbitrary HTML through application-specific code
instead makes extraction and validation non-portable.

This specification defines a smaller boundary: HTML may be arbitrary when its
successful controls follow a public, Questionnaire-aware binding contract.

<figure style="margin:2rem 0"><img src="/spec/architecture.svg" alt="Questionnaire and HTML form produce a validated QuestionnaireResponse through shared generation, linting and collection." style="width:100%;height:auto"></figure>

This is a presentation layer, not another UI schema. It does not prescribe CSS,
DOM structure, components or a JavaScript framework.

Two visually different forms are equivalent when their successful controls and
dynamic behavior preserve the same Questionnaire semantics. Visual similarity is
not sufficient if a form changes ancestry, cardinality, types or enabled state.

## Contract

- Questionnaire is authoritative for structure, types, terminology, constraints,
  repetition, enablement, calculations and extraction metadata.
- HTML owns layout, widgets, navigation, interaction and accessibility.
- Named successful controls use canonical Questionnaire paths.
- A Collector resolves and validates entries against the Questionnaire before it
  creates a QuestionnaireResponse.
- Client behavior is optional enhancement; the server re-evaluates authoritative
  rules on final collection.
- Conformance depends on observable behavior and submitted entries, not on which
  renderer produced the page.

## Components

| component | input | output |
|---|---|---|
| [Scaffold Generator](generator.md) | Questionnaire | editable HTML + warnings |
| [Form Linter](linter.md) | Questionnaire + HTML | findings + unverified scenarios |
| [Collector](parser.md) | Questionnaire + entry list | QuestionnaireResponse or issues |
| [Reactive Runtime](expressions.md) | Questionnaire rules + current entries | enabled state + calculated previews |

All components share canonical path resolution, type binding, cardinality and
rule semantics. A Renderer is only an optional producer of conforming HTML.

## Reading order

### Model

1. [Rendering Questionnaire items](rendering.md)

### HTML contract

1. [Field names and Questionnaire paths](field-names.md)
2. [HTML form entry list](entry-list.md)
3. [FHIR type binding](types.md)
4. [Repetition and row editing](repeats.md)

### Runtime and protocol

1. [Collector and result validation](parser.md)
2. [Enablement and calculated fields](expressions.md)
3. [Server lifecycle and extraction](server-lifecycle.md)
4. [Conformance](conformance.md)

### Examples

- [Blood pressure](examples/blood-pressure.md)
- [PHQ-9](examples/phq9.md)
- [Diagnosis](examples/diagnosis.md)

### Design notes

- [Decisions](decisions.md)
- [Open questions](open-questions.md)
- [Prior art](../prior-art.md)
