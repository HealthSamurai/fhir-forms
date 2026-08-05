# Blood pressure and compound quantities

This example shows why presentation and semantics must be separable. The
Questionnaire defines one repeatable blood-pressure reading. The HTML may present
systolic value and unit as one compact widget, place systolic and diastolic side
by side, and add readings dynamically without changing the FHIR model.

## Questionnaire excerpt

~~~yaml
resourceType: Questionnaire
url: http://example.org/Questionnaire/blood-pressure
version: 1.0.0
status: active
item:
  - linkId: reading
    type: group
    text: Reading
    repeats: true
    code:
      - { system: http://loinc.org, code: 85354-9 }
    item:
      - linkId: systolic
        type: quantity
        text: Systolic
        required: true
        code:
          - { system: http://loinc.org, code: 8480-6 }
        extension:
          - url: .../questionnaire-unitOption
            valueCoding:
              { system: http://unitsofmeasure.org, code: mm[Hg] }
          - url: .../questionnaire-unitOption
            valueCoding:
              { system: http://unitsofmeasure.org, code: kPa }

      - linkId: diastolic
        type: quantity
        text: Diastolic
        required: true
        code:
          - { system: http://loinc.org, code: 8462-4 }
        extension:
          - url: .../questionnaire-unitOption
            valueCoding:
              { system: http://unitsofmeasure.org, code: mm[Hg] }
          - url: .../questionnaire-unitOption
            valueCoding:
              { system: http://unitsofmeasure.org, code: kPa }

      - linkId: position
        type: choice
        text: Position
        answerOption:
          - valueCoding:
              { system: http://snomed.info/sct, code: 33586001, display: Sitting }
          - valueCoding:
              { system: http://snomed.info/sct, code: 10904000, display: Standing }
~~~

A unit choice requires quantity. A decimal answer can rely on one fixed unit in
the definition, but it cannot preserve which of several units the user selected.

## Bespoke HTML excerpt

The visual widget may be arbitrary. Its successful controls carry the contract:

~~~html
<fieldset data-repeat="item[reading]">
  <legend>Reading 1</legend>

  <div class="measurements">
    <div role="group" aria-labelledby="systolic-label">
      <span id="systolic-label">Systolic</span>
      <input
        name="item[reading][0].item[systolic].value"
        type="number"
        step="any"
        required
      >
      <select
        name="item[reading][0].item[systolic].unit"
        aria-label="Systolic unit"
      >
        <option value="mm[Hg]">mmHg</option>
        <option value="kPa">kPa</option>
      </select>
    </div>

    <div role="group" aria-labelledby="diastolic-label">
      <span id="diastolic-label">Diastolic</span>
      <input
        name="item[reading][0].item[diastolic].value"
        type="number"
        step="any"
        required
      >
      <select
        name="item[reading][0].item[diastolic].unit"
        aria-label="Diastolic unit"
      >
        <option value="mm[Hg]">mmHg</option>
        <option value="kPa">kPa</option>
      </select>
    </div>
  </div>

  <input
    name="item[reading][0].item[position].system"
    type="hidden"
    value="http://snomed.info/sct"
  >
  <select name="item[reading][0].item[position].code">
    <option value="33586001">Sitting</option>
    <option value="10904000">Standing</option>
  </select>
</fieldset>
~~~

A second reading repeats the same markup with occurrence index <code>[1]</code>.
Before submission, remaining occurrences are contiguous and in document order.
Indexes select submitted occurrences but are not stored in FHIR.

## Entry list

For one sitting reading, the browser contributes:

~~~text
item[reading][0].item[systolic].value = 132
item[reading][0].item[systolic].unit = mm[Hg]
item[reading][0].item[diastolic].value = 82
item[reading][0].item[diastolic].unit = mm[Hg]
item[reading][0].item[position].system = http://snomed.info/sct
item[reading][0].item[position].code = 33586001
~~~

The Collector resolves every segment against the Questionnaire. It joins value
and unit into each Quantity, validates the Coding against answerOption, and
materializes the response in definition order.

## QuestionnaireResponse excerpt

~~~yaml
item:
  - linkId: reading
    text: Reading
    item:
      - linkId: systolic
        text: Systolic
        answer:
          - valueQuantity:
              value: 132
              unit: mm[Hg]
              system: http://unitsofmeasure.org
              code: mm[Hg]
      - linkId: diastolic
        text: Diastolic
        answer:
          - valueQuantity:
              value: 82
              unit: mm[Hg]
              system: http://unitsofmeasure.org
              code: mm[Hg]
      - linkId: position
        text: Position
        answer:
          - valueCoding:
              system: http://snomed.info/sct
              code: 33586001
              display: Sitting
~~~

The response contains clinical answers, not layout decisions. It does not record
the grid, compound-widget boundary, CSS, or occurrence index. Those may change
without changing the Questionnaire or result.

Path syntax is normative in [Field names](../field-names.md), Quantity binding in
[FHIR type binding](../types.md), and repeat behavior in
[Rendering](../rendering.md).
