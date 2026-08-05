# Has anyone mapped forms to structured data before?

Research behind [`spec.md`](spec.md) — the bridge between HTML forms
and FHIR Questionnaire. The short answer is that three separate traditions have
each solved a piece of it, none has solved all of it, and the piece nobody has
published is the one we are writing: **a wire contract you can render against
without using the renderer.**

---

## 1. Nested data in field names

The oldest and by far the most deployed idea: encode structure in the `name`.

**Ruby on Rails** is the canon — `user[address][city]`, arrays as
`user[hobbies][]` or indexed `user[posts_attributes][0][title]`, parsed by
`Rack::Utils.parse_nested_query`. The same grammar is PHP's `parse_str`, Java's
Spring and ASP.NET model binding (`address.city`, `items[0].name`), OpenAPI's
`style: deepObject`, and — in JavaScript — [`qs`](https://github.com/ljharb/qs),
which is what modern stacks like Remix and Conform use to
[turn a form body into an object](https://sergiodxa.com/tutorials/use-qs-parse-to-use-nested-form-fields-in-remix).

W3C tried to standardise exactly this:
[**HTML JSON Form Submission**](https://www.w3.org/TR/html-json-forms/) —
`enctype="application/json"`, `[key]` for an object key, `[0]` for an index, `[]`
to append, defined merge rules when two paths collide, files as base64 objects
with `type`/`name`/`body`. First published 2014, abandoned 2015, implemented by no
browser. That is a warning worth keeping: **an encoding nobody else speaks costs
more than it looks**. Ours survives that test only because it stays ordinary
`application/x-www-form-urlencoded` — any server, any framework, any curl.

### Four things Rails knows that we did not

| Rails | what it solves | our state |
|---|---|---|
| `_destroy` in nested attributes | deleting a row is a **field**, not a DOM operation | we invented the same thing as `__drop` — independent confirmation, and their name is better documented |
| `id` inside a nested row | "this row already exists" vs "this row is new" | we only have identity for the **whole answer**; per row we renumber, which loses it |
| `child_index` — a UUID or timestamp for a newly added row | a new row's key must **not be positional**, or two additions collide | we compact indexes, which is fine within one submission and wrong the moment rows have identity |
| `authenticity_token` in every form | CSRF | not discussed in our spec at all. A gap, not a decision |

And the famous `check_box` trick: Rails renders a hidden `0` before every
checkbox so that "unchecked" still posts something. We solved the same problem
with two radios; theirs is the alternative and is worth naming in the corner-case
list rather than rediscovering.

### What the bracket tradition cannot do

It has **no types**. `qs` gives you strings and guesses arrays; W3C JSON Forms
coerces numbers and booleans by shape, which is how `"0123"` becomes `123` and a
patient identifier is destroyed. Every one of these systems needs a schema layer
on top to know what a value *is* — which is precisely the role the Questionnaire
plays for us, and why our parser types from the definition instead of from the
body.

Operational lesson from the same tradition: `qs` ships a **depth limit** (default
5) because unbounded bracket nesting is a denial-of-service vector, and it has a
history of [parsing bugs around literal brackets in
keys](https://github.com/ljharb/qs/issues/493). Any path grammar needs a depth
bound and a rule for the separators appearing inside a key. We have the second
(reserved characters, checked at import); we do not have the first.

---

## 2. Forms generated from a schema

[react-jsonschema-form](https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/uiSchema/)
and JSON Forms build a form from a JSON Schema plus a **separate UI schema**:
the data schema says *what*, the UI schema says *how it is drawn*. That
separation is the one part of this tradition that has survived a decade, and it
is exactly the split we made between the definition (`item`, `type`, `code`) and
layout (`itemControl`, `width`, and the renderer's own defaults).

Where they are weaker: field identity is **positional** (`root_address_city`),
so renaming or moving a field breaks saved state and every test. FHIR hands us
something better for free — `linkId` is required to be unique and is stable
across renames of everything around it.

---

## 3. XForms: the direct ancestor, and the lesson

W3C XForms (2003) had all seven concepts twenty years early, as *model item
properties* on a bind:

| XForms | SDC / us |
|---|---|
| `relevant` | `enableWhen` / `enableWhenExpression` |
| `calculate` | `calculatedExpression` |
| [`constraint`](https://doc.orbeon.com/xforms/core/validation) | `targetConstraint` |
| `required` | `required` |
| `readonly` | `readOnly` |
| `ref` / `nodeset` into an instance | our field paths into the response |
| `submission` | the exchange |

Browsers never implemented it. What survived is
[**Orbeon Forms**](https://doc.orbeon.com/xforms/core/binds) — an XForms engine
that **renders to plain HTML on the server** and keeps the model server-side.
That is our architecture, running in production since before htmx existed, which
is the strongest evidence available that server-rendered declarative forms are a
viable shape. And the failure mode is equally clear: XForms died where it
required a runtime in the browser that nobody shipped.

---

## 4. FHIR-specific renderers

[LHC-Forms](https://lhncbc.github.io/lforms/) (US National Library of Medicine)
is the most widely deployed: a JavaScript widget for SDC forms, with value-set
autocompletion, units, scoring and FHIRPath. CSIRO's Smart Forms, Google's
Android FHIR SDC library and Aidbox's Formbox are the same shape in other
runtimes.

Two observations matter for us:

- **All of them are client-side runtimes.** The form is assembled and validated in
  the browser (or the app), which is why every one of them needs a framework
  around it, and why none works with scripting off.
- **None publishes its wire contract.** The HTML is an implementation detail;
  input names are internal. Aidbox's Formbox, for instance, names its inputs
  `fb[answer][…]` — the Rails bracket convention again — but that is something you
  discover by reading the DOM, not something you can build against. We only know it because we
  read the DOM while writing a test helper that fills forms by `linkId`.

So the gap in the field is not "how do I render a Questionnaire" — there are good
answers. It is **"what does a page have to post for the server to accept it as an
answer"**, published, so that a hand-written screen, a test, an agent or another
team's UI can all produce the same QuestionnaireResponse. That is what our spec
is.

---

## 5. htmx

The transport we already use turns out to carry three findings.

- **htmx runs HTML5 validation before issuing a request from a form, and cancels
  the request when the form is invalid.** Our recompute round trip is a request
  from a form whose `required` fields are, mid-typing, empty by definition — so
  skip logic would not reveal anything until everything required was filled.
  The fix is not `novalidate` (that would also disable validation for a
  no-JavaScript user) but to **issue the recompute from a wrapper element**:
  `hx-trigger="change from:closest form"` with `hx-include="closest form"`.
  Validation applies to form elements; a wrapper posts the same body without it,
  and the real submit stays a form submit with validation intact.
- [**`hx-sync`**](https://htmx.org/attributes/hx-sync/) is the answer to the
  request storm a per-change recompute creates. `queue last` is the right
  strategy: `replace` aborts the in-flight request, which is exactly the
  `htmx:error: signal is aborted` we ran into in practice.
- **Out-of-band swaps** mean a changed score does not have to redraw the form —
  the server can return just the `<output hx-swap-oob>`. Redrawing the whole form
  on every keystroke is what costs focus and cursor position.

And htmx's `json-enc` extension implements the abandoned W3C bracket grammar, so
if a JSON body is ever wanted, that path exists and does not need inventing.

The deeper point is philosophical and predates us: htmx's "hypermedia as the
engine of application state — no client-side model" is our rule D34, argued by
somebody else first.

---

## 5a. Datastar — the same problem, solved from the other end

[Datastar](https://data-star.dev) is worth reading precisely because it is
**design C from our spec, built out properly**: a ~11 KB hypermedia framework
where the form's state lives in *signals*, not in field names.

```html
<input data-bind-item.q1.code>                  <!-- two-way bound to a nested signal -->
<div   data-show="$item.mood.code === 'bad'">…  <!-- enableWhen, as an attribute -->
<div   data-computed-total="$item.q1 + $item.q2 + $item.q3">
```

What it gets right, and what it costs us if we copied it:

- **Rules are attributes, so there is no transpiler.** `data-show` and
  `data-computed` say the rule where the element is; nothing is generated per
  form, and no expression language has to be compiled. That is genuinely simpler
  than what our spec proposes for `enableWhen`.
- **Signals are a nested tree already** (`data-signals-foo.bar.baz`), and a request
  sends **all signals as a JSON body** by default. There is no name-path grammar
  and no parsing algorithm — the shape arrives as a shape. That is the entire
  contents of our §Names and §The algorithm, deleted.
- **But the model is on the client.** Signals are the state, which is exactly the
  property we refused (D34): with no scripting there is no form at all, and there
  are now two places that know what the answer is.
- **And it needs `unsafe-eval`.** Datastar evaluates expressions through an IIFE,
  so its own security page tells you to allow `unsafe-eval` in the CSP. For a
  clinical deployment that is a conversation with somebody's security team; our
  generated-code-under-a-nonce path is not.
- **Its own escape hatch is a plain form.** `@post()` takes `contentType: "form"`,
  which posts the closest form as an ordinary form request — with browser
  validation — instead of the signal JSON. Even inside a signals framework, the
  moment you want the browser's own semantics you go back to name/value pairs.
- **One incompatibility to note if we ever went that way**: signal paths are
  dot-separated, and a `linkId` of `1.1` is ordinary in LOINC panels. The dot
  problem we designed around would come straight back.

Two things worth stealing regardless of architecture: **`data-custom-validity`**,
which sets a native validation message from an expression — a way to surface
server-side field errors through the browser's own error UI rather than our own
markup — and the SSE event `datastar-merge-signals`, which is the same idea as an
out-of-band swap for a computed value: send back the number, not the form.

---

## 6. What to take, and what stays ours

**Take:**

1. **Row identity** — Rails' `id` per nested row. Renumbering rows is right within
   one submission and wrong once a row means something (an amended reading, a
   deleted medication).
2. **Non-positional keys for new rows** — Rails' `child_index`. A row added in the
   browser should not claim an index that a server-side row already has.
3. **A depth limit** on paths, from `qs`. Cheap, and it closes a denial-of-service
   shape we currently have open.
4. **Merge rules for colliding paths**, from W3C JSON Forms — we have not said what
   happens when two names disagree about the shape of the same node.
5. **CSRF** — a token field, as every framework in this list has. Not in our spec
   at all.
6. **The three htmx rules** above: wrapper-issued recompute, `hx-sync: queue last`,
   out-of-band score.

**Keep:**

- **Names carry `linkId`s, not positions.** Nobody else in this list can survive a
  reordered form; we can.
- **The definition types the answer.** Every bracket-tradition parser guesses, and
  guessing on clinical data is how `"0123"` becomes a number and 36.8 °C becomes
  a fever.
- **No client runtime.** XForms shows the cost of requiring one; Orbeon shows that
  not requiring one works.
- **The contract is published.** That is the actual novelty: not a better renderer,
  but a mapping somebody else can implement.

---

## Sources

- [W3C, HTML JSON Form Submission](https://www.w3.org/TR/html-json-forms/) — the abandoned standard for exactly this problem
- [`qs`](https://github.com/ljharb/qs) and its [bracket-parsing edge cases](https://github.com/ljharb/qs/issues/493)
- [Using `qs.parse` for nested form fields (Remix)](https://sergiodxa.com/tutorials/use-qs-parse-to-use-nested-form-fields-in-remix)
- [react-jsonschema-form: uiSchema](https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/uiSchema/)
- [Orbeon Forms: binds](https://doc.orbeon.com/xforms/core/binds) and [validation](https://doc.orbeon.com/xforms/core/validation)
- [LHC-Forms](https://lhncbc.github.io/lforms/) · [lforms-fhir-app](https://github.com/LHNCBC/lforms-fhir-app)
- [htmx: `hx-sync`](https://htmx.org/attributes/hx-sync/) · [htmx docs](https://htmx.org/docs/)
- HL7 [Structured Data Capture IG](https://github.com/HL7/sdc) — read from source: `input/pagecontent/rendering.xml`, `behavior.xml`, `extraction.xml`
- [HTML Standard: form control infrastructure](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html) and [W3C HTML5 forms (LC)](https://dev.w3.org/html5/spec-LC/forms.html)
