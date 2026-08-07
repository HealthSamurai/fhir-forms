# The HTML presentation layer

FHIR Forms separates three representations:

| representation | responsibility |
|---|---|
| Questionnaire | items, types, terminology, constraints and behavior |
| HTML | layout, widgets, interaction and accessibility |
| QuestionnaireResponse | typed answers arranged in the Questionnaire tree |

A generic renderer is one producer of HTML. It has no privileged wire format.

## Binding contract

The contract defines:

- how a control identifies an item occurrence;
- how ordered form entries become typed FHIR answers;
- how Questionnaire behavior remains authoritative;
- how implementations prove equivalent behavior.

It does not define DOM shape, CSS, page navigation or a component model. HTML is
the presentation representation; there is no additional UI schema.

## Equivalence

Two visually different forms are equivalent when their successful controls and
dynamic behavior preserve the same Questionnaire semantics. Visual similarity is
insufficient if a form loses ancestry, changes cardinality, accepts the wrong
type or submits a disabled answer.

For editable answers:

~~~text
collect(render(response)) = response
~~~

Calculated, disabled and server-owned values are re-derived.

## Terms

| term | meaning |
|---|---|
| item path | a Questionnaire item addressed through its ancestors |
| occurrence | one instance of a repeating item or answer |
| component | part of a complex FHIR value, such as `Quantity.value` |
| widget | one visual control, possibly containing several named controls |
| entry list | ordered `(name, value)` pairs produced by form submission |
| binding kernel | shared path, type, cardinality and rule semantics |

Normative requirements are collected in [Conformance](conformance.md).

