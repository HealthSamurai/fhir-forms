# Blood pressure and quantities

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

    %div{ data: { field: "item[bp][0].item[sys]" } }
      %label{ for: "bp#0/sys" }
        Systolic
        %span{ "aria-hidden": true } *
      %input{ id: "bp#0/sys", name: "item[bp][0].item[sys].value", data: { field: "item[bp][0].item[sys].value" },
              type: "number", step: "any", min: 40, max: 300, required: true,
              value: 132, "aria-describedby": "u-bp#0/sys" }
      %span#u-bp-0-sys mm[Hg]              -# itemControl: unit — beside the box

    %div{ data: { field: "item[bp][0].item[dia]" } }
      %label{ for: "bp#0/dia" }
        Diastolic
        %span{ "aria-hidden": true } *
      %input{ id: "bp#0/dia", name: "item[bp][0].item[dia].value", data: { field: "item[bp][0].item[dia].value" },
              type: "number", step: "any", min: 20, max: 200, required: true, value: 82 }
      %span mm[Hg]

    %div{ data: { field: "item[bp][0].item[pos]" }, role: "radiogroup", "aria-label": "Position" }
      %input{ type: "hidden", name: "item[bp][0].item[pos].system", value: "http://snomed.info/sct" }
      %label
        %input{ type: "radio", name: "item[bp][0].item[pos].code", value: "33586001", checked: true }
        Sitting
      %label
        %input{ type: "radio", name: "item[bp][0].item[pos].code", value: "10904000" }
        Standing
      %label
        %input{ type: "radio", name: "item[bp][0].item[pos].code", value: "102538003" }
        Lying

    %button{ type: "submit", name: "__drop", value: "item[bp][0].item[sys].value,132",
             data: { action: "drop" }, "aria-label": "Remove reading 1" } ×

  -# the empty slot that becomes the next reading; it carries no answers,
  -# so nothing is written for it until somebody types
  %fieldset{ data: { field: "bp", row: 1 } }
    %legend Reading 2
    %div{ data: { field: "item[bp][1].item[sys]" } }
      %label Systolic
      %input{ name: "item[bp][1].item[sys].value", type: "number", step: "any", min: 40, max: 300 }
      %span mm[Hg]
    %div{ data: { field: "item[bp][1].item[dia]" } }
      %label Diastolic
      %input{ name: "item[bp][1].item[dia].value", type: "number", step: "any", min: 20, max: 200 }
      %span mm[Hg]
    %div{ data: { field: "item[bp][1].item[pos]" }, role: "radiogroup", "aria-label": "Position" }
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
   several units this becomes a `%select{ name: "item[bp][0].item[sys].unit" }`.
6. **The browser validates what it cheaply can** (`required`, `min`, `max`,
   `step`) and the server validates all of it again. The attributes are a courtesy
   to the person typing, never the check that matters.

What the browser posts, one parameter per line (names as written; on the wire the
separators are percent-encoded, so `item[bp][0].item[sys].unit` travels as
`item%2Fbp%230%2Fsys%3Aunit`):

```
questionnaire        = http://ex/Questionnaire/bp
subject.reference    = Patient/anna
id                   = qr-7
authored             = 2026-08-05T09:10:00Z
status               = completed
item[bp][0].item[sys].value  = 132
item[bp][0].item[sys].unit   = mm[Hg]
item[bp][0].item[dia].value  = 82
item[bp][0].item[dia].unit   = mm[Hg]
item[bp][0].item[pos].system = http://snomed.info/sct
item[bp][0].item[pos].code   = 33586001
__submit             = 1
```

Nothing is posted for the empty second reading — `item[bp][1].item[sys].value` and its
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
              unit: mm[Hg]                  # from item[bp][0].item[sys].unit
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

*(The repeating-group part of this — `item[bp][0]/…`, the trailing slot, the
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
%div{ data: { field: "item[bp][0].item[sys]" } }
  %label{ for: "bp#0/sys" }
    Systolic
    %span{ "aria-hidden": true } *
  %input{ id: "bp#0/sys", name: "item[bp][0].item[sys].value", type: "number", step: "any",
          min: 40, max: 300, value: 132 }            -# the range, in the chosen unit
  %select{ name: "item[bp][0].item[sys].unit", data: { field: "item[bp][0].item[sys].unit" }, "aria-label": "Systolic unit" }
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
item[bp][0].item[sys].value=132&item[bp][0].item[sys].unit=mm[Hg]
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
item[bp][0].item[sys].value=132    item[bp][0].item[sys].unit=mm[Hg]   item[bp][0].item[dia].value=82   item[bp][0].item[pos].code=33586001
item[bp][2].item[sys].value=17.6   item[bp][2].item[sys].unit=kPa      item[bp][2].item[dia].value=10.4 item[bp][2].item[pos].code=10904000
id=qr-7   authored=2026-08-05T09:10:00Z   subject.reference=Patient/anna   status=completed
__submit=1
```

(`#2` and no `#1` because the middle reading was removed before submitting.)

Turning that into a QuestionnaireResponse is one walk of the **questionnaire**,
never of the body — the body is asked for values by name, in the order the
definition asks its questions:

1. **Index the body once.** `item[bp][0].item[sys].value → ["132"]`, and so on. Drop empty values here
   (an empty field is *no answer*, not an empty one) and apply `__drop` before
   anything else looks at the values.
2. **Walk the items.** `display` is skipped; a question whose `enableWhen` is not
   satisfied is skipped entirely — it contributes no answer, not an empty one. The
   condition is evaluated against the **raw body**, so a rule may point at a
   question that appears later in the form.
3. **At a repeating group, discover the rows.** Everything matching `item[bp]#<i>/…` in
   the body: here `{0, 2}`. Sort them, renumber from zero, and walk the group's
   children once per row with `bp#<i>/` on the scope stack. A row that produced no
   answers at all — the trailing empty slot — is dropped.
4. **At a question, read and type.** `item[bp][0].item[sys].value` is `132` and its
   `:unit` is `mm[Hg]` → `valueQuantity { value: 132, unit: mm[Hg], system: UCUM,
   code: mm[Hg] }`. `item[bp][0].item[pos].code` is `33586001`, the item is a `choice`
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
