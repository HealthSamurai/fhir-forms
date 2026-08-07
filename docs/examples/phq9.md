# PHQ-9: compiled score and conditional question

The [live example](/examples/phq9) presents nine coded answers as a compact
matrix, calculates a score preview and conditionally enables functional impact.
It demonstrates mechanics, not diagnosis, triage or a safety workflow.

It follows the HL7 SDC
[PHQ-9 example](https://build.fhir.org/ig/HL7/sdc/en/Questionnaire-questionnaire-sdc-profile-example-PHQ9.html).

## Questionnaire rules

Answer options carry `itemWeight`; SDC FHIRPath calculates the total:

~~~yaml
- linkId: q1
  type: choice
  required: true
  answerOption:
    - valueCoding: { system: http://loinc.org, code: LA6568-5, display: Not at all }
      extension:
        - { url: http://hl7.org/fhir/StructureDefinition/itemWeight,
            valueDecimal: 0 }
    # remaining options have weights 1, 2 and 3

- linkId: impact
  type: choice
  extension:
    - url: .../sdc-questionnaire-enableWhenExpression
      valueExpression:
        language: text/fhirpath
        expression: >
          %resource.item.where(linkId.matches('q[1-9]'))
            .answer.value.where(code != 'LA6568-5').exists()

- linkId: total
  type: integer
  readOnly: true
  extension:
    - url: .../sdc-questionnaire-calculatedExpression
      valueExpression:
        language: text/fhirpath
        expression: >
          %resource.item.where(linkId.matches('q[1-9]'))
            .answer.value.weight().sum()
~~~

## HTML contract

The matrix design does not alter successful controls:

~~~html
<input name="item[q1].system" type="hidden" value="http://loinc.org">
<label>
  <input name="item[q1].code"
         type="radio"
         value="LA6568-5"
         data-phq-score="0">
  Not at all
</label>

<output data-phq-total>0 / 27</output>
~~~

The compiled client module derives `data-phq-score` from Questionnaire weights,
updates the unnamed output and disables the impact fieldset when its expression
is false.

## Server authority

Final collection:

1. discards submitted calculated fields;
2. validates one permitted Coding for each question;
3. resolves weights from the versioned Questionnaire;
4. recalculates total and enabled state;
5. discards answers from disabled branches;
6. passes sanitized entries and server-owned results to the Collector.

The response therefore contains user answers plus a trusted calculated item:

~~~yaml
- linkId: q1
  answer:
    - valueCoding: { system: http://loinc.org, code: LA6569-3 }
- linkId: total
  answer:
    - valueInteger: 3
~~~

The same rules may execute through htmx server recomputation. Only latency and
rendering change; field names and final collection do not.

