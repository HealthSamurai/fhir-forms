# PHQ-9 calculated score

PHQ-9 demonstrates a rich reactive form whose score remains a Questionnaire
answer rather than browser-owned state.

## Questionnaire excerpt

Each option carries its ordinal weight:

~~~yaml
- linkId: q1
  type: choice
  text: Little interest or pleasure in doing things
  code:
    - { system: http://loinc.org, code: 44250-9 }
  answerOption:
    - valueCoding:
        { system: http://loinc.org, code: LA6568-5, display: Not at all }
      extension:
        - { url: .../questionnaire-ordinalValue, valueDecimal: 0 }
    - valueCoding:
        { system: http://loinc.org, code: LA6569-3, display: Several days }
      extension:
        - { url: .../questionnaire-ordinalValue, valueDecimal: 1 }
    - valueCoding:
        { system: http://loinc.org, code: LA6570-1, display: More than half the days }
      extension:
        - { url: .../questionnaire-ordinalValue, valueDecimal: 2 }
    - valueCoding:
        { system: http://loinc.org, code: LA6571-9, display: Nearly every day }
      extension:
        - { url: .../questionnaire-ordinalValue, valueDecimal: 3 }

- linkId: total
  type: integer
  text: Total score
  readOnly: true
  code:
    - { system: http://loinc.org, code: 44261-6, display: PHQ-9 total score }
  extension:
    - url: .../sdc-questionnaire-calculatedExpression
      valueExpression:
        language: text/fhirpath
        expression: ...sum ordinal values for q1 through q9...
~~~

The total is a coded calculated item. It belongs in the resulting
QuestionnaireResponse even though the user never posts it.

## Bespoke HTML excerpt

A designer may use segmented controls, a compact matrix, cards, or a mobile
stepper. The answer binding remains the same:

~~~html
<section data-field="item[q1]">
  <h2>Little interest or pleasure in doing things</h2>
  <input
    name="item[q1].system"
    type="hidden"
    value="http://loinc.org"
  >
  <label>
    <input name="item[q1].code" type="radio" value="LA6568-5">
    Not at all
  </label>
  <label>
    <input name="item[q1].code" type="radio" value="LA6569-3">
    Several days
  </label>
  <label>
    <input name="item[q1].code" type="radio" value="LA6570-1">
    More than half the days
  </label>
  <label>
    <input name="item[q1].code" type="radio" value="LA6571-9">
    Nearly every day
  </label>
</section>

<section data-field="item[total]">
  <span>Total score</span>
  <output id="phq9-total">0</output>
  <progress max="27" value="0"></progress>
</section>
~~~

The output has no name. Client JavaScript may update it immediately, but it does
not submit a score.

## Runtime behavior

The Reactive Runtime may compile the supported sum into client JavaScript. The
generated code reads canonical answer fields and updates the output. If the
expression cannot be compiled safely, a server recompute renders the same state.

On every final collection, the server:

1. validates the nine selected Codings;
2. reads ordinal weights from the Questionnaire;
3. calculates the typed integer total;
4. ignores any hostile client entry targeting the read-only total;
5. places its own result in the QuestionnaireResponse.

Server and client execution must agree on the same fixtures. See
[Reactive runtime](../expressions.md).

## Result excerpt

~~~yaml
item:
  - linkId: q1
    answer:
      - valueCoding:
          system: http://loinc.org
          code: LA6569-3
          display: Several days
  # q2 through q9
  - linkId: total
    answer:
      - valueInteger: 8
~~~

Interpretation bands are not part of this presentation example. If they are
clinical rules that must travel with the form, they require an explicit,
reviewable definition rather than hard-coded renderer text.
