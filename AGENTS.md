# AGENTS.md

## Repository purpose

This repository specifies a presentation-layer contract between arbitrary HTML
forms and FHIR Questionnaire/QuestionnaireResponse. A hand-written page, generic
renderer, test, agent, or another UI may use different markup while producing the
same typed QuestionnaireResponse.

The repository also contains a procx runtime, a strict Collector implementation,
focused tests, and server-rendered examples. Do not describe design-only
components as implemented unless code and tests exist.

## Source of truth

- docs/index.md is the specification overview and authoritative reading order.
- docs/field-names.md defines the canonical public field-path grammar.
- docs/entry-list.md defines the browser submission model.
- docs/types.md defines lexical-to-FHIR type binding.
- docs/parser.md defines collection and result validation.
- docs/server-lifecycle.md defines recompute, persistence, and extraction order.
- docs/conformance.md defines normative conformance requirements.
- docs/decisions.md records accepted design decisions.
- docs/open-questions.md records unresolved design questions.
- prior-art.md is research, not normative text.
- spec.md is only a compatibility index for the former single-file draft.

Keep each rule in one normative page and link to it elsewhere. Do not copy the
specification into this file, TypeScript templates, or worked examples.

## Non-negotiable invariants

1. Questionnaire is the authority for item structure, types, constraints,
   terminology, behavior, and extraction metadata.
2. HTML is the presentation language. The specification does not introduce a
   second UI schema.
3. The public wire contract is independent of any renderer, CSS system, browser
   runtime, or server framework.
4. The Collector consumes an ordered HTML form entry list and resolves it against
   the Questionnaire. It never infers a JSON tree from punctuation.
5. Collector, Form Linter, Reactive Runtime, and Renderer share one binding
   kernel for paths, types, cardinality, and reactive semantics.
6. Client behavior is progressive enhancement. Server collection and rule
   evaluation remain authoritative.
7. Disabled, calculated, read-only, and server-owned values are not trusted
   because a browser posted them.
8. Rendering and collection use the same name builder and preserve editable
   answers across a render/collect round trip.
9. Clinical identity comes from Questionnaire definitions and trusted
   terminology, never from display text.

## Canonical field paths

Use only the grammar documented in docs/field-names.md:

~~~text
item[linkId]
item[linkId][0]
item[group][0].item[child]
item[quantity].value
item[coding][0].system
item[coding][0].code
~~~

Brackets select Questionnaire items and repeat occurrences. Dots navigate to
child items or supported FHIR datatype components. Repeat indexes are zero-based.
Percent-encode linkId selector contents as specified and decode them exactly once.

Do not introduce obsolete slash paths, hash/at repeat markers, or colon
components. Optional atomic Coding sugar is documented in docs/field-names.md;
never mix it with component fields for the same occurrence.

Keep these concepts distinct:

- item.type determines the answer shape;
- item.linkId addresses a question within the Questionnaire;
- item.code expresses clinical meaning;
- answerOption or answerValueSet constrains answer vocabulary;
- Questionnaire.code expresses the meaning of the whole form.

## Source layout

Procedures use one function per file. A file under
src/<namespace>/<name>.ts becomes ctx.fns.<namespace>.<name>. Call project
procedures through ctx.fns rather than importing them directly so hot
replacement, injected context, and registry typing remain intact.

The Collector pipeline keeps tokenization, Questionnaire resolution, occurrence
grouping, type binding, validation, and QuestionnaireResponse materialization as
separate stages.

Each example is one procedure under src/examples/cases. Shared form primitives
live under src/examples/ui. Do not create a second monolithic example registry;
the catalog enumerates case procedures and getCase resolves them.

## Working with procx

The local wrapper is ./procx. It uses the five-digit port configured in
package.json and stores runtime state under .runtime.

~~~sh
./procx start
./procx port
./procx repl 'Object.keys(ctx.fns.parser)'
~~~

Use dev.def for the REPL-driven edit loop. When an external editor changed a
procedure, sync it without restarting:

~~~sh
./procx repl 'ctx.fns.dev.sync({ rel: "parser/parse.ts" })'
~~~

Focused checks run inside the live process:

~~~sh
./procx repl 'ctx.fns.dev.typecheck({ filter: "parser/" })'
./procx repl 'ctx.fns.dev.test({ filter: "src/parser/parser.test.ts" })'
~~~

Keep one runtime process. Restart only after boot-time or lifecycle changes such
as src/$main.ts or a $start.ts closure. The REPL is loopback-only and disabled in
production.

## Specification UI

Specification prose lives in Markdown. The /spec UI derives its navigation from
docs/**/*.md plus prior-art.md and spec.md. It renders Markdown with Bun and
highlights code through the shared Shiki procedure. Do not duplicate prose in
route templates.

Tailwind CSS v4 is compiled locally. src/styles/app.css is the source and
.runtime/app.css is generated:

~~~sh
./procx repl 'ctx.fns.tailwind.build({})'
# or
bun run css:build
~~~

## Examples UI

Every example exposes three server-owned views: live form, exact highlighted
HTML, and parsed response or rejection. Forms post with htmx and replace their
card; do not introduce client-side QuestionnaireResponse state.

Preserve the established IFTA form language:

- labels stay visible inside the top of fields;
- adjacent fields share single table-like borders;
- groups use semantic fieldset/legend with the plain group name above the field
  shell;
- nested groups use a small inset outline rather than another large card;
- submit actions remain semantically inside the form but visually outside the
  field shell;
- buttons are compact rectangles, not pills.

Repeat enhancement uses a trusted server-rendered template and replaces only its
explicit index token. JavaScript may add, remove, and renumber controls; it must
not construct a response tree or become the answer model.
