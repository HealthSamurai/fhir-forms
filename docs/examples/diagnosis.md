# Diagnosis example

## A diagnosis, and why it is a different mechanism

```yaml
- linkId: dx
  type: group
  text: Diagnosis
  repeats: true
  definition: http://hl7.org/fhir/StructureDefinition/Condition
  item:
    - linkId: dx-code
      type: choice
      text: Diagnosis
      required: true
      definition: http://hl7.org/fhir/StructureDefinition/Condition#Condition.code
      answerValueSet: http://ex/ValueSet/icd10-all
      extension:
        - url: .../questionnaire-itemControl
          valueCodeableConcept: { coding: [{ code: autocomplete }] }

    - linkId: dx-onset
      type: date                       # partial dates are normal here: "2019"
      text: Since
      definition: http://hl7.org/fhir/StructureDefinition/Condition#Condition.onsetDateTime

    - linkId: dx-status
      type: choice
      text: Status
      definition: http://hl7.org/fhir/StructureDefinition/Condition#Condition.clinicalStatus
      answerValueSet: http://hl7.org/fhir/ValueSet/condition-clinical
```

Three things differ from the blood pressure form:

- **The answers are bound, not enumerated.** ICD-10 is tens of thousands of codes;
  `answerValueSet` names a set and the terminology server expands it filtered by
  what the user has typed — hence `autocomplete`. Which ICD-10 also matters:
  `http://hl7.org/fhir/sid/icd-10` (WHO), `…/icd-10-cm` (US),
  `http://fhir.de/CodeSystem/bfarm/icd-10-gm` (Germany). A form written for one
  country is not valid in another, and that is a property of the form.
- **`definition`, not `code`.** A diagnosis is a `Condition`, and Observation-based
  extraction can only make Observations. Definition-based extraction is the
  mechanism: the group says which resource each repetition is, and each question
  says which element of it the answer fills.
- **Ask what the question really is.** "Have you ever been told you have diabetes"
  is patient-reported history (an Observation, or nothing but the answer itself);
  "the diagnosis for this visit" is `Encounter.diagnosis`; "a problem we are
  managing" is a `Condition` on the problem list. The form looks nearly the same
  in all three; where the answer lands does not.

