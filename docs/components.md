# Components and shared kernel

The presentation layer is a set of interoperable components. An implementation
may provide all of them or use only the components needed for a bespoke form.

## Shared binding kernel

Collector, linter, runtime and renderer must not implement Questionnaire semantics
independently. They share:

- the canonical path tokenizer and renderer;
- Questionnaire-aware path resolution;
- item ancestry and cardinality rules;
- the FHIR answer type registry;
- empty-value and complex-component rules;
- reactive dependency and expression semantics.

This shared kernel is the architectural invariant. If a linter accepts a path the
collector rejects, or a client rule types a value differently from the server,
the presentation layer is not coherent.

## Collector and Validator

```ts
collect({ questionnaire, entries, context })
  -> { response, issues }
```

The collector treats the Questionnaire as the authority. It resolves entries,
coalesces complex components, coerces lexical values, materializes the response
tree and validates the result. It is the final server-side boundary even when the
form was linted and all reactive rules ran in the browser.

## Form Linter

```ts
lint({ questionnaire, document, runtime })
  -> { findings, coverage, unverified }
```

The linter compares rendered HTML with the Questionnaire. It proves structural
properties from controls and templates, reports invalid or missing bindings, and
identifies dynamic behavior that cannot be proven from one DOM snapshot.

The linter does not make arbitrary JavaScript statically decidable. Unproven
behavior is exercised through conformance scenarios rather than silently treated
as equivalent.

## Reactive Runtime

```ts
prepareRules({ questionnaire })
  -> { clientModule, serverPlan, dependencies }
```

The runtime resolves dependencies and executes enablement and calculations. A
supported local rule may compile to client JavaScript; a server-dependent rule
causes a recompute request. Both use the same server evaluator as their reference.

## Scaffold Generator

```ts
generate({ questionnaire, options })
  -> { html, warnings }
```

The generator bootstraps editable HTML with canonical paths, semantic controls
and explicit warnings for behavior that requires project decisions. Its output
is source code, not a runtime-owned render tree. Once generated, a developer or
agent may change layout and widgets freely while preserving the binding
contract.

The file writer refuses to overwrite an existing scaffold unless replacement is
explicit. This prevents regeneration from destroying bespoke presentation work.

## Renderer

```ts
render({ questionnaire, response, issues }) -> HTML
```

A renderer is an optional producer of conforming HTML. It may use SDC hints and a
default component library, but it has no privileged status. Hand-written HTML is
equally conforming when the linter and collector observe the same contract.

## Component boundaries

```text
Questionnaire + HTML ───────────────→ Form Linter
Questionnaire + entry list ─────────→ Collector ─→ QuestionnaireResponse
Questionnaire rules ────────────────→ Reactive Runtime ─→ HTML state
Questionnaire ──────────────────────→ Scaffold Generator ─→ editable HTML source
Questionnaire + optional response ──→ Renderer ─→ HTML
```

No component trusts another component's assertion. Linting improves feedback but
does not replace collection validation. Client calculations improve latency but
do not replace server calculation. Renderer markers improve observability but do
not replace canonical control names.
