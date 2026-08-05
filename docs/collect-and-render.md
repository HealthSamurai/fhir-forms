# Collect and render

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
%div{ data: { field: "item[smoker]", type: "boolean", required: true } }
%div{ data: { field: "item[weight]", type: "quantity", unit: "kg" } }
%div{ data: { field: "item[pos]",    type: "choice" } }
%fieldset{ data: { field: "item[bp]", type: "group", row: 0 } }
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

