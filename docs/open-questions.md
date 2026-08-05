# Open questions and implementation gaps

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
