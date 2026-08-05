# AGENTS.md

## Repository purpose

This repository specifies a bridge between ordinary HTML forms and FHIR
`Questionnaire`/`QuestionnaireResponse` resources. The central deliverable is a
published wire contract: a hand-written page, a test, an agent, or another UI
must be able to post the same name/value pairs as the supplied renderer and
produce the same `QuestionnaireResponse`.

The design grew out of clinical screens on Aidbox/FHIR, where the same form may
be used in a clinician chart and a patient portal, and useful answers must become
typed clinical records rather than opaque documents.

The repository contains the specification, a proc runtime, a strict parser,
focused parser tests, and a server-rendered examples UI. Distinguish this
implemented parser slice from the broader renderer/extraction features that
remain design work.

## Source documents

- `README.md`: short project statement and document index.
- `spec.md`: compatibility index for the former single-file draft.
- `docs/index.md`: authoritative reading order for the split specification.
- `docs/field-names.md`: normative wire grammar and component serialization.
- `docs/types.md`, `docs/collect-and-render.md`, `docs/exchange.md`, and
  `docs/expressions.md`: topical normative pages.
- `docs/decisions.md` and `docs/open-questions.md`: accepted and unresolved design.
- `prior-art.md`: research and lessons from Rails/bracket notation, W3C HTML JSON
  Forms, JSON Schema form generators, XForms/Orbeon, FHIR renderers, htmx, and
  Datastar.

Treat the topical pages linked from `docs/index.md` as the source of truth. Use `prior-art.md` to identify
known gaps and later operational lessons. If code and prose disagree, do not
silently choose one: document the conflict and either update the relevant
numbered decision or ask for a product decision.

## Non-negotiable design goals

1. The wire format is public and independent of the renderer.
2. The core form works as a native HTML form without a required client-side
   runtime. htmx and generated JavaScript are progressive enhancements.
3. A `Questionnaire` is the authority for structure, types, answer meaning,
   validation, skip logic, and extraction metadata.
4. The body may carry selected FHIR datatype components, but the server validates
   clinical identity and never derives meaning from display text.
5. The response is rebuilt by walking the definition, not by inferring a tree
   from submitted keys.
6. Rendering and collection share one name-building function and satisfy the
   round-trip invariant `collect(render(response)) = response` for editable
   content.
7. Server-side evaluation and validation are authoritative even when the browser
   performs the same work for responsiveness.
8. A recompute request writes nothing. Only an explicit submit writes an answer.
9. Clinical semantics belong in FHIR definitions and codes, not in bespoke page
   code.

## The two coordinate systems

Keep these concepts separate:

- `item.type` says what shape the answer has.
- `item.linkId` is the stable address of a question within this form.
- `item.code` says what the question means, usually using LOINC or SNOMED.
- `answerOption.valueCoding` or `answerValueSet` defines the vocabulary of the
  answers.
- `Questionnaire.code` says what the whole form is about.

A valid form may have no clinical codes. Such a form is a document whose answers
only make sense beside its definition; coded items can support extraction into
the clinical record.

## Field-name grammar

The contract is ordinary `application/x-www-form-urlencoded` or
`multipart/form-data` name/value pairs:

```text
field     = "item/" path [ ":" part ] | element | control
path      = { scope } linkId
scope     = linkId ( "#" | "@" ) index "/"
part      = "value" | "unit" | "system" | "code" | "display" | "text" | "reference" | "json"
element   = fhirPath
control   = "__submit" | "__drop"
index     = 0 | 1 | 2 | ...
```

There are two namespaces:

- Under `item/` is the answer tree, addressed by stable `linkId`s.
- Outside `item/` are `QuestionnaireResponse` elements addressed with FHIR-style
  dotted paths, plus `__` control fields.

Each separator has one role:

- `#`: one repetition of a group.
- `@`: one answer when child items hang from that specific answer.
- `/`: a scope level.
- `:`: an element of a composite answer.
- `.`: only a FHIR element separator outside `item/`; never a `linkId` separator.

Dots are allowed in `linkId` because identifiers such as `1.1` are common.
Reject a questionnaire at import/render time if a `linkId` contains `#`, `@`,
`/`, or `:`, or collides with a reserved control name. Never silently escape or
rename it because that breaks the public round trip.

Examples:

```text
item[sbp]                         primitive answer
item[weight].value                numeric half of a Quantity
item[weight].unit                 selected unit code
item[mood].system                 selected Coding system
item[mood].code                   selected Coding code
item[mood].display                optional Coding display
item[mood]                        optional sugar: system|code|display
item[mood].text                   open-choice free text
item[visit][1].item[bp][0].item[sys].value      nested repeating groups
item[mood][0].item[why]                  child of answer 0
item[photo].json                  composite escape hatch
```

## QuestionnaireResponse fields

Response-level values are ordinary named inputs, not a JSON blob or server-side
session:

- `questionnaire`: canonical URL; must match the addressed form.
- `subject.reference`: stated by the form and verified against the addressed
  subject. Refuse a mismatch.
- `id`: existing response being edited; absent for a new response. Verify it
  against the address.
- `authored`: retained only for an edit; the server stamps a new response.
- `status`: `completed` or `in-progress` at the form boundary. The server owns
  the final status transition, including `amended` for an existing answer.
- Other response fields can use the same dotted FHIR path convention, for
  example `encounter.reference` and `author.reference`.

Coding may be posted as explicit components. Validate `system + code` against
the definition or terminology binding and never use display as clinical identity.
Other derived displays and semantic components remain subject to verification.

## Body semantics

- `""` means no answer and must be removed before collection.
- `0` and `false` are real answers. Never use truthiness to detect presence.
- Repeated primitive values use the same field name and `FormData.getAll` style
  semantics.
- A selected choice posts its code, not display text or option position.
- An unchecked checkbox posts nothing, so a FHIR boolean is two radios. Use
  checkboxes only where no selected value genuinely means no answer.
- `__submit=1` distinguishes a write attempt from a recompute.
- `__drop=<encoded-name>,<encoded-value>` removes one submitted value before
  collection. Both halves must be URI-encoded because either may contain a
  comma.
- Unknown non-control fields are errors rather than ignored data.
- `readOnly` and hidden values are preserved or derived from trusted stored data
  and `initial`, never accepted merely because a crafted body posted them.
- A question disabled by `enableWhen` contributes no answer, including during an
  amendment. Do not retain a stale answer to a question that was not asked.

## Type mapping

FHIR R4 answerable types are `boolean`, `decimal`, `integer`, `date`, `dateTime`,
`time`, `string`, `text`, `url`, `choice`, `open-choice`, `quantity`,
`attachment`, and `reference`; `group` and `display` carry no answers. In R5,
`choice` and `open-choice` are replaced by `coding` plus `answerConstraint`.

Primitive answers use a bare path:

- `boolean` -> `valueBoolean`; render two radios with values `true` and `false`.
- `integer` -> `valueInteger`; use `type=number`, `step=1`.
- `decimal` -> `valueDecimal`; use `type=number`, `step=any`; accept a decimal
  comma as a decimal point, but reject non-numbers rather than storing `NaN`.
- `date` -> `valueDate`; choose the control by required precision: year,
  year-month, or full date. Partial FHIR dates must remain expressible.
- `dateTime` -> `valueDateTime`; `datetime-local` has no offset, so attach the
  server/site offset before storage.
- `time` -> `valueTime`.
- `string` and `text` both -> `valueString`; they differ only by single-line vs
  multiline control.
- `url` -> `valueUri`.

Composite answers use named parts:

- `quantity`: `:value` plus either a selected `:unit` or one unit declared by
  the definition. Fill code/system/printed unit from the definition.
- `choice`: `:code`; look up the full `valueCoding` in `answerOption` or trusted
  terminology data.
- `open-choice`: zero or more `:code` answers plus optional `:text`, which becomes
  `valueString` beside any `valueCoding` answers.
- `reference`: `:reference`; fill display on the server.
- `attachment`: currently `:json` as an escape hatch. Storage, scanning, and the
  Binary/DocumentReference design remain open.

One fixed unit may be implicit. If multiple units are offered, the answer must be
a `quantity`, the user must choose a unit, and a missing unit is an error. A
`decimal` with `unitOption` is contradictory because `valueDecimal` cannot carry
the choice. Store the entered value in its entered unit; conversions are for
display, range comparison, and analytics, not silent normalization on ingest.

## Collection algorithm

Collection is one definition-first walk with a scope stack:

1. Index all body entries as `name -> values`, preserving order and dropping
   only empty strings.
2. Apply `__drop` before reading any answer.
3. Evaluate `enableWhen` against the complete raw body, not a partially assembled
   response, so conditions may refer to later questions.
4. Skip `display` items.
5. Preserve/derive hidden and `readOnly` items from trusted stored or initial
   values; do not read them from the body.
6. For a non-repeating group, recurse without adding a scope. Emit the group even
   when it has no answered descendants so the response mirrors the form shape.
7. For a repeating group, discover every posted `#index`, sort numerically, walk
   each row, drop a completely empty trailing row, and compact response order.
   Posted indexes are submission-local identity, not stored positions.
8. At an answerable item, consume the parts legal for its declared type, convert
   using the definition, and attach answer-specific children with `@index`.
9. Validate requiredness, numeric/quantity ranges, length, regex, decimal places,
   units, and cross-field `targetConstraint`s.
10. Copy `linkId` and `text` from the definition into response items.
11. After the walk, report every unused non-control, non-response-element field
    as an unknown-field error.
12. Build response identity and metadata, then let the caller verify address-bound
    values and decide whether this is a recompute, draft, new answer, or amend.

Row indexes must be discovered rather than counted. A request containing rows
`#0` and `#2` after deletion is valid; it becomes two ordered response
repetitions with no indexes stored in FHIR.

## Rendering algorithm

Rendering is the inverse definition walk and must call the same name builder:

- `display` -> paragraph, never a field.
- non-repeating `group` -> `fieldset` and children.
- repeating `group` -> one row per response repetition plus one empty trailing
  row for native no-script addition.
- answerable item -> label, type-specific control, help, and keyed field error.
- answer children -> recurse with an `@index` scope.
- a closed branch should not render if it can disappear; if it must remain
  visible as protected/disabled content, use `<fieldset disabled>`.
- `readOnly` should render as text or disabled controls, not `readonly`, because
  `readonly` controls are still submitted.

Use HTML semantics instead of recreating them:

- Tree order determines repeated answer order.
- Only the activated submit button contributes its name/value.
- Disabled controls are neither submitted nor constraint-validated.
- The first legend inside a disabled fieldset is exempt, which is the only safe
  location for a toggle that controls that section.
- `formaction` and `formnovalidate` make "Save draft" a second submit button.
- The `form` attribute can associate controls outside the form element.
- `<output for>` identifies calculated dependencies.
- `_charset_`, `dirname`, `month`, `week`, `datalist`, `accept`, `multiple`, and
  `inputmode` should be used when their native semantics match FHIR/SDC.

Layout priority is: meaningful renderer defaults, then SDC-declared layout
extensions, then a bespoke page using the same wire contract. Respect
`itemControl`, `width`, `columnCount`, `choiceOrientation`, `collapsible`, and
`shortText`; do not silently override definition-declared layout.

DOM markers are for tests, agents, and accessibility, not trusted request data.
Place `data-field`, `data-type`, `data-required`, and current `data-unit` on the
existing control wrapper where useful. Do not duplicate semantic data in markers
when it already exists in controls or the form action.

## Request/response exchange

One address handles all form actions:

- No `__submit`: collect, reevaluate conditions and calculations, write nothing,
  and return the form fragment.
- `__submit=1` with errors: write nothing and return the form with field-keyed
  errors (`data-invalid`, `data-role=error`).
- Valid final submit: save via `questionnaire.answer`, run declared extraction,
  close an associated Task if applicable, and return the answers grid plus
  `hx-location` for the canonical saved URL.
- Draft submit: a second button uses `formaction` with `status=in-progress` and
  `formnovalidate`; save without extraction and return the form.

New response identity comes from an address such as `response=new`; an existing
ID means amend. Double submission of the same address must amend the same answer,
not create a duplicate. New final answers become `completed`; editing an existing
answer records an amendment rather than silently replacing a clinical event.

If extraction is declared, publish the `Questionnaire` to the FHIR server before
calling `$submit`. Extracting zero resources when extraction was promised is an
error, not a successful save with a warning. Amending an answer must update its
previously extracted resources rather than create a duplicate set.

## Progressive enhancement and expressions

The server may transpile supported FHIRPath-based `enableWhenExpression` and
`calculatedExpression` rules into small, plain JavaScript functions. It must not
ship a FHIRPath engine or assemble a FHIR response in the browser.

- Resolve paths at compile time to reads of the public field names.
- Inline generated code under a per-response CSP nonce; do not require
  `unsafe-inline` or `unsafe-eval`.
- Attachment must be idempotent across htmx swaps. Bind listeners to the replaced
  form, not global state.
- The transpiler may refuse unsupported rules. Those dependencies retain a
  server recompute round trip.
- The server reevaluates every condition and calculation during collection.
- Test the server evaluator and generated module over identical answers and
  require identical results.
- Calculated/read-only scores are displayed without a `name` and are never
  posted. The server computes their stored value.

`prior-art.md` records an important htmx correction that is not fully integrated
into all examples in `spec.md`: a recompute initiated by the `<form>` itself may
be blocked by native validation while required fields are incomplete. Prefer a
wrapper-issued request with `hx-trigger="change from:closest form"` and
`hx-include="closest form"`, leaving the real submit subject to native
validation. Use `hx-sync` with `queue last` for change storms; `replace` aborts
in-flight requests. Prefer out-of-band swaps for isolated computed outputs so a
keystroke does not replace the whole form and lose focus/cursor state.

The no-client-runtime requirement means the form remains usable without scripts,
not that optional htmx or generated rule code is forbidden.

## Validation and errors

The browser may mirror cheap checks (`required`, `min`, `max`, `step`,
`maxlength`, `pattern`) for immediate feedback, but the server repeats all
checks. Return errors keyed by `linkId`, plus a form/body-level key for problems
that do not belong to one item.

Support SDC `targetConstraint` for cross-field rules. It carries an expression,
human message, and severity and is evaluated after assembling the response.
Never bury clinical cross-field logic in one renderer.

Remember browser edge cases:

- `type=number` may submit an empty string for unparsable input, making invalid
  optional input indistinguishable from blank input.
- `type=range` always submits a value, so it cannot represent an optional answer
  without a separate "not answered" mechanism.
- Enter may activate the first submit button. Never place a row `__drop` button
  before the real submit button in tree order.
- A `<button>` without `type` submits.
- A `fieldset` cannot wrap table rows; `gtable` must disable controls per row.
- Fieldsets have CSS sizing/layout quirks; place grid/flex layout on an inner
  element.
- Textarea line endings normalize to CRLF, while HTML length and FHIR character
  counting may differ for Unicode. Server validation decides.

## Extraction semantics

Use the lightest FHIR SDC extraction mechanism that represents the clinical
meaning:

- Observation-based: measurements, scores, and screening results. Put
  `item.code` on questions and a panel code on a coded group; use inherited
  `observationExtract: true` where appropriate.
- Definition-based: `Condition`, `AllergyIntolerance`,
  `MedicationStatement`, and other resources. Put the target resource definition
  on the group and target element definitions on questions.
- Template-based: fixed surrounding resource content with answer placeholders.
- StructureMap-based: last resort for transformations the simpler mechanisms
  cannot express.

A single form may combine mechanisms. Model what the answer actually means: a
patient-reported history, an encounter diagnosis, and a managed problem may use
similar controls but are not the same clinical resource.

For calculated screeners such as PHQ-9, ordinal weights live on answer options,
the total is a coded calculated read-only item, and interpretation bands do not
belong in the form because clinical interpretation changes by guideline and
population.

## Security and robustness

- Verify all address-bound response fields; never trust or silently ignore a
  mismatch.
- Refuse reserved/separator collisions before rendering.
- Add an explicit maximum path depth before exposing a parser; bracket-notation
  parsers demonstrate that unbounded nesting is a denial-of-service shape.
- Define deterministic behavior for colliding paths before accepting arbitrary
  external posters.
- Add CSRF protection. The current specification does not define it.
- Avoid `unsafe-eval`; Datastar requires it for expression evaluation and is not
  the chosen state model.
- Browser state is not the source of truth. Signals, a client-side response tree,
  or DOM-only deletions would create a second model.

## Current implementation gaps recorded by the design

The following behavior is specified but was not built when `spec.md` was
written:

- round-tripping response-level fields such as `id`, `authored`, `status`, and
  `subject.reference` without losing hidden content on amend;
- correct hidden-item handling;
- server enforcement of `readOnly`;
- reserved-name validation;
- repeating group paths and collection;
- `answer.item` follow-ups;
- real attachment and reference handling;
- partial dates and `dateTime` offsets;
- cross-field `targetConstraint` validation;
- `shortText`, `unitOpen`, and `openLabel` support;
- `minLength` and `maxDecimalPlaces` enforcement;
- expression transpilation and parity testing where marked "specified".

Do not describe one of these as implemented unless this repository later gains
code and tests demonstrating it.

## Prior-art lessons still to incorporate

- Persistent repeating rows need stable row IDs and non-positional keys for new
  rows. Submission-local compact indexes are not enough once a row can be amended
  or deleted as an identifiable clinical entity.
- Define a path depth limit and path-collision merge/error rules.
- Define CSRF handling.
- Consider native custom validity for presenting server field errors.
- Keep htmx recompute off the validated form element, queue only the latest
  pending change, and update isolated computed values out of band.

Do not copy Rails bracket syntax blindly: it has no types, guesses shape, and is
position-oriented. Do not copy Datastar signals as the source of form state:
they remove the name grammar only by moving the authoritative model into a
required client runtime and introduce dot collisions with ordinary FHIR
`linkId`s.

## Open product/design questions

These remain undecided and should not be resolved accidentally in code:

- Q1: sign stated `subject.reference`/`id` with HMAC, or only verify against the
  address?
- Q2: ship drafts as a product feature, despite the mechanism being specified?
- Q3: render old answers against their original form version or the current
  version after a questionnaire changes?
- Q4: reject unknown fields from external posters too, or offer a compatibility
  mode?
- Q5: support UCUM unit conversion?
- Q6: where does paged/wizard form state live?
- Q7: where are attachment bytes stored, and how are they scanned?
- Q8: should amendments create `Provenance`?
- Q9: use ETag/`If-Match` for concurrent amendments instead of last-write-wins?
- Q10: how are rendered and stored translations selected?

## Tests an implementation must have

- Round trip every supported type and nesting/repetition shape.
- Preserve `0`, `false`, answer order, entered units, and partial temporal values.
- Drop empty values, empty trailing rows, disabled answers, and `display` items.
- Reject unknown fields, illegal type parts, reserved `linkId`s, spoofed response
  metadata, invalid codes/units, and malformed JSON escape-hatch values.
- Exercise non-contiguous and nested repetition indexes plus answer-scoped child
  items.
- Verify native submit, recompute, validation failure, draft, new response,
  amendment, double submit, extraction, and extraction amendment behavior.
- Verify generated-expression results against server evaluation for every form.
- Verify no-script operation and scripted progressive enhancement produce the
  same stored response.
- Cover htmx request ordering, incomplete required fields during recompute, focus
  preservation, and repeated fragment swaps.

## Working rules for future agents

- Read the numbered decisions and relevant open questions before changing the
  protocol.
- Reuse one canonical name parser/builder in rendering, collection, tests, and
  generated expressions.
- Do not infer types from request strings or field shape.
- Do not add an opaque response blob, client-side authoritative model, mandatory
  JavaScript runtime, or session-held draft as a shortcut.
- Do not silently relax unknown-field handling, metadata verification, disabled
  branch behavior, or extraction failures.
- When changing the contract, update `spec.md`, its decision register, worked
  examples, `prior-art.md` implications if relevant, and this file together.
- Keep R4 and R5 type differences explicit rather than blending their models.
- Prefer ordinary HTML semantics and server authority over custom browser code.

## Canonical field-path grammar

Use `item[linkId][index].component` throughout this project. Brackets select a
Questionnaire item or repeat occurrence; dots navigate to `.item[childLinkId]` or
a FHIR datatype component. Preserve the full QuestionnaireResponse ancestry.
Indexes are zero-based and used only for repeating Questionnaire items. Percent-
encode `linkId` selector contents using UTF-8 and decode each selector once after
normal HTML form decoding.

```text
item[visit][0].item[diagnosis][1].system
item[visit][0].item[diagnosis][1].code
item[visit][0].item[diagnosis][1].display
```

Do not introduce the obsolete slash paths, `#`/`@` repeat markers, or colon
components. The optional atomic Coding sugar remains
`item[diagnosis]=system|code|display`; never mix it with component fields for the
same occurrence.

## Parser specification

The normative form-to-QuestionnaireResponse algorithm is in `docs/parser.md`.
Keep path tokenization, Questionnaire resolution, occurrence grouping, datatype
parsing, validation, and FHIR materialization as separate stages. The parser is
strict and definition-driven; never infer a nested JSON shape from field-name
punctuation or silently repair ambiguous input.

## Working with procx

`./procx` is this repository's local wrapper around the copied proc runtime. It
uses the five-digit port configured in `package.json`; the running process writes
the effective port and REPL secret under `.runtime/`.

```sh
./procx start
./procx port
./procx repl 'Object.keys(ctx.fns.parser)'
```

Functions under `src/<namespace>/<name>.ts` become
`ctx.fns.<namespace>.<name>`. Call them through `ctx.fns`; do not import one
project procedure from another because registry calls preserve hot replacement
and injected context.

Use `dev.def` for the primary REPL-driven edit loop. It validates syntax, writes
the file, registers it in the live process, and regenerates registry types in one
operation:

```sh
./procx repl -f /dev/stdin <<'REPL'
await ctx.fns.dev.def({
  name: "example.echo",
  code: "export default function (_ctx: Context, _session: Session | null, opts: { value: string }) { return opts.value; }"
});
ctx.fns.example.echo({ value: "live" })
REPL
```

When a file was edited by an external editor, hot-load it without restarting:

```sh
./procx repl 'ctx.fns.dev.sync({ rel: "parser/parse.ts" })'
```

Run focused checks inside the process:

```sh
./procx repl 'ctx.fns.dev.typecheck({ filter: "parser/" })'
./procx repl 'ctx.fns.dev.test({ filter: "src/parser/parser.test.ts" })'
```

Keep one runtime process. Ordinary procedures and routes are replaced with
`dev.def` or `dev.sync`; restart only after changing boot-time files such as
`src/$main.ts` or lifecycle `$start.ts` closures. The REPL is loopback-only and
is disabled in production.

## Tailwind and specification UI

Tailwind CSS v4 is compiled locally; do not restore the CDN loader from the
original `~/procs` layout. `src/styles/app.css` is the source and
`.runtime/app.css` is generated output. The `tailwind` lifecycle module builds
CSS before the HTTP server starts. Rebuild after changing CSS or utility classes:

```sh
./procx repl 'ctx.fns.tailwind.build({})'
# or
bun run css:build
```

The `/spec` UI uses path navigation such as `/spec/parser` and
`/spec/examples/diagnosis`. It parses trusted repository Markdown with Bun's native
`Bun.markdown.html(..., { headings: true })`, then highlights fenced code with
the shared `ctx.fns.ui.highlight` Shiki procedure. Its navigation is derived from
`docs/**/*.md`, plus `prior-art.md` and the compatibility `spec.md`; do not copy
specification prose into TypeScript templates. Bun marks this Markdown API as
unstable, so check the Bun docset before changing its options.

Each example is one procedure in `src/examples/cases/<name>.ts` exposed as
`ctx.fns.examples.cases.<name>` and returns its metadata, Questionnaire, and HTML
form together. Shared HTML operations are likewise one procedure per file under
`src/examples/ui/`. Do not recreate monolithic form or Questionnaire registries;
`catalog` only enumerates case procedures and `getCase` resolves an ID or URL
slug. The `/examples/<case>` UI keeps grouped navigation in the left sidebar
while one selected example occupies the full content column. Every case renders
three server-owned views: the live form,
its exact Prettier/Shiki HTML, and the parsed JSON response or rejection. A form
posts with htmx and replaces its whole card, returning with the response tab
selected; do not introduce client-side response state. Keep the valid and
expected-rejection cases aligned with the actual parser surface and parser tests.

Example controls use the shared IFTA treatment from `examples.ui.styles`:
`ifta-field` keeps an always-visible label inside the top of the field, the
control sits below it without independent chrome, and `ifta-grid` collapses
adjacent fields to single table-like rules. Keep focus indication on the whole
cell with `:focus-within`; do not replace IFTA with placeholder or animated
floating-label patterns.

FHIR groups and repeated occurrences use `ctx.fns.examples.ui.group`: preserve
`fieldset`/`legend` semantics, render the plain group name outside, then give that
group's IFTA cells their own rounded shell. Grouped cases disable the form-level
shell, producing repeated `name → [fields]` blocks rather than nesting group
headings inside one border. Do not turn the group name into a header band or card.

Nested groups use `nested: true` on `examples.ui.group` (or a helper such as
`examples.ui.coding`). The `fieldset` remains semantic only: its plain legend is
above an inset IFTA block with a thin outline and 4px radius. Never cut the nested
legend into the border or give it a second large rounded card shell.

Submit actions stay semantically inside `<form>` but visually outside the rounded
field shell, aligned at the lower right with no surrounding border. Buttons are
compact rectangles with a small radius, never pills.

Repeat-row enhancement uses `ctx.fns.examples.ui.repeat` and the external
`/examples/repeats.js` script. The server owns a trusted `<template>` containing
ordinary controls with an explicit index token such as `__INDEX__`; JavaScript
only replaces that token with the next consecutive integer and inserts the
fragment. It must not assemble a QuestionnaireResponse or maintain a parallel
answer model. Event delegation keeps additions working after htmx swaps.
