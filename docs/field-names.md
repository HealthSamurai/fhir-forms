# Field names and Questionnaire paths

HTML control names encode paths into a `QuestionnaireResponse`. The canonical
syntax deliberately uses different notation for the three operations involved:

- `item[linkId]` selects a Questionnaire item.
- `[index]` selects an occurrence of a repeating item or answer.
- `.component` selects a component of a complex FHIR value.
- `.item[linkId]` descends to a child Questionnaire item.

```text
item[visit][0].item[diagnosis][1].code
```

This separation is the central design principle. Brackets select; dots navigate.
The parser is Questionnaire-aware and interprets every step against the
Questionnaire definition rather than inferring a JSON shape from punctuation.

## Grammar

```abnf
path          = item-step *( "." item-step ) *( "." component )
item-step     = "item[" encoded-link-id "]" [ occurrence ]
occurrence    = "[" index "]"
index         = "0" / ( %x31-39 *DIGIT )
component     = component-name
```

`component-name` is a supported property of the answer's FHIR datatype, such as
`system`, `code`, `display`, `value`, `unit`, `reference`, or
`identifier.system`. Implementations MUST validate it against the Questionnaire
item type and the supported datatype profile.

## Primitive answers

The field itself carries the primitive value:

```html
<input name="item[age]" value="42">
<input name="item[smoker]" value="false">
<input name="item[birthDate]" value="1990-05">
```

## Complex answers

Components follow the selected item:

```html
<input name="item[weight].value" value="83.5">
<input name="item[weight].unit" value="kg">
<input name="item[weight].system" value="http://unitsofmeasure.org">
<input name="item[weight].code" value="kg">
```

A `Coding` uses the same rule:

```html
<input name="item[diagnosis].system" value="http://snomed.info/sct">
<input name="item[diagnosis].code" value="44054006">
<input name="item[diagnosis].display" value="Diabetes mellitus type 2">
```

For `Coding`, `system + code` identify the concept. `display` is optional
representation and is not part of clinical identity.

## Repeating answers

An item declared with `repeats = true` uses a zero-based occurrence index:

```html
<input name="item[allergy][0]" value="peanuts">
<input name="item[allergy][1]" value="latex">
```

Complex repeated answers share the same index:

```html
<input name="item[diagnosis][0].system" value="http://snomed.info/sct">
<input name="item[diagnosis][0].code" value="44054006">
<input name="item[diagnosis][1].system" value="http://snomed.info/sct">
<input name="item[diagnosis][1].code" value="38341003">
```

All fields with the same item path and index belong to one answer occurrence.
Indexes MUST be contiguous, start at zero, and appear in document order.
An index is forbidden when the corresponding Questionnaire item cannot repeat.

## Repeating groups

The index after a repeating group selects the group occurrence. Child items are
written as explicit `.item[...]` steps:

```html
<input name="item[visit][0].item[date]" value="2026-08-05">
<input name="item[visit][0].item[note]" value="First visit">
<input name="item[visit][1].item[date]" value="2026-08-12">
<input name="item[visit][1].item[note]" value="Follow-up">
```

All QuestionnaireResponse ancestors are present in the canonical path, including
non-repeating groups:

```html
<input name="item[contact].item[email]" value="patient@example.org">
```

## Nested repetitions

Each repeating level has its own local index:

```text
item[visit][0].item[bp][0].item[systolic].value
item[visit][0].item[bp][0].item[diastolic].value
item[visit][0].item[bp][1].item[systolic].value
item[visit][1].item[bp][0].item[systolic].value
```

## Child items attached to answers

FHIR stores child items of a question under the selected answer. The same syntax
is used; the Questionnaire definition tells the parser that the child belongs to
`answer.item` rather than directly to `item.item`:

```text
item[mood].code
item[mood].item[why]
```

When the parent repeats, its occurrence makes the attachment explicit:

```text
item[symptom][0]
item[symptom][0].item[severity]
item[symptom][1]
item[symptom][1].item[severity]
```

## Nested datatype components

Component navigation may continue for supported nested structures:

```text
item[referrer].reference
item[referrer].display
item[referrer].identifier.system
item[referrer].identifier.value
```

An uploaded `Attachment` may use the item field for the file and component fields
for metadata:

```text
item[photo]
item[photo].title
item[photo].contentType
```

## Optional atomic Coding sugar

A non-repeating Coding MAY be submitted atomically:

```text
item[diagnosis]=system|code|display
```

This normalizes to `.system`, `.code`, and `.display` before validation. Literal
pipe and backslash characters are escaped as `\|` and `\\`. A request MUST NOT
mix the atomic form with component fields for the same answer occurrence.

The component representation remains canonical. Producers are not required to
implement the atomic sugar unless they advertise that capability.

## Encoding linkId

FHIR defines `linkId` as a `string`, so characters used by this grammar are legal
inside it. The contents of every `item[...]` selector therefore use UTF-8 percent
encoding. Only RFC 3986 unreserved characters may appear literally:

```text
FHIR linkId: diagnosis]primary
field path: item[diagnosis%5Dprimary].code
```

Form encoding subsequently encodes the percent sign on the HTTP wire. After the
normal HTML form decoder returns the field name, the path parser decodes each
`linkId` segment exactly once. It MUST reject malformed escapes and invalid UTF-8.

## Strict parsing

The parser MUST reject:

- unknown `linkId` values or structurally incorrect ancestry;
- indexes on non-repeating items;
- missing, negative, duplicated, or sparse repeat indexes;
- components not supported by the declared Questionnaire item type;
- scalar/component collisions for one answer occurrence;
- atomic Coding mixed with component Coding;
- duplicate scalar fields where `repeats = false`;
- malformed paths, percent escapes, or trailing data.

The parser MUST NOT apply the shape-merging behavior proposed by HTML JSON Forms.
The Questionnaire supplies the expected structure and cardinality.

## Legacy syntax

Earlier drafts used slash paths, `#` or `@` repeat markers, and colon components.
Those forms are obsolete and MUST NOT be emitted or accepted by conforming
implementations:

```text
item/visit#0/diagnosis@1:code
```

The canonical equivalent is:

```text
item[visit][0].item[diagnosis][1].code
```
