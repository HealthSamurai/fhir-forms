# PHQ-9 scoring example

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
{ "score": { "total": { "sum": ["item[q1].code", "item[q2].code", … ], "by": "ordinal" } } }
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

  %div{ data: { field: "item[q1]", type: "choice", required: true } }
    %label Little interest or pleasure in doing things
    %label
      %input{ type: "radio", name: "item[q1].code", value: "LA6568-5", data: { ordinal: 0 } }
      Not at all
    %label
      %input{ type: "radio", name: "item[q1].code", value: "LA6569-3", data: { ordinal: 1 } }
      Several days
    %label
      %input{ type: "radio", name: "item[q1].code", value: "LA6570-1", data: { ordinal: 2 } }
      More than half the days
    %label
      %input{ type: "radio", name: "item[q1].code", value: "LA6571-9", data: { ordinal: 3 } }
      Nearly every day

  -# … q2 … q9, the same shape

  %div{ data: { field: "item[total]", type: "integer" } }
    %label Total score
    %output{ data: { role: "score", id: "total" } } 0
    %progress{ max: 27, value: 0 }

  %button{ type: "submit", name: "__submit", value: 1 } Submit
```

with `rules` being the flattened declaration, not code:

```jsonc
{ "score": { "total": { "sum": ["item[q1].code", "item[q2].code", "…", "item[q9].code"],
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

