# The HTML presentation layer

Questionnaire is the semantic model: it defines items, types, repetition,
terminology, constraints and reactive rules. QuestionnaireResponse is the result
model: it records typed answers in the same tree.

HTML is the presentation model. It is deliberately not stored inside the
Questionnaire and is not limited to the controls or layouts a generic SDC
renderer understands.

## The bridge

The presentation layer binds the three representations:

```text
Questionnaire item tree
        ↕ item paths and behavior
HTML widgets and successful controls
        ↕ collection and type binding
QuestionnaireResponse answer tree
```

The binding is bidirectional. A form must be able to display an existing response
and its entry list must be collectable into an equivalent response for every
answer the form permits a user to change.

## No second UI schema

The layer does not introduce JSON components, screen definitions or another form
resource. HTML itself is the representation. The specification defines only the
conventions needed to connect that representation to FHIR:

- canonical names address Questionnaire items, occurrences and value components;
- successful-control rules define what the browser actually submits;
- type binding turns lexical HTML values into FHIR `value[x]` answers;
- reactive behavior preserves `enableWhen`, calculated and read-only semantics;
- conformance checks compare the form with its Questionnaire.

SDC rendering extensions remain useful hints for generic renderers. A bespoke
form may express a richer interface directly in HTML without extending the
Questionnaire merely to describe its visual implementation.

## Conforming rendering

A page is a rendering of a Questionnaire when:

- every answer it can submit resolves to an item in that Questionnaire;
- every enabled answerable item it claims to support can be represented;
- values, ancestry and repetition follow the Questionnaire definition;
- disabled and server-owned values cannot become trusted user answers;
- dynamic behavior has the same result whether executed in the browser or on the
  server;
- collecting its entries produces the expected QuestionnaireResponse.

DOM shape and visual layout are not compared. Two completely different pages may
be equivalent renderings when they expose the same answer capabilities and
preserve the same semantics.

## Terms

**Item path** identifies a Questionnaire item through its ancestors.

**Occurrence** selects one answer or repeated group instance.

**Component** selects part of a complex FHIR value such as `Quantity.value` or
`Coding.code`.

**Widget** is one visual answer control. A widget may contain several HTML
controls while representing one FHIR value.

**Entry list** is the ordered sequence of `(name, value)` pairs produced by HTML
form submission.

**Binding kernel** is the shared path resolver, type registry and rule semantics
used by every presentation-layer component.
