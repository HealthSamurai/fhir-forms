# Extraction

Extraction turns a QuestionnaireResponse into other FHIR resources. It is
downstream of the HTML binding contract: the same valid response must extract the
same resources regardless of which conforming HTML form produced it.

## Choosing a mechanism

| result | SDC mechanism | definition source |
|---|---|---|
| measurements, scores, and screening results | observation-based | item.code, optional coded group, and observationExtract |
| Condition, AllergyIntolerance, MedicationStatement, or another resource type | definition-based | group and item definition paths |
| resources with fixed surrounding content | template-based | extraction template with answer placeholders |
| transformations not expressible above | StructureMap-based | explicit map |

Use the lightest mechanism that preserves the clinical meaning. A single
Questionnaire may combine mechanisms, such as extracting vital signs as
Observations and diagnoses as Conditions.

## Presentation independence

HTML layout, widget composition, and field component names do not select an
extraction mechanism. The Questionnaire carries extraction metadata; the
Collector produces the response tree on which extraction operates.

A visually similar question may have different clinical meaning. Patient-reported
history, an encounter diagnosis, and a managed problem may use the same
autocomplete widget while extracting differently or not extracting at all.

## Host responsibilities

The host publishes or resolves the Questionnaire version used for extraction,
executes extraction only after successful final collection, and handles the
response and extracted resources consistently. Amendment and idempotency policy
must prevent an edited answer from creating duplicate clinical records.

Extraction promised by the Questionnaire is part of operation success. Producing
no expected resources or failing midway is an error, not a successful form save
with a warning.
