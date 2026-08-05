# A bridge between HTML forms and FHIR Questionnaire

A **Questionnaire** is a typed tree with codes on it. An **HTML form** is a flat
list of name/value pairs. This document is the bridge between them: how a
questionnaire becomes a page, how the page's `POST` becomes a
**QuestionnaireResponse**, and every decision and corner case in that mapping.

It is written to be usable without our renderer — a page with its own markup can
post the same names and get the same answer — and to work with no JavaScript at
all, because a clinical form that stops working when a script fails is not a form.

## The problem

The two shapes do not line up, and every difference between them is somewhere a
form loses data:

| a Questionnaire has | an HTML form has |
|---|---|
| a tree of items, nested and repeatable | one flat list of names |
| a type per question, and typed answers (`valueQuantity`, `valueCoding`) | strings |
| codes that say what a question means | nothing of the kind |
| units, ranges, skip logic, calculations | `required`, `min`, `max`, and a browser's goodwill |
| answers that mirror the tree | pairs, in whatever order the browser felt like |

And the browser has its own facts that no specification can argue with: an
unchecked checkbox posts nothing at all, a file input cannot be refilled by the
server, `datetime-local` has no offset, an empty field is indistinguishable from a
missing one unless somebody decides what that means.

So the bridge has to answer four questions, and the rest of this document is those
four answers: **what a field is called**, **what the body means**, **what comes
back**, and **who decides** when the two disagree.

## What is being bridged

### The definition

A Questionnaire is a recursive tree of `item`. Every node has a **`linkId`**
(unique in the form — its address), a **`type`**, and usually **`text`** (what a
person reads). `group` holds children and carries no answer; `display` is a
paragraph; everything else is answerable, and the answer mirrors the tree —
`QuestionnaireResponse.item[]` with the same linkIds.

Beside the type sits **`code`**, and it is a different coordinate system
altogether:

| | says |
|---|---|
| `type` | what the answer looks like — a number, a date, a choice |
| `linkId` | where the answer goes in this form |
| `item.code` | what the question **means** — LOINC, SNOMED. This is what makes a form a source of records rather than a document |
| `answerOption.valueCoding` / `answerValueSet` | the vocabulary of the **answers**, not of the question |
| `Questionnaire.code` | what the whole form is about |

A form with no codes is perfectly valid. It is a document: the answers make sense
next to it and nowhere else.

### The types

`group`, `display`, and then: `boolean`, `decimal`, `integer`, `date`, `dateTime`,
`time`, `string`, `text`, `url`, `choice`, `open-choice`, `quantity`,
`attachment`, `reference`.

Two that surprise people: `string` and `text` differ **only in how they are
typed** — both produce `valueString`, so this is the one place where the type
encodes layout rather than meaning. And in **R5 `choice`/`open-choice` are gone**,
replaced by one `coding` type plus `answerConstraint` (`optionsOnly` ·
`optionsOrType` · `optionsOrString`) — which is the more honest model: "pick, or
write your own" is a constraint, not a different kind of answer.

### The answer

A QuestionnaireResponse mirrors the questionnaire: `item[]` with the same
`linkId`s, nested the same way, each answerable item carrying `answer[]` and each
answer one of a dozen `value[x]`. A repeating group appears once per repetition,
in order; items that hang off a particular answer sit inside it. Nothing in the
response says how it was collected — which is the point, and also why the mapping
below has to be exact.

# Part one — the mapping

## Three rules

1. **Everything that reaches the server is a field.** The answer's own elements —
   which form it answers, whose it is, when — are named inputs like any other.
   There is no JSON blob, no session state, nothing a hand-written page cannot
   post.
2. **A field name is a path, and the path is made of `linkId`s.** FHIR requires
   `linkId` to be unique inside a questionnaire, so nesting never has to appear —
   only repetition does.
3. **The answer is rebuilt from the definition, not from the body.** `collect`
   walks the questionnaire's `item` tree and asks the body for values by name.
   That is why an unknown field is an error rather than a silent loss, why a
   question closed by `enableWhen` is not "missing", and why the response nests
   exactly as the form does.

## Names

```
field     = "item/" path [ ":" part ] | element | control
path      = { scope } linkId                    ; the answer tree — our grammar
scope     = linkId ( "#" | "@" ) index "/"      ; one per repeating ancestor
part      = "value" | "unit" | "code" | "text" | "reference" | "json"
element   = fhirPath                            ; the resource — FHIR's own grammar
control   = "__submit" | "__drop"
index     = 0 | 1 | 2 | …
```

**Two namespaces, and `item/` is the border between them.** Under `item/` is the
answer tree, addressed by our grammar — the segments are `linkId`s, not FHIR
elements. Everything else is the QuestionnaireResponse itself, addressed the way
FHIR addresses its own elements: a dotted path (`subject.reference`, `status`,
`encounter.reference`). Each side gets the grammar that is natural to it, and the
prefix says which side you are on.

**One character, one role.** Inside `item/`: `#` is a repetition of a group, `@` a
repetition of an answer, `/` a level, `:` an element of a composite answer.
Nothing is positional — the character in front of a token says what the token is,
so another part can be added later without disturbing anything. The dot is free to
mean "FHIR element" outside `item/` precisely because it is not a separator
inside it.

A `linkId` may contain a dot (`1.1` is ordinary in LOINC panels) — which is why
the dot is not a separator. It may not contain `#`, `@`, `/` or `:`, and it may
not be one of the reserved names above; FHIR does not forbid either, so both are
checked when a form enters the project.

### The answer's own elements

Named by their FHIR path, so nothing new has to be invented as more of them are
needed:

| name | is | rule |
|---|---|---|
| `questionnaire` | canonical url of the form being answered | must match the form the address names |
| `subject.reference` | `Patient/anna` | **checked against the address**; a mismatch is refused, never ignored and never obeyed |
| `id` | the answer being edited; absent means a new one | a new answer gets its id from the server |
| `authored` | when it was answered | accepted only on an edit; a new answer is stamped by the server |
| `status` | `completed` · `in-progress` | `in-progress` is a draft: saved, not finished |
| `encounter.reference`, `author.reference`, … | whatever else the response carries | the same grammar, no new protocol |

`subject.display` is never sent, for the same reason `:system` and `:display` are
never sent for a coding: a browser has no business asserting what a reference or a
code means. The server fills those in.

There is no opaque blob anywhere in this: a `hidden` item is an ordinary hidden
input under `item/…` — the same mechanism as everything else
rather than an exception to it — and the server re-verifies those values instead
of trusting them, because a hidden input is only hidden from the eye.

### Answers

| name | means |
|---|---|
| `item/sbp` | `item[sbp].answer[0]` — the whole answer, allowed **only for a primitive** type |
| `item/sbp` twice | `.answer[0]`, `.answer[1]` — a `repeats` question |
| `item/bp#0/sys:value` + `…:unit` | a `quantity`: neither half is the answer on its own, so both are named |
| `item/mood:code` | a `choice`: the browser sends the **code**; the system and display come from the definition |
| `item/mood:text` | the free text of an `open-choice`, beside the code |
| `item/visit#1/bp#0/sys:value` | scopes stack — the index belongs to the nearest repeating ancestor |
| `item/mood@0/why` | an item nested under answer 0 of `mood` |
| `item/photo:json` | the escape hatch: a JSON fragment for one answer — an attachment, a coding with several codes |
| `__submit=1` | this is a submission; anything else is a recompute |
| `__drop=<name>,<value>` | remove one value from a repeating field before collecting |

**The suffix mirrors the datatype.** A bare path is the answer, and that is legal
only where `value[x]` is a primitive (`integer`, `decimal`, `string`, `text`,
`date`, `dateTime`, `time`, `boolean`, `url`). Where the answer is composite —
`Quantity`, `Coding`, `Reference`, `Attachment` — each element that the browser
may legitimately send is named: `:value`, `:unit`, `:code`, `:text`,
`:reference`. Two things follow: `:value` without `:unit` on a quantity offering
several units is an error, not a default; and `:system` / `:display` are never
sent at all — a browser has no business asserting what a code means.

### What a browser may say

One rule decides which parts exist at all: **the body carries what a person chose
or typed; it never carries what those choices mean.**

| part | is | comes from |
|---|---|---|
| `:value` | the number they typed | the person |
| `:unit` | **the code** of the unit they picked from `unitOption` | the person |
| `:code` | the code of the option they picked | the person |
| `:text` | what they typed when the list had nothing for them (`open-choice`) | the person |
| `:reference` | which resource they picked | the person |
| `:json` | an answer the grammar cannot spell — an attachment | the person, escaped |
| — | `Coding.system`, `Coding.display`, `Quantity.unit` (the printed one), `Quantity.system`, `Reference.display` | the **definition**, filled in by the server |

`:text` looks like an exception and is not: for an `open-choice` the answer is
either a `valueCoding` or a `valueString`, and the suffix says which of the two
arrived — it is the answer itself, not a label for another answer. Whereas a
display or a system **is** derivable: the code `33586001` came out of
`answerOption`, where its system and display are sitting. Allowing the browser to
send them buys exactly one new class of bug — an answer whose code says
`33586001` and whose display says "Sitting" while the definition says otherwise,
with both halves looking perfectly valid and nobody ever noticing.

So `:unit=kPa` means "the person picked the kPa option"; the stored
`valueQuantity` gets `code: kPa`, `system: http://unitsofmeasure.org` and whatever
`unit` string the definition prints — none of which crossed the wire.

An empty value is **no answer**, not an empty answer: `item/sbp=` produces no
`answer[]` at all, which is what makes `required` mean something.

## Every type, end to end

One block per type: what is written in the form, what the browser renders, what it
posts, what is stored. Names follow the grammar above — a bare path for a
primitive, named parts for a composite answer.

### boolean

```yaml
- { linkId: smoker, type: boolean, text: Do you smoke? }
```
```haml
%div{ data: { field: "item/smoker" }, role: "radiogroup", "aria-label": "Do you smoke?" }
  %label
    %input{ type: "radio", name: "item/smoker", value: "true" }
    Yes
  %label
    %input{ type: "radio", name: "item/smoker", value: "false" }
    No
```
```
item/smoker = true        →   { linkId: smoker, answer: [{ valueBoolean: true }] }
```

Two radios, never a checkbox: an unchecked box posts nothing, so "no" and "not
answered" would arrive as the same request.

### integer · decimal

```yaml
- { linkId: slept, type: integer, text: Hours slept, extension: [ minValue 0, maxValue 24 ] }
- { linkId: hba1c, type: decimal, text: HbA1c }
```
```haml
%input{ name: "item/slept", type: "number", step: 1,     min: 0, max: 24 }
%input{ name: "item/hba1c", type: "number", step: "any" }
```
```
item/slept = 6            →   answer: [{ valueInteger: 6 }]
item/hba1c = 6.4          →   answer: [{ valueDecimal: 6.4 }]
```

`step="any"` on a decimal, or the browser silently refuses `6.4`. A comma typed
for the decimal point is read as one; anything that is not a number at all is an
error on the field, never a `NaN` in the record.

### quantity

```yaml
- linkId: weight
  type: quantity
  text: Weight
  extension:
    - { url: .../questionnaire-unitOption, valueCoding: { system: http://unitsofmeasure.org, code: kg } }
    - { url: .../questionnaire-unitOption, valueCoding: { system: http://unitsofmeasure.org, code: "[lb_av]" } }
```
```haml
%input{  name: "item/weight:value", type: "number", step: "any" }
%select{ name: "item/weight:unit" }
  %option{ value: "kg" } kg
  %option{ value: "[lb_av]" } lb
```
```
item/weight:value = 83.5
item/weight:unit  = kg    →   answer: [{ valueQuantity: { value: 83.5, unit: kg, code: kg,
                                                          system: http://unitsofmeasure.org } }]
```

Both halves are named because neither is the answer alone. With one declared unit
(`questionnaire-unit`) the select disappears, `:unit` is not posted, and the
server fills the unit in from the definition — but `:value` stays, because the
type is still composite.

Whether the offered units are the only ones allowed is the definition's to say:
SDC's `unitOpen` distinguishes "pick from this list" from "pick, or write your
own". We assume the list is closed; a form that says otherwise needs the unit
field to accept a typed code, which is the same shape as an open choice.

### date · dateTime · time

```yaml
- { linkId: onset, type: date,     text: Since }
- { linkId: seen,  type: dateTime, text: Seen at }
- { linkId: took,  type: time,     text: Taken at }
```
```haml
%input{ name: "item/onset", type: "date" }
%input{ name: "item/seen",  type: "datetime-local" }
%input{ name: "item/took",  type: "time" }
```
```
item/onset = 2019-04-01   →   answer: [{ valueDate: "2019-04-01" }]
item/seen  = 2026-08-05T09:14
                          →   answer: [{ valueDateTime: "2026-08-05T09:14:00+01:00" }]
```

The offset on a `dateTime` is attached by the server — `datetime-local` has none,
and without it two sites disagree by hours.

**Partial dates have a control.** `2019-04` is valid FHIR, and `<input
type="month">` submits exactly that; `week` exists too. So precision picks the
control rather than falling out of it: year → a number field, year-and-month →
`month`, full → `date`. SDC even lets the definition demand a precision —
`minLength: 7` on a date means "at least the month" — which is the same rule
expressed where it belongs.

### string · text · url

```yaml
- { linkId: allergy, type: string, text: Allergy, maxLength: 60 }
- { linkId: note,    type: text,   text: Anything else }
- { linkId: link,    type: url,    text: Link to the report }
```
```haml
%input{    name: "item/allergy", type: "text", maxlength: 60 }
%textarea{ name: "item/note" }
%input{    name: "item/link", type: "url" }
```
```
item/allergy = peanuts    →   answer: [{ valueString: "peanuts" }]
item/note    = …          →   answer: [{ valueString: "…" }]
item/link    = https://…  →   answer: [{ valueUri: "https://…" }]
```

`string` and `text` differ only in the control; both store `valueString`.

### choice

```yaml
- linkId: pos
  type: choice
  text: Position
  answerOption:
    - { valueCoding: { system: http://snomed.info/sct, code: 33586001, display: Sitting } }
    - { valueCoding: { system: http://snomed.info/sct, code: 10904000, display: Standing } }
```
```haml
%div{ data: { field: "item/pos" }, role: "radiogroup" }
  %label
    %input{ type: "radio", name: "item/pos:code", value: "33586001" }
    Sitting
  %label
    %input{ type: "radio", name: "item/pos:code", value: "10904000" }
    Standing
```
```
item/pos:code = 33586001  →   answer: [{ valueCoding: { system: http://snomed.info/sct,
                                                        code: 33586001, display: Sitting } }]
```

The browser sends the **code**; the system and display are looked up in
`answerOption`. `itemControl` decides the control — radio cards, a `%select` for a
drop-down, a combobox for `autocomplete` when the options come from a value set
too large to render.

### open-choice

```yaml
- linkId: mood
  type: open-choice
  text: How do you feel?
  answerOption:
    - { valueCoding: { code: good, display: Good } }
    - { valueCoding: { code: bad,  display: Not great } }
```
```haml
%label
  %input{ type: "radio", name: "item/mood:code", value: "bad" }
  Not great
%input{ name: "item/mood:text", type: "text", placeholder: "or say it your own way" }
```
```
item/mood:code = bad      →   answer: [{ valueCoding: { code: bad, display: Not great } }]
item/mood:text = tired after the shift
                          →   answer: [{ valueString: "tired after the shift" }]
```

Not an exception to "choices, not meanings": for an open choice the answer is
*either* a coding or a string, and the suffix says which arrived.

The label of that free-text box is the definition's to write, not the renderer's
to invent: SDC's `openLabel` ("Other, please specify", "Additional condition") is
what goes above `:text`.

### reference

```yaml
- { linkId: referrer, type: reference, text: Referred by }
```
```haml
%input{ name: "item/referrer:reference", type: "hidden", value: "Practitioner/17" }
-# the visible control is a combobox that searches; picking one sets the hidden field
```
```
item/referrer:reference = Practitioner/17
                          →   answer: [{ valueReference: { reference: Practitioner/17 } }]
```

`Reference.display` is filled by the server from the resource, never sent.

### attachment

```yaml
- { linkId: photo, type: attachment, text: Photo of the meter }
```
```haml
%input{ name: "item/photo:json", type: "hidden",
        value: '{"contentType":"image/jpeg","url":"Binary/abc"}' }
```
```
item/photo:json = {…}     →   answer: [{ valueAttachment: { contentType: image/jpeg, url: Binary/abc } }]
```

The escape hatch, until file answers are carried properly: where the byte goes
(`Binary`, `DocumentReference`, blob storage) and who scans it are open questions.

### group · display

```yaml
- linkId: bp
  type: group
  text: Reading
  repeats: true
  item: [ … ]
- { linkId: hint, type: display, text: Rest for five minutes before measuring. }
```
```haml
%fieldset{ data: { field: "item/bp", row: 0 } }
  %legend Reading 1
  -# children are named item/bp#0/<linkId>
%p Rest for five minutes before measuring.
```

A group has no field of its own — it contributes a segment to the path of its
children, and only when it repeats. A `display` never has a field; a body that
contains one is an unknown field.

## Rendering: from the tree to the page

One item becomes one control block. A `group` becomes a `<fieldset>` and
contributes a segment to its children's names only when it repeats; a `display`
becomes a paragraph and never a field. Every answerable item is wrapped in the
same shape — label, the control its type calls for, help, error — so a form is the
tree with a control at each leaf, and nothing about the page has to be described
per form.

### Layout

Three layers, in the order they should be reached for:

1. **Defaults derived from meaning.** A group whose children are all short scalars
   of the same type — systolic and diastolic, height and weight, date and time —
   is a row on a wide screen and a column on a narrow one. This is where most of
   the demand for "custom layout" actually comes from, and it costs nothing per
   form.
2. **What the definition declares.** SDC says it in extensions: `itemControl`
   (`gtable`, `htable`, `table`, `slider`, `drop-down`, `autocomplete`), `width`
   for a column in a table, `columnCount` for a list of options,
   `choiceOrientation`, `collapsible`, and `shortText` — the label to use where
   the full question does not fit, which is the first thing a table needs and the
   reason a `gtable` cannot be rendered from `text` alone. A layout stated here
   travels with the form and looks the same in the chart and in the portal.
3. **A page of its own.** For a genuinely bespoke screen, do not use the renderer:
   write the markup, name the inputs after the questions, and call `collect` on
   the POST. The contract is the names, not our renderer.

And one rule over the three: if the definition declares a layout, a page does not
silently override it. The form travels; the page does not.

## Markers: what is in the DOM and not in the body

The names above are the wire. The markup carries a little more — not for the
server, which has the definition and needs nothing, but for whoever drives the
page: the agent, a test, a person in devtools. Attributes are never posted, so
none of this can be asserted by a client; it is a reading aid and cannot become a
trust problem.

On the element that already carries `data-field`:

| marker | is |
|---|---|
| `data-type` | the item's type — `boolean`, `quantity`, `choice`, `group`, … |
| `data-required` | present when the question must be answered |
| `data-unit` | on a quantity: the unit code the field is currently in |

```haml
%div{ data: { field: "item/smoker", type: "boolean", required: true } }
%div{ data: { field: "item/weight", type: "quantity", unit: "kg" } }
%div{ data: { field: "item/pos",    type: "choice" } }
%fieldset{ data: { field: "item/bp", type: "group", row: 0 } }
```

Without `data-type`, `true` and `33586001` are just strings to anything reading
the page, and the reader has to fetch the questionnaire to know what it is
looking at. With it, filling a form from the outside needs the page and nothing
else.

Deliberately not marked: the system of a coding, the codes of the options, the
questionnaire's canonical url. The first two are already in the controls
themselves, the third is in the form's action — and every marker added here is one
more thing that can disagree with the definition.

## What HTML already gives us

Half of this mapping is not invented — it is what a browser does, written down, so
that the design leans on it instead of working around it.

| what the HTML standard says | what we do with it |
|---|---|
| the entry list is built in **tree order** | the order of two answers to a repeating question, and of two rows of a repeating group, is the order they appear on the page. Nothing has to number them |
| only the **submitter's** name and value are submitted | `__submit=1` and `__drop=<field>,<value>` are buttons; a row's × posts only its own `__drop`, and the other rows' buttons say nothing |
| a **`disabled`** control is not submitted; a **`readonly`** one **is** | so `readOnly` items are rendered `disabled` (or as text), and a question closed by `enableWhen` is wrapped in `<fieldset disabled>` — one attribute disables every descendant, and the body then cannot contain what the screen did not show |
| a disabled control is **barred from constraint validation** | which is the only way a `required` question inside a closed branch does not block the whole form. Hiding it with CSS or `hidden` does not help: the browser still refuses to submit, pointing at a field nobody can see |
| `<fieldset disabled>` spares the controls inside its **first `<legend>`** | the one place a "does this section apply?" toggle can live: it disables everything under it and stays clickable itself |
| the submitter may carry **`formaction`**, `formmethod`, `formenctype`, **`formnovalidate`** | "Save draft" is a second submit button posting to `?status=in-progress` with `formnovalidate`, so an unfinished form can be saved at all; "Submit" is the ordinary one |
| a control may name its form with the **`form` attribute** and live outside it | layout stops being constrained by the DOM: a score in a header bar, a control in a table cell that is not inside the `<form>` element |
| **`<output for="q1 q2 …">`** names the fields a value is derived from | the score says in the markup where it came from, and assistive technology announces it as a result rather than as a field |
| an unchecked **checkbox** submits nothing | `boolean` is two radios; a checkbox group is only for a repeating choice, where "none checked" genuinely means no answer |
| **`_charset_`** as a hidden input is filled in by the browser with the submission encoding | one field, and the encoding of a body is a fact instead of an assumption |
| **`dirname`** submits the direction of a text field (`…:dir=rtl`) | worth having for patient-entered free text in Arabic or Hebrew, where the direction is part of what they wrote |
| `input type=` **`month`** and `week` exist | a date of month precision (`2019-04`) has a native control — see the date block above |
| a file input carries `accept` and `multiple`, and the filename travels in the multipart part | `accept` is SDC's `mimeType`, `multiple` is `repeats`, and the filename is the `title` of the attachment |
| **`<datalist>`** offers suggestions without scripting | a small value set can be a plain input with suggestions; the combobox is for the sets too large to render |
| **`inputmode`** hints the keyboard | SDC's `keyboard` extension maps straight onto it |

## The exchange

A form posts to its own address, url-encoded (or multipart — both parse), and the
server answers with the form again:

| body | server does | answers with |
|---|---|---|
| no `__submit` | collects, runs `enableWhen`, recalculates the score — **writes nothing** | the form, re-rendered, with the newly relevant questions shown |
| `__submit=1`, something invalid | collects, does not write | the form, with each problem on the field that caused it (`data-invalid`, `data-role="error"`) |
| `__submit=1`, valid | `questionnaire.answer` — writes the response, extracts measurements if the form declares them, closes a Task that asked for it | the answers grid, and an `hx-location` to the address it now lives at |

The recompute case is what makes the form live without a line of client JS: it is
`hx-trigger="submit, change delay:250ms"` with `target: this, swap: outerHTML`. A
native submit with JavaScript disabled produces exactly the same result, because
the difference is only who swaps the returned fragment in.

**A draft is a second submit button, not a field.** HTML lets the submitter
override where and how the form posts, which is exactly the difference between
finishing a form and putting it down:

```haml
%button{ type: "submit", name: "__submit", value: 1 } Submit
%button{ type: "submit", name: "__submit", value: 1,
         formaction: "…&status=in-progress", formnovalidate: true } Save draft
```

`formnovalidate` is the part that matters: without it the browser refuses to post
a form with an unanswered `required` question, and an unfinished draft is by
definition unfinished. The server writes `status: in-progress`, skips extraction,
and answers with the form again.

## Errors

Errors come back keyed by `linkId` — never as a flat message — and the renderer
puts each on its own field:

```
{ "sbp": "must be at least 86 F", "mood": "this one is required" }
```

Kinds of error `collect` produces, per field: a required question with no answer;
a number outside `minValue`/`maxValue` or the SDC `minQuantity`/`maxQuantity`
(compared in the unit the range is stated in, never converted); a value shorter or
longer than `minLength`/`maxLength`, or failing the `regex` extension; a decimal
with more places than `maxDecimalPlaces` allows; a quantity whose question offers
several units with none chosen.

**And errors that are not about one field.** "Diastolic must be below systolic"
belongs to neither of them, and SDC has the place for it: `targetConstraint`, on
the questionnaire or on an item — an expression, a human-readable message and a
severity. It is evaluated after the answer is assembled, and its message lands on
the item that carries it (or on the form when the constraint is the form's own).
Without this, cross-field rules end up hard-coded in whoever renders the form,
which is where they cannot travel and cannot be reviewed.

## The algorithm

Both directions are one walk of the questionnaire tree with a **scope stack**, and
both derive every field name from the same function — which is the whole reason
the round trip holds.

```
name(scope, linkId) =
    scope.map(s => s.kind === "group"  ? `${s.linkId}#${s.index}/`      // repeating group
                 : /* answer */         `${s.linkId}@${s.index}/`)      // items under one answer
         .join("") + linkId
```

### Reading a body into a QuestionnaireResponse

Written out, because every subtlety in it is one somebody has already got wrong:

```js
// body: FormData · stored: the answer being edited, if any
export function collect({ questionnaire, body, stored }) {
    const index = new Map();                        // name → values, empties dropped
    for (const [name, value] of body) {
        if (value === "") continue;                 // an empty field is NO answer
        (index.get(name) ?? index.set(name, []).get(name)).push(String(value));
    }
    drop(index, body.get("__drop"));                // remove one value before anything reads

    const used = new Set(["__submit", "__drop"]);
    const errors = {};

    // the field name: the answer tree lives behind `item/`, scopes stack
    const name = (scope, linkId) =>
        "item/" + scope.map(s => `${s.linkId}${s.kind === "group" ? "#" : "@"}${s.index}/`).join("") + linkId;

    // which parts a type is spelled with: primitives are bare, composites are named
    const partsOf = type =>
        type === "quantity"  ? { main: ":value", extra: [":unit"] } :
        type === "choice"    ? { main: ":code",  extra: [":text"] } :
        type === "open-choice" ? { main: ":code", extra: [":text"] } :
        type === "reference" ? { main: ":reference", extra: [] } :
        type === "attachment" ? { main: ":json", extra: [] } :
                               { main: "",      extra: [] };

    const walk = (items, scope) => {
        const out = [];
        for (const item of items ?? []) {
            if (item.type === "display") continue;                       // never an answer
            if (!enabled(item, index)) continue;                         // enableWhen, on the RAW body
            if (hidden(item) || item.readOnly) {                         // the form did not offer it,
                const kept = fromStored(stored, item, scope) ?? fromInitial(item);
                if (kept) out.push(kept);                                //   so the body may not set it
                continue;
            }

            const n = name(scope, item.linkId);

            if (item.type === "group") {
                if (!item.repeats) { out.push({ linkId: item.linkId, text: item.text, item: walk(item.item, scope) }); continue; }
                for (const i of rows(index, n)) {                        // discovered, then renumbered
                    const kids = walk(item.item, [...scope, { linkId: item.linkId, kind: "group", index: i }]);
                    if (kids.some(k => k.answer || k.item?.length)) out.push({ linkId: item.linkId, text: item.text, item: kids });
                }                                                        // an empty trailing row: dropped
                continue;
            }

            const parts = partsOf(item.type);
            used.add(n + parts.main);
            for (const p of parts.extra) used.add(n + p);

            const raw  = index.get(n + parts.main) ?? [];
            const unit = index.get(n + ":unit")?.[0];
            const text = index.get(n + ":text")?.[0];
            let answers = raw.map(v => typed(item, v, unit));             // the definition types it
            if (text) answers.push({ valueString: text });                // open-choice: "or your own"

            for (const [j, a] of answers.entries())                      // items hanging off one answer
                if (item.item?.length) a.item = walk(item.item, [...scope, { linkId: item.linkId, kind: "answer", index: j }]);

            const problem = validate(item, answers);                     // required · range · length · unit
            if (problem) errors[item.linkId] = problem;
            out.push({ linkId: item.linkId, text: item.text, ...(answers.length ? { answer: answers } : {}) });
        }
        return out;
    };

    const response = {
        resourceType: "QuestionnaireResponse",
        questionnaire: questionnaire.url,
        id: body.get("id") || undefined,                                 // absent → a new answer
        status: body.get("status") === "in-progress" ? "in-progress" : "completed",
        subject: { reference: body.get("subject.reference") },           // stated here, verified by the caller
        item: walk(questionnaire.item, []),
    };
    for (const [k] of index) if (!used.has(k) && !k.startsWith("__") && !isElement(k)) {
        errors.__body = `not a question on this form: ${k}`;             // a field nobody asked for
    }
    return { response, valid: Object.keys(errors).length === 0, errors };
}

// every index that appears under this prefix, sorted and renumbered from zero —
// so deleting the middle row (#0, #2) leaves no hole in the answer
const rows = (index, prefix) => [...new Set([...index.keys()]
    .map(k => k.startsWith(prefix + "#") && Number(k.slice(prefix.length + 1).split("/")[0]))
    .filter(i => Number.isInteger(i)))].sort((a, b) => a - b);

// a number and its unit become a Quantity; a code becomes the coding the
// DEFINITION carries, so the system and display can never disagree with it
function typed(item, raw, unit) {
    switch (item.type) {
        case "integer":  return { valueInteger: Number(raw) };
        case "decimal":  return { valueDecimal: Number(raw.replace(",", ".")) };
        case "quantity": return { valueQuantity: { value: Number(raw), ...unitOf(item, unit) } };
        case "boolean":  return { valueBoolean: raw === "true" };
        case "date":     return { valueDate: raw };
        case "dateTime": return { valueDateTime: withOffset(raw) };
        case "time":     return { valueTime: raw };
        case "url":      return { valueUri: raw };
        case "reference":return { valueReference: { reference: raw } };
        case "attachment": return { valueAttachment: JSON.parse(raw) };
        case "choice":
        case "open-choice": {
            const option = (item.answerOption ?? []).find(o => (o.valueCoding?.code ?? o.valueString) === raw);
            return option?.valueCoding ? { valueCoding: option.valueCoding } : { valueString: raw };
        }
        default: return { valueString: raw };
    }
}
```

Five things in there are load-bearing and easy to get wrong:

1. **`enableWhen` reads the raw body, not the tree being built.** A condition may
   point at a question that appears *later* in the form; evaluating against the
   half-built response would make the answer depend on item order.
2. **Row indexes are discovered, not counted.** `rows(n)` collects every `i` that
   appears in a key `…linkId#i/…`, sorts numerically and renumbers from zero — so
   deleting the middle row (`#0`, `#2`) is not a hole in the response, and the
   trailing empty row simply carries no answers and is dropped.
3. **`used` is what makes an unknown field detectable.** Anything left in the body
   after the walk was never asked for: a typo, a stale field from an older render,
   or a crafted request.
4. **`stored` fills only what the form did not offer** — readOnly items, and
   hidden ones whose value the server re-derives rather than trusting. It never
   overrides a field the user could see.
5. **An empty string was dropped before the walk**, so "answered with nothing"
   cannot be confused with "not answered".

### Writing a response back into a form

The mirror walk, same order, same `name()`:

```
render(questionnaire, response, errors):
  walk(items, scope):
    for item in items:
      if display: paragraph
      if not enabled(item): nothing                     # a closed branch is not drawn
      if group and repeats:
        for i in 0 … count(response, item, scope):
          row(walk(item.item, scope + {group, item.linkId, i}))
        row(empty, index = count)                       # the slot that adds the next one
      else:
        control(name(scope, item.linkId), value from response, error by linkId)
        for j in answers: walk(item.item, scope + {answer, item.linkId, j})
```

Which gives the guarantee in one line: **`collect(render(r)) = r`** for everything
the form is allowed to change, because both sides visit the same items in the same
order and compute the same names from the same function.

## Editing an existing answer

An edit differs from a new answer by four fields, not by a mechanism:

```
questionnaire = http://ex/Questionnaire/bp
subject.reference = Patient/anna
id            = qr-7                       ← this is an edit
authored      = 2026-08-05T09:10:00Z       ← kept from the original
status        = completed
```

The rule that makes this safe is short: **the body states, the server verifies.**
`subject.reference` and `id` must agree with the address the form posted to; a mismatch is
refused rather than silently ignored (which would hide tampering) or silently
obeyed (which would let a form answer for another patient). `authored` is accepted
only alongside an `id` — a new answer is stamped by the server, or a client could
record a measurement into last Tuesday.

Three cases follow from it, and each used to be accidental:

- **`hidden` items** (`questionnaire-hidden`) — a score, a value populated from the
  record — are ordinary hidden inputs under `item/…`. They travel like everything
  else, and the server re-derives them rather than trusting what came back: a
  hidden input is hidden from the eye, not from a debugger.
- **`readOnly` items** are rendered as text or as `disabled` controls, and a
  disabled control is not submitted at all — so there is nothing to ignore. (A
  `readonly` input **is** submitted, which is why `readonly` is the wrong
  attribute here.) Their values come from the stored answer or from `initial`.
- **A branch that closed.** If `enableWhen` now says a question is not asked, its
  previous answer is **dropped**, not carried over — FHIR is explicit that a
  disabled item has no answer. This is the one place where the previous answer
  does not win.

## Guarantees

- **Round trip.** `form(response) → POST → collect` returns a response equal to
  what went in. Anything that breaks this is a bug in one of the two, and they
  share the name-building function so they cannot drift.
- **The definition is the authority.** Fields not in the questionnaire are
  refused; answers are typed by the item, not by what the browser sent; a hidden
  branch contributes nothing.
- **No client state.** Everything the form knows is either in the definition or
  in the body of the request.

## Skip logic and formulas: transpiled to plain JS

The exchange above re-renders the form on every change so that `enableWhen`,
`calculatedExpression` and the score are evaluated where the definition is. That
is correct and, on a long form, chatty: most keystrokes change nothing any rule
looks at.

So the server **transpiles the form's expressions into plain JavaScript** and
sends it inline with the form. No FHIRPath engine ships — no engine exists on the
client at all — and nothing has to be fetched separately.

The rule this codebase has about JavaScript is about **hand-written** code in a
template: unreviewable, untestable, invisible to the type checker. Code that is
**generated from the definition** has the same standing as the generated markup
around it — it is the form, expressed differently:

```haml
%form{ data: { form: "phq9" }, "hx-trigger": "submit" }
  -# … the questions …
  %script{ nonce: nonce }
    :plain
      (form => {
        const enable = { … }, calc = { … };     -- generated, below
        window.qform.attach(form, enable, calc);
      })(document.currentScript.closest("form"));
```

Three consequences worth stating, because each is a small rule of its own:

- **The content-security policy is closed with a nonce**, one per response, not
  with `unsafe-inline`. Inline generated code is fine; inline *arbitrary* code is
  what a policy is for.
- **Attaching must be idempotent.** The form re-renders itself on submit and on
  any field whose rule did not transpile, htmx runs the scripts in what it swaps
  in, so the same code executes again. Listeners go on the form element, which is
  replaced along with them; nothing is registered globally and nothing accumulates.
- **Size is not a problem worth solving.** PHQ-9's rules are half a kilobyte —
  cheaper to re-send with each fragment than to cache. A form whose rules are
  genuinely large, opened on page after page, can have the same generated text
  served at a versioned URL instead; that is an optimisation, not the design.

### What the transpiler emits

Paths are resolved **at compile time**: the transpiler knows every `linkId`, so
`%resource.repeat(item).where(linkId = 'q1').answer.value` becomes a read of one
field. Nothing on the client assembles a QuestionnaireResponse, and nothing walks
a FHIRPath tree:

```js
// generated from http://ex/Questionnaire/phq9@1.0.0 — inline with the form
export const enable = {
    "why":   v => v("item/mood:code")[0] === "bad",
    "packs": v => v("item/smoke").length > 0 && Number(v("item/age")[0]) > 18,
};

export const calc = {
    "total": v => ["q1","q2","q3","q4","q5","q6","q7","q8","q9"]
        .reduce((n, q) => n + ordinal(v, `item/${q}:code`), 0),
};
```

`v(field)` is the values of that field as the DOM has them right now — the same
names the body would carry. That is the whole interface between the generated
module and the page.

### What it buys and what it costs

- **Nothing FHIR-shaped reaches the browser**: no engine, no response assembly, no
  expression parsing. The generated file is small, readable and cacheable per
  form version.
- **No `eval` and no engine**: the code is written out by the server, not built in
  the browser, so the policy needs a nonce and nothing else.
- **The transpiler may refuse.** What it cannot express — terminology calls
  (`memberOf`), expressions over other resources, rules reaching across rows of a
  repeating group — is simply not in the module, and those fields keep their
  `hx-trigger`. A form where nothing transpiles behaves exactly as it does today.
- **The server is still the authority.** Every rule is re-evaluated when the
  answer is collected, so a browser that shows a hidden question cannot make it
  answered, and a browser that displays a total cannot make it stored — the score
  is `readOnly` and has no field in the body at all.
- **The cost is a second evaluator**, and it is paid with a test rather than with
  discipline: for every form, evaluate its expressions server-side and through the
  generated module over the same answers, and require the two to agree. A
  transpiler that drifts fails that test on the form that drifted.

# Part two — worked examples

Three forms, whole: a measurement, a score, and a diagnosis. Between them they use
every mechanism above and all four ways an answer can land in the record.

## A number with a unit: `quantity` or `decimal`?

Before the first example, one modelling decision it turns on. FHIR spells a
measured number two ways, both legal and both extractable. The difference is **where the unit lives**:

```yaml
# the unit is in the definition; the answer is a bare number
- linkId: sys
  type: decimal
  code: [{ system: http://loinc.org, code: 8480-6 }]
  extension:
    - url: .../questionnaire-unit
      valueCoding: { system: http://unitsofmeasure.org, code: mm[Hg] }

# the unit travels inside the answer
- linkId: sys
  type: quantity
  code: [{ system: http://loinc.org, code: 8480-6 }]
  extension:
    - url: .../questionnaire-unit
      valueCoding: { system: http://unitsofmeasure.org, code: mm[Hg] }
```

`decimal` is what the LOINC panels use and it is smaller; `quantity` makes the
answer self-describing, which matters the moment it leaves the form — extraction,
export, another system reading the response without the definition.

**The trap: `unitOption` on a `decimal` is a contradiction.** It offers the user a
choice of unit that the answer physically cannot record. So: one fixed unit →
either type; a unit the user may switch (kg/lb, Cel/F) → `quantity`, always.

## Blood pressure, whole

```yaml
resourceType: Questionnaire
id: bp
url: http://ex/Questionnaire/bp
version: 1.0.0
title: Blood pressure
status: active
code:
  - { system: http://loinc.org, code: 85354-9, display: Blood pressure panel }

# the whole form records measurements — the flag is inherited, so it is
# written once here instead of on every question
extension:
  - { url: .../sdc-questionnaire-observationExtract, valueBoolean: true }

item:
  - linkId: bp
    type: group
    text: Reading
    repeats: true                      # a visit may hold more than one
    # the group's code is the panel: one reading per repetition, with the
    # two numbers as its components
    code:
      - { system: http://loinc.org, code: 85354-9 }
    item:

      - linkId: sys
        type: quantity
        text: Systolic
        required: true
        code: [{ system: http://loinc.org, code: 8480-6 }]
        extension:
          - url: .../questionnaire-unit
            valueCoding: { system: http://unitsofmeasure.org, code: mm[Hg] }
          # not "normal" — a guard against 1320 typed for 132
          - { url: .../sdc-questionnaire-minQuantity, valueQuantity: { value: 40,  code: mm[Hg] } }
          - { url: .../sdc-questionnaire-maxQuantity, valueQuantity: { value: 300, code: mm[Hg] } }

      - linkId: dia
        type: quantity
        text: Diastolic
        required: true
        code: [{ system: http://loinc.org, code: 8462-4 }]
        extension:
          - url: .../questionnaire-unit
            valueCoding: { system: http://unitsofmeasure.org, code: mm[Hg] }
          - { url: .../sdc-questionnaire-minQuantity, valueQuantity: { value: 20,  code: mm[Hg] } }
          - { url: .../sdc-questionnaire-maxQuantity, valueQuantity: { value: 200, code: mm[Hg] } }

      # position qualifies THIS reading, so it lives inside the repetition
      - linkId: pos
        type: choice
        text: Position
        code: [{ system: http://loinc.org, code: 8361-0, display: Body position }]
        answerOption:
          - valueCoding: { system: http://snomed.info/sct, code: 33586001,  display: Sitting }
          - valueCoding: { system: http://snomed.info/sct, code: 10904000,  display: Standing }
          - valueCoding: { system: http://snomed.info/sct, code: 102538003, display: Lying }
```

What it produces: one repetition is one Observation, coded `85354-9`, with
systolic and diastolic as components in `mm[Hg]` and the position as a third. An
orthostatic test is **two repetitions** — sitting then standing — which is two
measurements told apart by their position, not one measurement with two pairs of
numbers. A flat form of two fields cannot express that at all, however it is laid
out.

Four decisions are visible in there, and each could have gone the other way:

1. **The group carries the panel code.** Without a code a group is only a box on
   the screen; with one it says "these numbers are one thing".
2. **Components, not separate observations** — because systolic without diastolic
   is not a blood pressure. Height and weight in a vitals panel are the opposite
   case: each stands alone, so they are separate Observations under a panel.
3. **Position is inside the repetition**, because it qualifies the measurement.
   Anything that qualifies the *visit* (who took it, which room) belongs outside.
4. **The ranges are plausibility, not normal.** 40–300 stops a typo. What counts
   as high depends on age, pregnancy, the assay and the decade — it belongs to
   whoever reads the record, never to a form that is written once and sent to
   many clinics.

## The same form as HTML

What that YAML becomes on screen. Names follow the grammar in part one: the field
is the `linkId` behind `item/`, prefixed with `bp#<i>/` because the group repeats. Classes are left
out — only the structure that carries meaning is shown.

```haml
-# HAML here for readability; what ships is the same HTML
%form{ data: { form: "bp" }, method: "post",
       action: "/ehr/patient/anna/forms?form=…%2FQuestionnaire%2Fbp&response=new",
       "hx-post": "…same…", "hx-target": "this", "hx-swap": "outerHTML",
       "hx-trigger": "submit, change delay:250ms" }

  %h2 Blood pressure

  -# one reading = one repetition of the group
  %fieldset{ data: { field: "bp", row: 0 } }
    %legend Reading 1

    %div{ data: { field: "item/bp#0/sys" } }
      %label{ for: "bp#0/sys" }
        Systolic
        %span{ "aria-hidden": true } *
      %input{ id: "bp#0/sys", name: "item/bp#0/sys:value", data: { field: "item/bp#0/sys:value" },
              type: "number", step: "any", min: 40, max: 300, required: true,
              value: 132, "aria-describedby": "u-bp#0/sys" }
      %span#u-bp-0-sys mm[Hg]              -# itemControl: unit — beside the box

    %div{ data: { field: "item/bp#0/dia" } }
      %label{ for: "bp#0/dia" }
        Diastolic
        %span{ "aria-hidden": true } *
      %input{ id: "bp#0/dia", name: "item/bp#0/dia:value", data: { field: "item/bp#0/dia:value" },
              type: "number", step: "any", min: 20, max: 200, required: true, value: 82 }
      %span mm[Hg]

    %div{ data: { field: "item/bp#0/pos" }, role: "radiogroup", "aria-label": "Position" }
      %label
        %input{ type: "radio", name: "item/bp#0/pos:code", value: "33586001", checked: true }
        Sitting
      %label
        %input{ type: "radio", name: "item/bp#0/pos:code", value: "10904000" }
        Standing
      %label
        %input{ type: "radio", name: "item/bp#0/pos:code", value: "102538003" }
        Lying

    %button{ type: "submit", name: "__drop", value: "item/bp#0/sys:value,132",
             data: { action: "drop" }, "aria-label": "Remove reading 1" } ×

  -# the empty slot that becomes the next reading; it carries no answers,
  -# so nothing is written for it until somebody types
  %fieldset{ data: { field: "bp", row: 1 } }
    %legend Reading 2
    %div{ data: { field: "item/bp#1/sys" } }
      %label Systolic
      %input{ name: "item/bp#1/sys:value", type: "number", step: "any", min: 40, max: 300 }
      %span mm[Hg]
    %div{ data: { field: "item/bp#1/dia" } }
      %label Diastolic
      %input{ name: "item/bp#1/dia:value", type: "number", step: "any", min: 20, max: 200 }
      %span mm[Hg]
    %div{ data: { field: "item/bp#1/pos" }, role: "radiogroup", "aria-label": "Position" }
      …

  -# the answer's own elements — named fields, not a blob
  %input{ type: "hidden", name: "questionnaire", value: "http://ex/Questionnaire/bp" }
  %input{ type: "hidden", name: "subject.reference", value: "Patient/anna" }
  %input{ type: "hidden", name: "id",            value: "qr-7" }
  %input{ type: "hidden", name: "authored",      value: "2026-08-05T09:10:00Z" }
  %input{ type: "hidden", name: "status",        value: "completed" }
  %button{ type: "submit", name: "__submit", value: 1, data: { action: "submit" } } Submit
```

Six things in that markup are decisions rather than taste:

1. **`name` is the wire, `data-field` is the handle.** The name is what the server
   reads; `data-field` (the same string) is what a test or the agent addresses —
   never a CSS selector.
2. **The row index is in the name, not in a counter.** There is no `__rows=2`
   field to disagree with what was actually posted; the server discovers rows from
   the names it receives and renumbers them.
3. **The trailing empty row is always rendered.** Adding a reading is typing in
   it, not pressing a button that asks the server for another row — one round trip
   fewer, and it works with scripts off.
4. **Removal is a submit button**, not client-side DOM surgery: `__drop` names the
   field and value to forget, the server collects without it and returns the form
   short. Nothing about the deletion lives only in the browser.
5. **The unit is a `<span>` beside the box**, not a caption under it — SDC's `unit`
   text control. `132 mm[Hg]` should read as one thing. Where a question offers
   several units this becomes a `%select{ name: "item/bp#0/sys:unit" }`.
6. **The browser validates what it cheaply can** (`required`, `min`, `max`,
   `step`) and the server validates all of it again. The attributes are a courtesy
   to the person typing, never the check that matters.

What the browser posts, one parameter per line (names as written; on the wire the
separators are percent-encoded, so `item/bp#0/sys:unit` travels as
`item%2Fbp%230%2Fsys%3Aunit`):

```
questionnaire        = http://ex/Questionnaire/bp
subject.reference    = Patient/anna
id                   = qr-7
authored             = 2026-08-05T09:10:00Z
status               = completed
item/bp#0/sys:value  = 132
item/bp#0/sys:unit   = mm[Hg]
item/bp#0/dia:value  = 82
item/bp#0/dia:unit   = mm[Hg]
item/bp#0/pos:code   = 33586001
__submit             = 1
```

Nothing is posted for the empty second reading — `item/bp#1/sys:value` and its
neighbours are in the markup and not in the body, because an empty field is no
answer.

And the answer it becomes. Every part is marked with where it came from — the
body states, the server verifies, the definition fills in the rest.

```yaml
resourceType: QuestionnaireResponse
id: qr-7                                    # stated by the form; an edit of an existing answer
questionnaire: http://ex/Questionnaire/bp   # stated, and checked against the address
status: completed                           # the server's rule: new → completed, existing → amended
authored: 2026-08-05T09:10:00Z              # kept from the original; a new answer is stamped by the server
subject: { reference: Patient/anna }        # from subject.reference — refused if it disagrees with the address
item:
  - linkId: bp
    text: Reading                           # copied from the definition
    item:
      - linkId: sys
        text: Systolic
        answer:
          - valueQuantity:
              value: 132
              unit: mm[Hg]                  # from item/bp#0/sys:unit
              code: mm[Hg]
              system: http://unitsofmeasure.org
      - linkId: dia
        text: Diastolic
        answer:
          - valueQuantity:
              value: 82
              unit: mm[Hg]
              code: mm[Hg]
              system: http://unitsofmeasure.org
      - linkId: pos
        text: Position
        answer:
          - valueCoding:
              system: http://snomed.info/sct  # the system and the display come from
              code: 33586001                  #   answerOption, not from the browser —
              display: Sitting                #   the body carried only "33586001"
```

*(The repeating-group part of this — `item/bp#0/…`, the trailing slot, the
answer's own fields — is specified in part one and not yet implemented: today the renderer draws a
repeating group once and collects one repetition.)*

### When the unit can be chosen

Blood pressure is recorded in `mm[Hg]` everywhere, so above the unit is declared
and printed. A weight or a temperature is not: the same question is answered in
kg or lb, in Cel or F, and which one was used is part of the answer. Then the
question offers `unitOption` instead of `questionnaire-unit`, the type must be
`quantity` (a `decimal` has nowhere to record the choice), and the form grows one
control:

```haml
%div{ data: { field: "item/bp#0/sys" } }
  %label{ for: "bp#0/sys" }
    Systolic
    %span{ "aria-hidden": true } *
  %input{ id: "bp#0/sys", name: "item/bp#0/sys:value", type: "number", step: "any",
          min: 40, max: 300, value: 132 }            -# the range, in the chosen unit
  %select{ name: "item/bp#0/sys:unit", data: { field: "item/bp#0/sys:unit" }, "aria-label": "Systolic unit" }
    %option{ value: "mm[Hg]", selected: true } mm[Hg]
    %option{ value: "kPa" } kPa
```

Both halves are named, because a `Quantity` has no single "the answer": the number
is `:value` and the unit is `:unit`, hanging off the same path. Not
`bp#0/unit/sys` — there `unit` would sit where a `linkId` is expected, and a group
with a child actually called `unit` would break; and not `unit/bp#0/sys` either,
which would make `/` mean two things in one name. One character, one role: `#` a
repetition, `/` a level, `:` an element of a composite answer. The body carries
both halves:

```
item/bp#0/sys:value=132&item/bp#0/sys:unit=mm[Hg]
```

and the answer keeps the choice, which is the point of the exercise:

```yaml
- linkId: sys
  answer: [{ valueQuantity: { value: 132, unit: mm[Hg], code: mm[Hg], system: http://unitsofmeasure.org } }]
```

Three consequences, in order of how quietly they bite:

1. **A quantity with several units offered and none chosen is an error**, not a
   default. Taking the first option is what turns 36.8 °C into 36.8 °F — a legal
   resource, a plausible number, and a fever of nothing.
2. **Switching the unit is a recompute.** The select fires `change`, the form posts
   itself, and the server — where UCUM lives — converts the number and sends the
   form back showing it. Nothing converts in the browser, and temperature (whose
   conversion is affine, not a factor) cannot be got wrong by a coefficient table
   somebody wrote in JavaScript.
3. **The plausibility range travels with the unit.** 40–300 mm[Hg] is 5.3–40 kPa;
   after a switch the `min`/`max` attributes must be re-emitted in the chosen unit
   or the browser starts refusing perfectly ordinary values. The same round trip
   that converts the number re-renders the attributes.

What is stored is always **what was entered** — value and its unit, unconverted.
Conversion happens for showing, for comparing against a range, and for a reader
that plots a series (a chart must not put mm[Hg] and kPa on one line); the record
says what was measured, not what we calculated.

### From a submission back to an answer

The same blood pressure form, submitted with two readings and the second one
answered in kPa:

```
item/bp#0/sys:value=132    item/bp#0/sys:unit=mm[Hg]   item/bp#0/dia:value=82   item/bp#0/pos:code=33586001
item/bp#2/sys:value=17.6   item/bp#2/sys:unit=kPa      item/bp#2/dia:value=10.4 item/bp#2/pos:code=10904000
id=qr-7   authored=2026-08-05T09:10:00Z   subject.reference=Patient/anna   status=completed
__submit=1
```

(`#2` and no `#1` because the middle reading was removed before submitting.)

Turning that into a QuestionnaireResponse is one walk of the **questionnaire**,
never of the body — the body is asked for values by name, in the order the
definition asks its questions:

1. **Index the body once.** `item/bp#0/sys:value → ["132"]`, and so on. Drop empty values here
   (an empty field is *no answer*, not an empty one) and apply `__drop` before
   anything else looks at the values.
2. **Walk the items.** `display` is skipped; a question whose `enableWhen` is not
   satisfied is skipped entirely — it contributes no answer, not an empty one. The
   condition is evaluated against the **raw body**, so a rule may point at a
   question that appears later in the form.
3. **At a repeating group, discover the rows.** Everything matching `item/bp#<i>/…` in
   the body: here `{0, 2}`. Sort them, renumber from zero, and walk the group's
   children once per row with `bp#<i>/` on the scope stack. A row that produced no
   answers at all — the trailing empty slot — is dropped.
4. **At a question, read and type.** `item/bp#0/sys:value` is `132` and its
   `:unit` is `mm[Hg]` → `valueQuantity { value: 132, unit: mm[Hg], system: UCUM,
   code: mm[Hg] }`. `item/bp#0/pos:code` is `33586001`, the item is a `choice`
   → the coding is looked up in `answerOption`, so the stored answer carries the
   system and display the **definition** gave, not what the browser sent.
5. **Validate as you go**, keyed by `linkId`: required, the plausibility range in
   the unit it is stated in, a quantity offering several units with none chosen.
6. **Fill what the form did not offer** — `readOnly` items from the stored answer
   or from `initial`, and `hidden` ones re-derived by the server rather than
   trusted. The body replaces what was rendered; nothing else may.
7. **Anything left over in the body is an error.** After the walk, every name that
   was never consumed is a field nobody asked for — a typo, a stale field from an
   older render, or a crafted request.

Which yields two readings, the second one recording that it was measured in kPa:

```yaml
item:
  - linkId: bp                                  # row 0
    item:
      - { linkId: sys, answer: [{ valueQuantity: { value: 132, unit: mm[Hg], code: mm[Hg], system: http://unitsofmeasure.org } }] }
      - { linkId: dia, answer: [{ valueQuantity: { value: 82,  unit: mm[Hg], code: mm[Hg], system: http://unitsofmeasure.org } }] }
      - { linkId: pos, answer: [{ valueCoding: { system: http://snomed.info/sct, code: 33586001, display: Sitting } }] }
  - linkId: bp                                  # row 2 → renumbered to 1; the index is not stored
    item:
      - { linkId: sys, answer: [{ valueQuantity: { value: 17.6, unit: kPa, code: kPa, system: http://unitsofmeasure.org } }] }
      - { linkId: dia, answer: [{ valueQuantity: { value: 10.4, unit: kPa, code: kPa, system: http://unitsofmeasure.org } }] }
      - { linkId: pos, answer: [{ valueCoding: { system: http://snomed.info/sct, code: 10904000, display: Standing } }] }
```

Note what the response does **not** contain: no row indexes (order is the only
thing that distinguished them, and it is preserved), no unit for the position,
and no trace of the empty row. And note what it does contain: the second reading
keeps kPa. Nothing is normalised on the way in — converting is for showing, for
comparing against a range, and for a chart that must not put two units on one
line.

## A score: PHQ-9

A depression screener is nine questions, each answered on the same 0–3 scale, and
a number that is the point of the whole form. Three things have to be said in the
definition, and one deliberately must not.

**The scale is on the options**, as `ordinalValue` — the score is not a property of
the form, it is a property of each answer:

```yaml
- linkId: q1
  type: choice
  text: Little interest or pleasure in doing things
  code: [{ system: http://loinc.org, code: 44250-9 }]
  answerOption:
    - { valueCoding: { code: LA6568-5, display: Not at all },
        extension: [{ url: .../questionnaire-ordinalValue, valueDecimal: 0 }] }
    - { valueCoding: { code: LA6569-3, display: Several days },
        extension: [{ url: .../questionnaire-ordinalValue, valueDecimal: 1 }] }
    - { valueCoding: { code: LA6570-1, display: More than half the days },
        extension: [{ url: .../questionnaire-ordinalValue, valueDecimal: 2 }] }
    - { valueCoding: { code: LA6571-9, display: Nearly every day },
        extension: [{ url: .../questionnaire-ordinalValue, valueDecimal: 3 }] }
```

**The total is an item**, not a fact about the screen — it has a code, it is
calculated, and it is what extraction turns into a measurement:

```yaml
- linkId: total
  type: integer
  text: Total score
  readOnly: true
  code: [{ system: http://loinc.org, code: 44261-6, display: PHQ-9 total score }]
  extension:
    - url: .../sdc-questionnaire-calculatedExpression
      valueExpression:
        language: text/fhirpath
        expression: >
          %resource.repeat(item).where(linkId.matches('^q[1-9]$'))
            .answer.value.extension('…questionnaire-ordinalValue').value.sum()
```

Because it is an item with a code, one submission produces ten Observations: the
nine answers and the score — and the score is the one a chart draws over time
(`record.readSeries` on 44261-6), which is the whole reason a screener is repeated
every few weeks.

**What must not be in the form is the interpretation.** 5–9 mild, 10–14 moderate,
15–19 moderately severe — those bands move with guidelines, differ by population,
and are read differently in a clinic and in research. Same argument as
plausibility versus normal range: the form computes the number, the record decides
what it means. A form that hard-codes "moderate" ships a clinical opinion to every
clinic that installs it.

### On screen, and on the wire

The score is `readOnly`, so it is rendered and never posted — its field does not
exist in the body, and the server recomputes it when it collects. That is what
makes it trustworthy: a client cannot report a total that disagrees with its own
answers.

Which leaves the live number on screen. It is the same shape as skip logic — the
declaration flattened to data, not to code:

```jsonc
{ "score": { "total": { "sum": ["item/q1:code", "item/q2:code", … ], "by": "ordinal" } } }
```

The renderer publishes each option's `ordinalValue` on the option itself, so a
reader of the page can add up what is currently chosen without holding the
questionnaire. And the same rule as everywhere: what the browser shows is a
courtesy, what the server computes on collect is the answer.

On screen it looks like this — the rules travel as one argument, the ordinal of
each option travels on the option, and the total has somewhere to land:

```haml
%form{ data: { form: "phq9" },
       "hx-post": "/ehr/patient/anna/forms?form=…%2Fphq9&response=new",
       "hx-target": "this", "hx-swap": "outerHTML",
       "hx-trigger": "submit",                  -- no round trip per keystroke: the rules are client-side
       "hx-on:hyper-load": "window.qform.rules(this, #{rules})" }

  %div{ data: { field: "item/q1", type: "choice", required: true } }
    %label Little interest or pleasure in doing things
    %label
      %input{ type: "radio", name: "item/q1:code", value: "LA6568-5", data: { ordinal: 0 } }
      Not at all
    %label
      %input{ type: "radio", name: "item/q1:code", value: "LA6569-3", data: { ordinal: 1 } }
      Several days
    %label
      %input{ type: "radio", name: "item/q1:code", value: "LA6570-1", data: { ordinal: 2 } }
      More than half the days
    %label
      %input{ type: "radio", name: "item/q1:code", value: "LA6571-9", data: { ordinal: 3 } }
      Nearly every day

  -# … q2 … q9, the same shape

  %div{ data: { field: "item/total", type: "integer" } }
    %label Total score
    %output{ data: { role: "score", id: "total" } } 0
    %progress{ max: 27, value: 0 }

  %button{ type: "submit", name: "__submit", value: 1 } Submit
```

with `rules` being the flattened declaration, not code:

```jsonc
{ "score": { "total": { "sum": ["item/q1:code", "item/q2:code", "…", "item/q9:code"],
                        "by": "ordinal", "max": 27 } },
  "enable": { } }
```

Three things to notice. **The total has no `name`** — it is `readOnly`, so it is
shown and never posted; the server recomputes it from the answers when it
collects, and a client cannot report a total that disagrees with them.
**`data-ordinal` is on the option**, which is what lets anything reading the page —
the interpreter, a test, the agent — add up what is currently chosen without
holding the questionnaire. And **`hx-trigger` is `submit` alone**: this form has no
rule the client cannot evaluate, so the per-change round trip is gone. A form with
one un-flattenable rule keeps `change` on the fields that rule reads, and nowhere
else.

### What this makes possible, and what it costs

- **The screener becomes a measurement.** `total` with a code is an Observation,
  so "PHQ-9 over six months" is a line on a chart rather than a stack of
  documents to open one by one.
- **A `calculatedExpression` is FHIRPath**, and FHIRPath over the response is the
  one place where a form can express something our flattener will not always
  manage — a sum is easy, "the highest of the last three" is not. The rule stands:
  what does not flatten keeps its server round trip, and the number is still
  right, it just costs a request.
- **Two forms with the same questions but different scales are different forms.**
  The scale lives on the options, so PHQ-9 and its two-question cousin PHQ-2 are
  separate definitions that happen to share wording — not one form with a
  parameter.

## A diagnosis, and why it is a different mechanism

```yaml
- linkId: dx
  type: group
  text: Diagnosis
  repeats: true
  definition: http://hl7.org/fhir/StructureDefinition/Condition
  item:
    - linkId: dx-code
      type: choice
      text: Diagnosis
      required: true
      definition: http://hl7.org/fhir/StructureDefinition/Condition#Condition.code
      answerValueSet: http://ex/ValueSet/icd10-all
      extension:
        - url: .../questionnaire-itemControl
          valueCodeableConcept: { coding: [{ code: autocomplete }] }

    - linkId: dx-onset
      type: date                       # partial dates are normal here: "2019"
      text: Since
      definition: http://hl7.org/fhir/StructureDefinition/Condition#Condition.onsetDateTime

    - linkId: dx-status
      type: choice
      text: Status
      definition: http://hl7.org/fhir/StructureDefinition/Condition#Condition.clinicalStatus
      answerValueSet: http://hl7.org/fhir/ValueSet/condition-clinical
```

Three things differ from the blood pressure form:

- **The answers are bound, not enumerated.** ICD-10 is tens of thousands of codes;
  `answerValueSet` names a set and the terminology server expands it filtered by
  what the user has typed — hence `autocomplete`. Which ICD-10 also matters:
  `http://hl7.org/fhir/sid/icd-10` (WHO), `…/icd-10-cm` (US),
  `http://fhir.de/CodeSystem/bfarm/icd-10-gm` (Germany). A form written for one
  country is not valid in another, and that is a property of the form.
- **`definition`, not `code`.** A diagnosis is a `Condition`, and Observation-based
  extraction can only make Observations. Definition-based extraction is the
  mechanism: the group says which resource each repetition is, and each question
  says which element of it the answer fills.
- **Ask what the question really is.** "Have you ever been told you have diabetes"
  is patient-reported history (an Observation, or nothing but the answer itself);
  "the diagnosis for this visit" is `Encounter.diagnosis`; "a problem we are
  managing" is a `Condition` on the problem list. The form looks nearly the same
  in all three; where the answer lands does not.

## Which extraction mechanism

| the answer becomes | use | how it is said in the form |
|---|---|---|
| Observations — a measurement, a score, a screening result | **observation-based** | `item.code` on the question (and the panel code on the group), `observationExtract: true`, inherited from the root |
| a Condition, an AllergyIntolerance, a MedicationStatement — any other resource | **definition-based** | `definition` on the group (which resource) and on each question (which element) |
| something with fixed content around the answers | **template-based** | a template resource in the form with placeholders |
| anything the above cannot say | **StructureMap-based** | a map; the heaviest, and the last resort |

A form may use more than one: a visit form can extract its vitals as Observations
and its diagnoses as Conditions in the same submission.

---

# Part three — the register

What was decided, what bites, what is still open, and what is written here but not
yet built.

## Corner cases

The ones that produce a wrong answer rather than an error, which is why they are
written down.

| case | the rule |
|---|---|
| **`0` is an answer, `""` is not** | an empty field contributes no `answer[]`; zero, `false` and an empty *chosen* option all do. Never test a value for truthiness |
| **An unchecked checkbox sends nothing** | so `boolean` is two radios, not a checkbox — otherwise "no" and "not answered" are the same request |
| **Repetition indexes are not contiguous** | deleting the middle row posts `bp#0`, `bp#2`. Indexes are *identity within one submission*, not positions: collect sorts and compacts them |
| **Nested repetition** | scopes stack: `visit#1/bp#0/sbp`. The index belongs to the nearest repeating ancestor |
| **`__drop` values containing a comma** | both halves are URI-encoded: `__drop=<name>,<encoded value>` |
| **Double submit** | the same form posted twice must not write two answers. Identity is the `id` field: absent → a new answer, present → an amend of that one |
| **`type=number` swallows what it cannot parse** | a browser submits the empty string for a number field whose content is not a number, so "typed nonsense" arrives looking exactly like "left blank". A field that must be answered is caught by `required`; anything else is genuinely indistinguishable, and the design says so rather than pretending |
| **`type=range` always submits** | a slider has no empty state — it posts its midpoint if nobody touched it. An optional question therefore cannot be a slider unless the definition gives it a "not answered" option of its own |
| **Enter submits the first submit button** | with more than one field, implicit submission picks the **first** submit button in tree order — so a row's `__drop` × must never come before the real Submit, or pressing Enter deletes a row |
| **A `<button>` with no `type` is a submit button** | which is what makes `__drop` work, and what makes any other button in a form fire a submission by accident |
| **`<fieldset disabled>` spares its first `<legend>`** | controls inside that legend stay enabled — which is exactly where a "this section applies" toggle belongs, and nowhere else. Nothing else can be re-enabled: `disabled` cascades absolutely into nested fieldsets |
| **A required question in a closed branch blocks the form** | unless the branch is `disabled` — a disabled control is barred from constraint validation, while `hidden` and CSS are not. This is the reason the branch is a disabled fieldset and not a hidden div |
| **A `<fieldset>` cannot wrap table rows** | so a repeating group rendered as a `gtable` (one row per repetition) cannot use the one-attribute trick: `<tr>` may not sit inside a `<fieldset>`, and each control in the row has to be disabled on its own. Choosing a table layout chooses this cost |
| **`<fieldset>` is awkward as a CSS container** | `min-width: min-content` by default and long-standing quirks as a flex or grid parent; the layout usually goes on a `<div>` inside it |
| **`<textarea>` values are normalised to CRLF** | a line break costs two characters on submission; `maxLength` counted in FHIR characters and `maxlength` counted in UTF-16 code units are also not the same number for emoji or CJK. The server's check is the one that decides |
| **A `linkId` that collides with a reserved name** | `__submit` and `__drop` are reserved; the resource's own elements cannot collide at all, because every answer lives behind `item/`, and so are the separators `#`, `@`, `/`, `:`. A questionnaire using one as a `linkId` is **refused at render time**, loudly — silently renaming a field would break the round trip |
| **A decimal typed with a comma** | `36,8` is accepted and read as `36.8`; a value that is not a number at all is an error on that field, never a `NaN` in the record |
| **Partial dates** | `1990` and `1990-05` are valid FHIR dates and no `<input type=date>` can express them. Such an item falls back to a text field with a pattern |
| **`dateTime` has no offset in the browser** | `datetime-local` yields `1990-05-01T09:00`. The server attaches its own offset when it stores it, so two people filling the same form in two places do not disagree by hours |
| **`display` items** | never carry an answer. A body that contains one is an unknown field |
| **`open-choice` "other"** | the free text is posted under the same `linkId` as the chosen codes and lands as `valueString` beside the `valueCoding`s |
| **A score is computed, never posted** | the progress bar over the form is derived from the answers on every recompute. A posted "score" field is an unknown field |
| **The patient never comes from the body** | subject is the URL segment the host already resolved. A form cannot answer on behalf of somebody else by adding a field |
| **Extraction runs once per answer** | resubmitting an amended answer updates the Observations it produced rather than adding a second set — the SDC rule (take no action · update · create) applies to the answer's own id |

## The decisions, numbered

Everything above rests on choices that could have gone the other way. They are
listed so an argument can be had about a number rather than about a feeling.
Status: **built** · **specified** (written here, not in the code) · **open**.

### Names

| # | decision | instead of | why | status |
|---|---|---|---|---|
| D1 | the field name **is** the `linkId` | a path of linkIds; positional indexes; opaque field ids | FHIR already requires `linkId` to be unique inside a questionnaire, so a path adds ceremony and a rename risk without adding information | built |
| D2 | a repetition scope is `bp#0/sbp` | `bp[0].sbp`, `bp.0.sbp`, a separate `__rows=3` counter | brackets and dots collide with real `linkId`s; a counter can disagree with the fields actually posted | specified |
| D3 | the suffix mirrors the datatype: a bare path only for a primitive, `:value`/`:unit`/`:code`/`:text`/`:reference` for the elements of a composite answer | a bare name everywhere (the unit as a sibling field); `:value` on everything | a `Quantity` has no single "the answer", so naming one half bare is a lie about the type; making `:value` mandatory taxes every simple field for a rarity | specified |
| D4 | control fields are `__`-prefixed and reserved | HTTP headers, query parameters, a second endpoint | a plain form must be able to express everything in its body, or "works without JavaScript" stops being true | built |
| D5 | `.` is never a separator | dotted paths | `1.1` is an ordinary `linkId` in LOINC panels | built |
| D6 | a `linkId` colliding with a reserved name is refused **at render time** | silently escaping or renaming it | a renamed field breaks the round trip somewhere far away from the cause | specified |

### What the body means

| # | decision | instead of | why | status |
|---|---|---|---|---|
| D7 | the definition is the authority; an unknown field is an **error** | ignoring what is not recognised | a typo that writes an empty answer is the bug this whole contract exists to prevent | built |
| D8 | `""` is no answer; `0` and `false` are answers | treating empty as an empty answer | otherwise `required` cannot be checked, and a zero reading disappears | built |
| D9 | a choice is answered by its **code** | by its display text; by its position | display text is translated and edited; position moves when an option is inserted | built |
| D9a | the body carries **choices**, never **meanings**: `:code`, `:unit`, `:reference`, `:text` are sent; `system`, `display` and the printed unit are filled from the definition | letting the browser send the whole coding | a coding whose code and display disagree is two valid-looking halves and a bug nobody sees; the meaning is derivable, so deriving it is free | built |
| D10 | `boolean` renders as two radios | a checkbox | an unchecked box sends nothing, so "no" and "not answered" would be the same request | built |
| D11 | a repeating **question** repeats the same field name | indexed names | `getAll` is what a browser already does with a checkbox group | built |
| D12 | `__drop=<name>,<value>` removes one value server-side | removing it in client JS; a DELETE endpoint | the form has no client state, and a delete that only happened in the DOM is lost on the next recompute | built |
| D13 | one declared unit is implicit; several units must be **chosen** | taking the first option; guessing from magnitude | the LOINC vitals panel offers F before Cel — the guess turns 36.8 °C into a fever of nothing | built |
| D14 | a range is compared in the unit it is stated in; nothing is converted | UCUM conversion | a wrong conversion is worse than a refusal, and the refusal names the unit | built |
| D15 | `36,8` is read as `36.8`; a non-number is an error on the field | rejecting the comma; `NaN` in the record | a keyboard, not a mistake | specified |
| D16 | the server attaches the offset to a `dateTime` | storing what the browser sent | `datetime-local` has no offset, so two sites disagree by hours | specified |
| D17 | partial dates (`1990`, `1990-05`) fall back to a text field | forcing a full date | they are valid FHIR and a date input cannot express them | specified |

### Building the response

| # | decision | instead of | why | status |
|---|---|---|---|---|
| D18 | the answer is built by walking the **definition** | building it from the body | the body knows names; only the definition knows types, nesting and what was asked | built |
| D19 | an item disabled by `enableWhen` has **no answer**, even on an amend | keeping the old answer | FHIR is explicit; a preserved answer to a question nobody was asked is a claim about the patient | built |
| D20 | a group is emitted even when nothing under it was answered | omitting empty groups | the response keeps the shape of the form, which is what makes the grid columns line up | built |
| D21 | `item.text` is copied onto the response | leaving it out (it is optional) | an answer read years later should say what was asked, not just which `linkId` | built |
| D22 | the score is computed on every render, never posted | a hidden score field | a posted number can disagree with the answers under it | built |
| D23 | the answer's own elements are ordinary fields (`questionnaire`, `subject`, `id`, `authored`, `status`), and hidden items are hidden inputs | one opaque `__qr` blob; keeping the draft server-side in a session | a blob is a second encoding inside the first, unwritable by hand; a server-side draft is state the form promised not to have | specified |
| D24 | `readOnly` and `hidden` items are rendered `disabled` (or as text) so the browser never submits them; a closed `enableWhen` branch is a `<fieldset disabled>` | rendering them `readonly` and ignoring what arrives | `readonly` still submits and `disabled` does not — using the attribute that matches the intent removes the trust question instead of answering it, and one attribute on a fieldset disables a whole branch | specified |
| D25 | the body **states** `subject.reference` and `id`; the server **verifies** them against the address and refuses a mismatch | taking them only from the URL and ignoring the body; trusting the body | silently ignoring hides tampering, trusting it lets a form answer for another patient — refusing does neither | specified |

### The exchange

| # | decision | instead of | why | status |
|---|---|---|---|---|
| D26 | one address; `__submit=1` distinguishes a submission from a recompute | `/validate` and `/submit`; a header | one address is one thing to write in a page, and a native submit reaches the same place | built |
| D27 | a recompute writes **nothing** | autosaving every change | a half-typed number is not an answer; drafts are a separate decision (Q2) | built |
| D28 | a successful submit answers with the grid plus `hx-location` | a 303 to the grid | the fragment is what htmx swaps; the location keeps the URL honest for a reload | built |
| D29 | both `application/x-www-form-urlencoded` and `multipart/form-data` parse | one of them | a file upload needs multipart, everything else does not | built |
| D30 | a new answer is `completed`, an existing one `amended`; nothing is replaced silently | overwriting in place | an amended answer is a clinical event, not an edit | built |
| D31 | a form that declares extraction goes through `$submit`, and extracting nothing is an **error** | a plain PUT, or a warning | "saved fine" with a chart that never moved is the failure this replaced | built |
| D32 | the Questionnaire is published to the box before `$submit` | assuming it is there | a file on disk is not a resource; the server answers `422 not-found`, which reads as "your answer is wrong" | built |
| D33 | identity comes from the address (`response=new` mints an id, `response=<id>` amends) | a nonce; a hash of the body | the address is already the state of the page, and a double submit therefore amends rather than duplicates | built |
| D34 | no client JS: the htmx path and the native-submit path produce the same result | a JS form runtime | it is testable server-side, and it works in a browser that blocks scripts | built |
| D35 | the server **transpiles** the form's expressions to plain JS and sends it **inline** with the form, under a nonce | shipping a FHIRPath engine to the browser; serving the code as a separate versioned file; evaluating only on the server (chatty) | an engine plus response-assembly is a large client for a small job; a separate file buys a cache nobody needed and a URL to invalidate. The ban on JS in templates is about hand-written code — generated code has the standing of the generated markup around it. The server still re-evaluates everything on collect, so a client rule can only wrongly *show* something, never wrongly *store* it | specified |
| D36 | the transpiler may refuse: what it cannot express keeps its server round trip | hand-writing the hard rules; refusing to transpile anything unless everything transpiles | a hand-written rule is a second implementation, which is where two evaluators drift apart | specified |
| D37 | the two evaluators are held together by a **test**, not by care: the same answers through the server and through the generated module must agree | reviewing the transpiler; trusting it | drift is silent by nature, and only an executable check notices it | specified |

### What the browser decides

| # | decision | instead of | why | status |
|---|---|---|---|---|
| D38 | a draft is a **second submit button** (`formaction=…&status=in-progress`, `formnovalidate`) | a hidden `status` field; a separate endpoint | the submitter is how HTML expresses "this click means something else", and `formnovalidate` is the only way an unfinished form can be posted at all | specified |
| D39 | cross-field rules are SDC **`targetConstraint`** — expression, human message, severity — evaluated after the answer is assembled | hard-coding them in whoever renders the form; leaving them to the server that stores it | a rule written in a page cannot travel with the form or be reviewed with it | specified |
| D40 | precision picks the control: year → number, year-month → `<input type=month>`, full → `date` | one date input and a text fallback for anything partial | partial dates are ordinary in histories, and the browser has a control for the commonest of them | specified |
| D41 | a branch closed by `enableWhen` is **not rendered at all** where it can be dropped, and `<fieldset disabled>` where it must stay visible (`disabledDisplay: protected`) | hiding it with CSS or the `hidden` attribute | only `disabled` removes it from both the body and constraint validation; a hidden-but-enabled `required` field makes the browser refuse to submit and point at nothing | specified |

## Open questions

Not decided. Each one changes something in the table above.

| # | question | what hangs on it |
|---|---|---|
| Q1 | should the stated `subject.reference`/`id` be signed (HMAC) rather than verified against the address? | verification is enough while the address is authoritative; signing would matter if a form is ever posted somewhere other than where it was rendered |
| Q2 | do we support **drafts**? The mechanism is settled (D38: a second submit button), the product question is not | a patient filling twenty questions on a phone loses everything on a dropped connection. Costs: a second write path, answers that exist but are not answers, and a rule for what happens to a draft nobody ever finishes |
| Q3 | what happens to existing answers when the **form changes**? | canonical url + `version`: does an old answer render against the old definition, or against today's? Renaming a `linkId` is currently a silent data loss |
| Q4 | is an unknown field an error for **external** posters too, or only for us? | strictness is right for our agent; a third-party integration may need "ignore what you do not know" |
| Q5 | do we ever convert units? | refusing is honest but a patient app that only knows Celsius cannot answer a Fahrenheit form |
| Q6 | paged forms (`itemControl: page`, wizard steps) — where does "which page" live? | the URL, presumably; but then a recompute must not lose it |
| Q7 | file answers: where does the byte go — `Binary`, `DocumentReference`, blob storage? and who scans it? | needed before `attachment` can be carried at all |
| Q8 | does an amend write a `Provenance`? | FHIR has no audit of its own for this; "who changed this answer and when" is currently only `meta.lastUpdated` |
| Q9 | two people amending the same answer at once | last-write-wins today. `If-Match`/ETag would make the second one fail loudly instead |
| Q10 | translations — which `text` is rendered, and which is stored on the response? | a Russian-speaking patient answering a form authored in English: the answer should record what **they** were asked |

## What is specified here and not yet built

Written down so the gap is a decision, not a surprise. In rough order of how much
each one costs when it bites:

| gap | today | what it costs |
|---|---|---|
| the answer's own elements (`id`, `authored`, `status`, `subject.reference`) | an amend rebuilds the answer from what was rendered | hidden values and anything the form did not draw are lost on every edit |
| `hidden` items | rendered like any other question | a populated score or source value is shown to the user and editable |
| `readOnly` not enforced in `collect` | a posted value is read | a crafted request overwrites a field the form never offered |
| reserved-name check | none | a `linkId` called `__submit` silently breaks the form |
| repeating groups (`bp#0/sbp`) | rendered as one group, collected as one repetition | forms that ask "list every medication" cannot be answered |
| `answer.item` (follow-ups under one option) | not carried | "if yes, then…" has to be modelled as a sibling with `enableWhen` |
| `attachment`, `reference` | not carried | a form asking for a file or a resource has to render and collect it itself |
| partial dates, `dateTime` offset | native inputs only | `1990-05` cannot be entered; a `dateTime` is stored without an offset |
| `targetConstraint` (cross-field rules) | per-field validation only | "diastolic below systolic" has nowhere to live but a page |
| `shortText` | not read | a table layout has no column headings to render |
| `unitOpen` | assumed closed | a form that allows a typed unit is silently narrowed |
| `openLabel` | not read | the free-text box of an open choice has a label we invented |
| `minLength`, `maxDecimalPlaces` | not checked | a date can be answered less precisely than the form demands |

The first four are small and are what the round-trip guarantee actually rests on;
the rest can wait for a form that needs them.
