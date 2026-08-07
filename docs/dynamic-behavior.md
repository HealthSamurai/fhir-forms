# Dynamic behavior

Dynamic behavior changes the form, not the binding contract. Whether JavaScript updates the page locally or the server returns an HTML fragment, successful controls MUST still use the paths defined in [HTML binding](/spec/html-binding).

## Repeats

A repeat occurrence uses an explicit zero-based index:

```text
item[diagnosis][0].value
item[diagnosis][1].value
item[visit][0].item[diagnosis][0].value
```

An implementation that adds or removes occurrences MUST preserve these rules:

- every live sibling occurrence has a unique index;
- every control inside an occurrence uses the same index;
- nested repeats have an index at every repeating level;
- document order remains answer order;
- removed controls are removed or disabled and therefore are not successful controls.

Indices MAY contain gaps. Renumbering is optional and MUST update the complete subtree atomically.

### Client insertion

A client-side implementation:

1. Chooses an unused sibling index.
2. Instantiates a trusted form template.
3. Substitutes the index in every bound control within that subtree.
4. Inserts the subtree at the intended document position.

The browser does not need to understand FHIR. It only needs to produce valid control names.

### Server insertion

A server-driven implementation:

1. Receives the repeat path and current form state.
2. Chooses an unused sibling index.
3. Renders an HTML fragment whose controls use that index.
4. Inserts or swaps the fragment using htmx or an equivalent mechanism.

Client and server insertion are equivalent when they produce the same ordered successful controls.

See the nested repeat behavior in the [visits example](/examples/visits).

## Enablement

`Questionnaire.item.enableWhen` and `enableWhenExpression` MAY be implemented locally or on the server.

When an item is disabled:

- its controls MUST be disabled or removed so they are not submitted;
- its descendants MUST also be excluded;
- restoring the item MAY restore previous UI values, but only currently successful controls are collected.

FHIRPath expressions MAY be compiled to plain JavaScript for local execution. Alternatively, the form MAY submit the changed inputs to a server that evaluates the expression and returns an updated fragment.

## Calculated fields

`calculatedExpression` MAY be evaluated in the browser for immediate feedback or on the server during rerendering. A calculated answer that participates in the response MUST be represented by a successful control with the same binding syntax as an entered answer.

Client-calculated values are untrusted input. The server SHOULD recompute them from authoritative inputs before producing the final `QuestionnaireResponse`.

See the [vital signs example](/examples/vitals) and [PHQ-9 example](/examples/phq9).

## Client and server parity

For the same Questionnaire and user-visible state, client and server execution SHOULD produce equivalent ordered entries. Implementations SHOULD test this property for enablement, calculations, repeat insertion, and repeat removal.

The collector remains independent of the rendering strategy: it receives the Questionnaire and the final successful controls, then extracts and validates the `QuestionnaireResponse`.
