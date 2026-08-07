# FHIR type binding

The Questionnaire item type selects how lexical HTML entries become FHIR
`value[x]`. Submitted strings never choose their own type. Empty-answer and path
rules are defined in [HTML binding](html-binding.md).

## Primitive answers

| Questionnaire type | entry example | response value |
|---|---|---|
| boolean | `item[smoker] = false` | `valueBoolean` |
| integer | `item[count] = 6` | `valueInteger` |
| decimal | `item[hba1c] = 6.4` | `valueDecimal` |
| date | `item[onset] = 2019-04` | `valueDate` |
| dateTime | `item[seen] = 2026-08-05T09:14` | `valueDateTime` |
| time | `item[taken] = 09:14` | `valueTime` |
| string/text | `item[name] = Ada` | `valueString` |
| url | `item[report] = https://example.org/r` | `valueUri` |

Boolean forms are explicit; zero and false are answers. Numeric binding rejects
partial and non-finite values. FHIR dates preserve year, year-month or full-date
precision. A datetime-local value requires an authoritative offset from host
context.

## Quantity

~~~text
item[weight].value = 83.5
item[weight].unit  = kg
~~~

This materializes `valueQuantity`. Value is the primary component. With one fixed
Questionnaire unit, the server may supply its coding. With multiple units, the
selected unit is required when value is present and the stored answer preserves
what the user entered.

## Coding and choice

~~~text
item[position].system  = http://snomed.info/sct
item[position].code    = 33586001
item[position].display = Sitting
~~~

System and code establish identity. Display is optional and is verified or
replaced from trusted Questionnaire options or terminology.

Choice and open-choice Coding is checked against `answerOption` or
`answerValueSet` for the Questionnaire's FHIR version. Open choice may instead
submit `.text`, producing `valueString`; Coding and free text cannot be mixed for
one occurrence.

## Reference and Attachment

Reference uses `.reference`, optional `.display` and supported identifier
components. The server validates target type and derives trusted display text.

Attachment may use a `File` at the bare item path plus supported metadata such as
`.title` or `.contentType`. Storage, scanning and Binary/DocumentReference policy
belong to the host adapter.

## Structural items

Group and display items never carry answers. A group remains in descendant paths;
a display item produces content only. Submitted answers targeting either are
issues.

## Binding registry

For every complex type, the shared registry defines legal and required
components, its primary component, lexical conversion, duplicate behavior,
materialization and values supplied from the definition. Unknown submitted
properties are never copied into FHIR values.

