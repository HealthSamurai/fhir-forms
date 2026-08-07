# FHIR Forms Presentation Layer

FHIR Questionnaire describes clinical meaning, answer types, constraints and
portable behavior. It cannot describe every application-specific layout or
interaction.

## Why this specification exists

Modern HTML and JavaScript can implement effectively any interface: composed
widgets, spatial layouts, progressive disclosure, asynchronous search, decision
support and application-specific workflows. Questionnaire cannot, and should
not, encode that entire presentation space.

**Questionnaire is the contract, not the interface.** It defines questions,
answer types, constraints and portable behavior. A generic SDC renderer remains
the right tool for safe, portable forms. But adding more rendering extensions
does not eventually produce arbitrary application UI; it recreates HTML
indirectly, couples the definition to a renderer and still limits what designers,
developers and agents can build.

FHIR Forms provides a smaller boundary. HTML remains arbitrary when its
successful controls follow public, Questionnaire-aware names. The collector
combines the Questionnaire and submitted controls to produce and validate a
QuestionnaireResponse.

<figure style="margin:2rem 0"><img src="/spec/architecture.svg" alt="Questionnaire and HTML form produce a validated QuestionnaireResponse through shared generation, linting and collection." style="width:100%;height:auto"></figure>

This is a presentation layer, not another UI schema. It does not prescribe CSS,
DOM structure, components or a JavaScript framework. A generator may create the
initial form, a human or agent may refine it, and a linter may check the binding
without making any of those tools part of the runtime contract.

The distinction is especially visible with agents: given HTML, they routinely
produce rich, task-specific interfaces; forced through a Questionnaire renderer,
the same forms collapse back to the renderer's widget vocabulary. The missing
piece is not another widget extension, but a standard bridge between an
unconstrained presentation and the Questionnaire data contract.

This approach complements SDC rather than replacing it: use a generic renderer
when portability is the priority; use Questionnaire-bound HTML when the
interface needs the full expressive power of the web.

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
| [Scaffold Generator](tooling.md) | Questionnaire | editable HTML + warnings |
| [Form Linter](tooling.md) | Questionnaire + HTML | findings + unverified scenarios |
| [Collector](collector.md) | Questionnaire + entry list | QuestionnaireResponse or issues |
| [Reactive Runtime](dynamic-behavior.md) | Questionnaire rules + current entries | enabled state + calculated previews |

All components share canonical path resolution, type binding, cardinality and
rule semantics. A Renderer is only an optional producer of conforming HTML.

## Reading order

### Core specification

1. [HTML binding](html-binding.md)
2. [FHIR type binding](type-binding.md)
3. [Dynamic behavior](dynamic-behavior.md)
4. [Collection and validation](collector.md)
5. [Server lifecycle and extraction](server-lifecycle.md)
6. [Conformance](conformance.md)

### Tooling and examples

- [Generator and linter](tooling.md)
- [Interactive HTML examples](/examples)

### Design notes

- [Decisions and open questions](design-notes.md)
- [Prior art](../prior-art.md)
