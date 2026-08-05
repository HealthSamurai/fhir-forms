# FHIR type binding

Type binding converts lexical HTML entries into FHIR answer values. The
Questionnaire item type selects the binding rule; neither the field name nor the
submitted string may select its own type.

Field paths below use the canonical grammar from
[Field names and Questionnaire paths](field-names.md). Empty-answer behavior is
defined once in [HTML form entry list](entry-list.md).

## Primitive answers

A primitive answer uses the bare item path.

| Questionnaire type | example entry | QuestionnaireResponse value | typical HTML control |
|---|---|---|---|
| boolean | item[smoker] = false | valueBoolean | two radios with true/false values |
| integer | item[count] = 6 | valueInteger | number, step 1 |
| decimal | item[hba1c] = 6.4 | valueDecimal | number, step any |
| date | item[onset] = 2019-04 | valueDate | year, month, or date control matching required precision |
| dateTime | item[seen] = 2026-08-05T09:14 | valueDateTime | datetime-local plus an authoritative offset context |
| time | item[taken] = 09:14 | valueTime | time |
| string | item[name] = Ada | valueString | single-line input |
| text | item[note] = ... | valueString | textarea |
| url | item[report] = https://example.org/r | valueUri | URL input |

Boolean parsing accepts only the declared true and false lexical forms. Zero and
false are answers, not emptiness.

Integer and decimal parsing must reject non-finite or partial values rather than
storing NaN. A locale adapter may normalize a decimal comma before binding, but
the resulting value must still be a valid FHIR decimal.

FHIR dates may have year, year-month, or full-date precision. A renderer must not
force a more precise value than the Questionnaire requests. A datetime-local
control has no offset; the host must attach the correct offset from trusted
workflow context before materialization.

## Quantity

A Quantity uses components of one item occurrence:

~~~text
item[weight].value = 83.5
item[weight].unit  = kg
~~~

The Collector materializes:

~~~json
{
  "valueQuantity": {
    "value": 83.5,
    "unit": "kg",
    "system": "http://unitsofmeasure.org",
    "code": "kg"
  }
}
~~~

Value is the primary component. An optional Quantity with an empty value is
absent even if a unit selector posted its default.

When the Questionnaire declares one fixed unit, the form may omit the unit
control and the server fills the unit coding from the definition. When it offers
multiple units, the selected unit is part of the answer and is required whenever
a value is present. A decimal item cannot offer a meaningful unit choice because
valueDecimal has nowhere to store it.

The stored answer preserves the entered unit. Conversion may be used for display
or validation, but silent normalization on ingest loses what the user entered.

## Coding and choice

The canonical component form is:

~~~text
item[position].system  = http://snomed.info/sct
item[position].code    = 33586001
item[position].display = Sitting
~~~

System and code establish identity. Display is optional presentation and is
verified or replaced from the Questionnaire options or trusted terminology.

For R4 choice and open-choice items, the Collector validates Coding against
answerOption or answerValueSet. In R5 the equivalent binding uses coding with
answerConstraint. Implementations must bind against the FHIR version of the
Questionnaire rather than blending the two models.

A non-repeating Coding may use the optional atomic form defined in
[field-names.md](field-names.md). The component form remains canonical.

An open choice may instead carry free text:

~~~text
item[mood].text = tired after the shift
~~~

This produces valueString. A request must not collapse a coding and free text
into one ambiguous scalar answer.

## Reference

Reference components use the same item path:

~~~text
item[referrer].reference = Practitioner/17
item[referrer].display   = Dr Smith
~~~

The server validates the reference target and derives trusted display text.
Display alone never identifies a resource.

## Attachment

A multipart form may submit a File at the bare item path and supported metadata
components such as title or contentType. Binary storage, malware scanning,
external URLs, and the Binary/DocumentReference policy belong to the host
adapter.

Attachment support is capability-dependent until that lifecycle is profiled
normatively. An opaque JSON field is not a general substitute for typed
attachment binding.

## Structural item types

Group and display items never carry answers.

A group contributes an explicit item step to every descendant path, whether or
not the group repeats:

~~~text
item[contact].item[email]
item[visit][0].item[date]
~~~

A display item produces content only. Any submitted answer targeting a group or
display item is an issue.

## Compound-value rules

For every complex type, the binding registry defines:

- legal and required components;
- its primary component and empty-answer rule;
- duplicate and scalar/component collision behavior;
- lexical conversion and FHIR materialization;
- definition-derived values that the browser need not post.

Unknown components are rejected. A Collector must not preserve arbitrary
submitted properties in a FHIR datatype.
