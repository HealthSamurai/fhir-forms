# Type mapping

One block per type: what is written in the form, what the browser renders, what it
posts, what is stored. Names follow the grammar above — a bare path for a
primitive, named parts for a composite answer.

### boolean

```yaml
- { linkId: smoker, type: boolean, text: Do you smoke? }
```
```haml
%div{ data: { field: "item[smoker]" }, role: "radiogroup", "aria-label": "Do you smoke?" }
  %label
    %input{ type: "radio", name: "item[smoker]", value: "true" }
    Yes
  %label
    %input{ type: "radio", name: "item[smoker]", value: "false" }
    No
```
```
item[smoker] = true        →   { linkId: smoker, answer: [{ valueBoolean: true }] }
```

Two radios, never a checkbox: an unchecked box posts nothing, so "no" and "not
answered" would arrive as the same request.

### integer · decimal

```yaml
- { linkId: slept, type: integer, text: Hours slept, extension: [ minValue 0, maxValue 24 ] }
- { linkId: hba1c, type: decimal, text: HbA1c }
```
```haml
%input{ name: "item[slept]", type: "number", step: 1,     min: 0, max: 24 }
%input{ name: "item[hba1c]", type: "number", step: "any" }
```
```
item[slept] = 6            →   answer: [{ valueInteger: 6 }]
item[hba1c] = 6.4          →   answer: [{ valueDecimal: 6.4 }]
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
%input{  name: "item[weight].value", type: "number", step: "any" }
%select{ name: "item[weight].unit" }
  %option{ value: "kg" } kg
  %option{ value: "[lb_av]" } lb
```
```
item[weight].value = 83.5
item[weight].unit  = kg    →   answer: [{ valueQuantity: { value: 83.5, unit: kg, code: kg,
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
%input{ name: "item[onset]", type: "date" }
%input{ name: "item[seen]",  type: "datetime-local" }
%input{ name: "item[took]",  type: "time" }
```
```
item[onset] = 2019-04-01   →   answer: [{ valueDate: "2019-04-01" }]
item[seen]  = 2026-08-05T09:14
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
%input{    name: "item[allergy]", type: "text", maxlength: 60 }
%textarea{ name: "item[note]" }
%input{    name: "item[link]", type: "url" }
```
```
item[allergy] = peanuts    →   answer: [{ valueString: "peanuts" }]
item[note]    = …          →   answer: [{ valueString: "…" }]
item[link]    = https://…  →   answer: [{ valueUri: "https://…" }]
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
%input{ type: "hidden", name: "item[pos].system", value: "http://snomed.info/sct" }
%div{ data: { field: "item[pos]" }, role: "radiogroup" }
  %label
    %input{ type: "radio", name: "item[pos].code", value: "33586001" }
    Sitting
  %label
    %input{ type: "radio", name: "item[pos].code", value: "10904000" }
    Standing
```
```
item[pos].system = http://snomed.info/sct
item[pos].code = 33586001  →   answer: [{ valueCoding: { system: http://snomed.info/sct,
                                                        code: 33586001, display: Sitting } }]
```

The canonical wire form mirrors Coding components. `system + code` are
validated against `answerOption` or `answerValueSet`; `display` is optional
and is not identity. If a single select or radio must carry the whole Coding,
its bare field may use `system|code|display` sugar. `itemControl` still decides
the visual control.

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
  %input{ type: "radio", name: "item[mood].code", value: "bad" }
  Not great
%input{ name: "item[mood].text", type: "text", placeholder: "or say it your own way" }
```
```
item[mood].code = bad      →   answer: [{ valueCoding: { code: bad, display: Not great } }]
item[mood].text = tired after the shift
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
%input{ name: "item[referrer].reference", type: "hidden", value: "Practitioner/17" }
-# the visible control is a combobox that searches; picking one sets the hidden field
```
```
item[referrer].reference = Practitioner/17
                          →   answer: [{ valueReference: { reference: Practitioner/17 } }]
```

`Reference.display` is filled by the server from the resource, never sent.

### attachment

```yaml
- { linkId: photo, type: attachment, text: Photo of the meter }
```
```haml
%input{ name: "item[photo].json", type: "hidden",
        value: '{"contentType":"image/jpeg","url":"Binary/abc"}' }
```
```
item[photo].json = {…}     →   answer: [{ valueAttachment: { contentType: image/jpeg, url: Binary/abc } }]
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
%fieldset{ data: { field: "item[bp]", row: 0 } }
  %legend Reading 1
  -# children are named item[bp][0]/<linkId>
%p Rest for five minutes before measuring.
```

A group has no field of its own — it contributes a segment to the path of its
children, and only when it repeats. A `display` never has a field; a body that
contains one is an unknown field.
