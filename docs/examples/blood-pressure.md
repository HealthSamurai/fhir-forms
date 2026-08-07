# Blood pressure and compound quantities

This example combines repeated groups, Quantity components and a bespoke
two-column layout without changing Questionnaire semantics.

## Questionnaire

~~~yaml
- linkId: reading
  type: group
  text: Reading
  repeats: true
  item:
    - linkId: systolic
      type: quantity
      text: Systolic
      required: true
      code: [{ system: http://loinc.org, code: 8480-6 }]
      extension:
        - { url: .../questionnaire-unitOption,
            valueCoding: { system: http://unitsofmeasure.org, code: "mm[Hg]" } }
        - { url: .../questionnaire-unitOption,
            valueCoding: { system: http://unitsofmeasure.org, code: kPa } }
    - linkId: diastolic
      type: quantity
      text: Diastolic
      required: true
      code: [{ system: http://loinc.org, code: 8462-4 }]
      # same unit options
~~~

A unit choice requires `quantity`; a decimal answer cannot preserve which of
several units the user selected.

## HTML

One visual row still exposes canonical components:

~~~html
<fieldset data-repeat-row data-repeat-index="0">
  <legend>Reading 1</legend>
  <div class="two-column-reading">
    <div role="group" aria-labelledby="sys-label">
      <span id="sys-label">Systolic</span>
      <input name="item[reading][0].item[systolic].value"
             type="number" step="any" required>
      <select name="item[reading][0].item[systolic].unit">
        <option value="mm[Hg]">mmHg</option>
        <option value="kPa">kPa</option>
      </select>
    </div>

    <div role="group" aria-labelledby="dia-label">
      <span id="dia-label">Diastolic</span>
      <input name="item[reading][0].item[diastolic].value"
             type="number" step="any" required>
      <select name="item[reading][0].item[diastolic].unit">
        <option value="mm[Hg]">mmHg</option>
        <option value="kPa">kPa</option>
      </select>
    </div>
  </div>
</fieldset>
~~~

## Collection

~~~text
item[reading][0].item[systolic].value = 132
item[reading][0].item[systolic].unit  = mm[Hg]
item[reading][0].item[diastolic].value = 82
item[reading][0].item[diastolic].unit  = mm[Hg]
~~~

The Collector joins each value/unit pair and emits the repeated response group:

~~~yaml
- linkId: reading
  item:
    - linkId: systolic
      answer:
        - valueQuantity:
            value: 132
            unit: "mm[Hg]"
            system: http://unitsofmeasure.org
            code: "mm[Hg]"
    - linkId: diastolic
      answer:
        - valueQuantity:
            value: 82
            unit: "mm[Hg]"
            system: http://unitsofmeasure.org
            code: "mm[Hg]"
~~~

Grid layout and occurrence indexes are presentation details and do not appear in
the QuestionnaireResponse. See [Field names](../field-names.md),
[FHIR type binding](../types.md) and [Repeats](../repeats.md).

