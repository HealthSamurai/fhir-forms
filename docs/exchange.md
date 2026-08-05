# Request and response exchange

## The exchange

A form posts to its own address, url-encoded (or multipart — both parse), and the
server answers with the form again:

| body | server does | answers with |
|---|---|---|
| no `__submit`, recompute requested | collects, runs server-side reactive rules — **writes nothing** | the form, re-rendered, with enabled items and calculated outputs updated |
| `__submit=1`, something invalid | collects, does not write | the form, with each problem on the field that caused it (`data-invalid`, `data-role="error"`) |
| `__submit=1`, valid | `questionnaire.answer` — writes the response, extracts measurements if the form declares them, closes a Task that asked for it | the answers grid, and an `hx-location` to the address it now lives at |

The recompute exchange is the baseline that makes the form correct without a
client expression engine. It may use `hx-trigger="change delay:250ms"` with
`target: this, swap: outerHTML`. A native submit with JavaScript disabled produces
the same evaluated state; it is less immediate only because no script initiates
the request on change.

A renderer may instead compile supported `enableWhen` and calculated expressions
to a small client runtime. Such rules update immediately and do not post on every
change. Unsupported or server-dependent rules retain the recompute exchange, so
one form may use both strategies. In all cases final collection evaluates the
rules on the server and ignores client assertions about enabled or calculated
state. See [Enablement and calculated fields](/spec/expressions).

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
