# The HTML presentation layer

FHIR Forms separates three concerns that are often collapsed into one renderer:

| layer | responsibility |
|---|---|
| Questionnaire | semantic definition: items, types, terminology, constraints, repetition, and reactive rules |
| HTML | presentation: layout, widgets, navigation, interaction, and accessibility |
| QuestionnaireResponse | typed result: answers arranged in the Questionnaire tree |

A generic renderer is one possible producer of the HTML layer. It is not the
definition of conformance and has no privileged wire format.

## The binding contract

The presentation layer connects the three representations through observable
behavior:

~~~text
Questionnaire item tree
        <-> canonical item paths and rule semantics
HTML widgets and successful controls
        <-> ordered entry collection and FHIR type binding
QuestionnaireResponse answer tree
~~~

The contract is intentionally narrower than a UI model. It specifies how a
control identifies an item occurrence, how submitted lexical values become FHIR
answers, and how Questionnaire behavior remains authoritative. It does not
specify DOM shape, CSS, component libraries, or page navigation.

This narrow boundary is what permits rich bespoke HTML without making it
application-specific at the data boundary.

## No second UI schema

HTML itself is the presentation representation. The layer does not add JSON
components, screen definitions, or another form resource. It adds only:

- canonical field paths;
- ordered HTML entry-list semantics;
- Questionnaire-aware FHIR type binding;
- shared rules for enablement and calculated values;
- linting and conformance evidence.

SDC rendering extensions remain valuable inputs to a generic renderer. Bespoke
forms may express decisions that those hints do not contain while using the same
binding contract.

## Equivalence

Two visually unrelated forms may be equivalent presentations when their
successful controls and dynamic behavior preserve the same Questionnaire
semantics. Conversely, visual similarity does not make a form equivalent if it
loses ancestry, changes cardinality, accepts the wrong type, or submits an answer
from a disabled branch.

The normative requirements are collected in [Conformance](conformance.md).
Rendering and collection are expected to preserve every editable answer:

~~~text
collect(render(response)) = response
~~~

Calculated, disabled, hidden, and server-owned values are outside that editable
subset and are re-derived from trusted inputs.

## Terms

**Item path** identifies a Questionnaire item through its ancestors.

**Occurrence** selects one instance of a repeating item or answer.

**Component** selects part of a complex FHIR value, such as Quantity.value or
Coding.code.

**Widget** is one visual answer control. It may contain several successful HTML
controls for one FHIR value.

**Entry list** is the ordered sequence of name/value pairs produced by HTML form
submission.

**Binding kernel** is the shared path resolver, type registry, cardinality model,
and rule semantics used by presentation-layer components.
