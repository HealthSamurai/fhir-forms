# Enablement and calculated fields

Questionnaire and SDC define reactive rules. A renderer chooses where each rule
executes; the server evaluates every rule again before storing a response.

~~~text
FHIRPath rule
  |-- supported compiler subset -> generated plain JavaScript
  `-- unsupported/server-dependent -> server evaluation -> HTML fragment
~~~

Selection is per rule. Client execution improves latency but is never authority.

## Rule preparation

Before rendering, an implementation:

1. parses expressions on the server;
2. resolves item references and types against the Questionnaire;
3. builds and orders the dependency graph;
4. assigns supported rules to client compilation;
5. assigns refused or server-dependent rules to server evaluation.

Compiler refusal is expected. Approximating unsupported behavior is a
conformance failure.

## Client compilation

The compiler emits ordinary JavaScript bound to one Questionnaire canonical URL
and version:

~~~js
export function updateAdultDetails(form) {
  const raw = form.elements.namedItem("item[age]")?.value;
  const enabled = raw !== "" && Number.isInteger(Number(raw)) && Number(raw) >= 18;
  const target = form.querySelector('[data-field="item[adult-details]"]');

  target.hidden = !enabled;
  target.disabled = !enabled;
}
~~~

Generated code contains resolved field names and explicit lexical conversion. It
does not use `eval`, parse FHIRPath in the browser or build a
QuestionnaireResponse. It attaches idempotently after fragment replacement.

## Server execution

A wrapper may post the current successful controls and replace an affected
fragment:

~~~html
<div hx-post="/forms/intake/recompute"
     hx-trigger="change from:closest form delay:250ms"
     hx-include="closest form"
     hx-target="#adult-details"
     hx-swap="outerHTML"
     hx-sync="closest form:queue last">
  <fieldset id="adult-details"
            data-field="item[adult-details]"
            disabled hidden>
    <!-- canonical child controls -->
  </fieldset>
</div>
~~~

The recompute endpoint binds the draft entry list, evaluates affected rules in
dependency order, writes nothing and renders the fragment. A native request may
receive the full form. Issuing recompute from a wrapper avoids blocking on
incomplete native `required` validation.

## Enablement semantics

An enabled item is visible and participates in validation and submission. A
disabled item:

- is hidden;
- is contained by a disabled fieldset;
- contributes no answer;
- loses unsaved values when the branch closes.

The server evaluates enablement from submitted source answers, not from DOM
attributes. It discards crafted answers for disabled items. Multiple predicates
use the Questionnaire's declared `enableBehavior`.

## Calculated fields

Calculated answers render as `<output>`, text or disabled controls:

~~~html
<output data-field="item[bmi]" aria-live="polite">22.9</output>
~~~

The output has no `name`. Client code may update the preview; final collection
recalculates and materializes the typed answer. A submitted readonly or hidden
calculated value is ignored.

An empty optional calculation produces no answer. Evaluation failure is an issue,
not an empty answer.

## Dependencies and hybrid execution

Dependencies are resolved from the Questionnaire, not the DOM:

~~~text
source item paths -> calculation/enablement -> target item path
~~~

Calculations run in topological order before rules that depend on them. Cycles
are publication errors. Within repeats, local dependencies resolve in the current
occurrence; unsupported cross-occurrence logic runs on the server.

| compile locally | evaluate on server |
|---|---|
| comparisons, boolean logic and arithmetic | terminology operations |
| statically resolved form fields | external resources or server state |
| provable repeat scope | unsupported languages, functions or scope |

A form may combine both strategies. One debounced server request updates all
server-owned dependencies reached by a change.

## Parity

Client and server fixtures must agree on enabled items, cleared values,
calculated types, empty values, repeat scope and dependency order. Final server
collection remains the conformance boundary.

See the [PHQ-9 example](examples/phq9.md) for a compiled score and conditional
question, or [/examples/decision-support](/examples/decision-support) for server
recomputation.

