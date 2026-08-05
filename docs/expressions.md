# Reactive runtime

The Reactive Runtime executes `enableWhen` and calculated fields as rules over the current form
answers. Their result must not depend on where they execute. A renderer may run a
rule through generated client JavaScript or ask the server to re-render the form;
the wire contract and the resulting QuestionnaireResponse are the same.

This separation is normative:

- the Questionnaire defines the rule and is the source of truth;
- the renderer chooses an execution strategy for each rule;
- the server evaluates every rule again when it collects or stores an answer.

Client evaluation is an optimisation for responsiveness. It is never an authority
and never changes what a crafted POST is allowed to answer.

## Observable behavior

### `enableWhen`

An enabled item is rendered and participates in constraint validation and form
submission. A disabled item:

1. is hidden from the form;
2. has its containing `<fieldset disabled>` so none of its controls are successful
   form entries;
3. contributes no item or answer to the collected QuestionnaireResponse;
4. has its unsaved values cleared when it transitions from enabled to disabled.

Clearing is necessary for parity. A server re-render removes the closed branch;
client execution must not preserve a value that would have disappeared in the
server strategy and restore it when the branch opens again.

The server evaluates `enableWhen` against the complete raw entry list before it
builds the response. It does not trust `hidden`, `disabled`, or any other DOM
state sent by the browser. A submitted answer for a disabled item is ignored.

Multiple `enableWhen` predicates use the Questionnaire's declared
`enableBehavior` (`all` or `any`). The compiler may optimise the predicates, but
must not change their typing, comparison, repeat scoping, or empty-value rules.

### Calculated fields

A calculated item is derived from other answers. It is displayed as `<output>` or
as a disabled control and is not an authoritative successful form entry. Client
code may update its preview, but the server calculates the typed answer again and
places that result in the QuestionnaireResponse.

If a renderer includes a named readonly control for compatibility, the collector
must ignore its submitted value and overwrite it with the server result. `readonly`
is not a security boundary: unlike `disabled`, it is included in FormData.

An empty calculation produces no answer for an optional item. A calculation
failure is not an empty answer: it is a form-level evaluation issue and prevents a
completed response from being stored.

## Dependency graph

Before rendering, the implementation resolves every rule to a graph:

```text
source item paths -> enableWhen/calculation -> target item path
```

Dependencies are resolved against the Questionnaire, not discovered by walking
the DOM. Calculations are evaluated in topological order, followed by enablement
rules that depend on their results. A dependency cycle is a definition error and
the form must not be published.

Within a repeated group, an unqualified dependency resolves in the current
occurrence. Rules that aggregate or reach across occurrences require explicit
repeat semantics; an implementation that cannot compile those semantics uses the
server strategy for that rule.

## Strategy A: compiled client runtime

At render time the server may compile a supported rule into plain JavaScript. It
resolves item paths and types before emitting code. The browser receives an
already-generated function; it never parses FHIRPath, calls `eval`, or assembles a
QuestionnaireResponse.

```js
// Generated for one Questionnaire url + version.
const rules = {
  enableDiagnosis: values => values("item[hasDiagnosis]")[0] === "true",
  bmi: values => {
    const kg = Number(values("item[weight].value")[0]);
    const cm = Number(values("item[height].value")[0]);
    return kg > 0 && cm > 0 ? kg / ((cm / 100) ** 2) : null;
  },
};
```

The generated runtime attaches once to the form and uses delegated `input` and
`change` listeners. After a change it:

1. reads the affected source controls by their canonical field names;
2. evaluates only dependent rules, in graph order;
3. applies enablement to the target fieldset;
4. updates calculated outputs;
5. requests no network round trip for rules it evaluated successfully.

Attaching is idempotent because server responses may replace the form. A runtime
is keyed by Questionnaire canonical URL and version. Generated inline code uses a
CSP nonce; a versioned external script is an equivalent delivery optimisation.
Neither strategy requires `unsafe-inline` or runtime expression evaluation.

## Strategy B: server-driven re-render

The server strategy is the required baseline and the progressive-enhancement
fallback. A change to a source field posts the current entry list without a final
submit marker. The server:

1. parses the draft entries without writing a resource;
2. evaluates calculations and enablement using the Questionnaire definition;
3. renders the new form state;
4. returns the form or affected fragment for replacement.

htmx may debounce the change and swap the returned fragment, but htmx is not part
of the contract. Another client may perform the same request, and a browser with
JavaScript disabled obtains the same correct state on its next explicit submit or
recompute action.

The response carries the current values, validation issues, enabled branches, and
calculated outputs. Replacing a fragment must preserve canonical field names and
repeat occurrence indexes.

## Hybrid execution

Execution is selected per rule, not per form. One form may calculate BMI in the
browser while sending a terminology-dependent eligibility rule to the server.

| compile to client JavaScript | evaluate on the server |
|---|---|
| deterministic operations over fields in this form | terminology operations such as `memberOf` |
| supported comparisons, boolean logic and arithmetic | reads of other resources or server state |
| dependencies with statically resolved item paths | unsupported expression languages or functions |
| repeat scoping the compiler can prove | cross-occurrence logic the compiler cannot preserve |

When a changed source reaches both kinds of rule, client rules update immediately
and one debounced server request updates the rest. The returned fragment is the
authoritative view and the client runtime attaches to it again.

The compiler must be allowed to refuse a rule. Refusal is not an error while the
server evaluator supports it; silently generating an approximation is an error.

## Parity requirements

The same conformance fixtures must be executed through the server evaluator and
the generated client module. For every input state they must agree on:

- which items are enabled;
- which values are cleared when a branch closes;
- each calculated value and its FHIR type;
- empty, invalid and repeated-answer behavior;
- dependency ordering.

Server collection remains the final conformance boundary. It re-evaluates rules,
discards answers for disabled items, ignores client-provided calculated results,
and stores only its own typed result.
