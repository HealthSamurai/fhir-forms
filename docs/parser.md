# QuestionnaireResponse form parser

This document defines the conversion of an ordered HTML form entry list into a
FHIR `QuestionnaireResponse` using a known `Questionnaire`.

The parser is definition-driven. Field names address Questionnaire items, but do
not independently define a JSON shape. The Questionnaire determines hierarchy,
repetition, answer types, cardinality, and the placement of child items.

## Contract

```text
parse(entries, questionnaire, context)
  -> QuestionnaireResponse | ParseIssue[]
```

Inputs:

- `entries`: ordered successful HTML form controls after the normal form decoder;
- `questionnaire`: the exact Questionnaire version used to render the form;
- `context`: trusted envelope values such as status, subject, encounter, author,
  authored time, and Questionnaire canonical URL.

The parser returns either one complete QuestionnaireResponse snapshot or a list
of errors. It MUST NOT return a partially accepted response.

## Scope

The parser constructs `QuestionnaireResponse.item` and `answer.value[x]` from
controls rooted at `item[...]`.

These values are not answer paths and come from trusted context or a separate
envelope parser:

- `QuestionnaireResponse.id` and `meta`;
- `status` and `questionnaire`;
- `subject`, `encounter`, and `author`;
- `authored`;
- workflow commands, CSRF tokens, and submit-button actions.

An application MUST separate registered envelope controls from answer controls
before invoking the parser. An unregistered control is an error, not an ignored
value.

## Path model

The canonical syntax is defined in
[Field names and Questionnaire paths](field-names.md):

```text
item[visit][0].item[diagnosis][1].code
```

It produces these tokens:

```text
Item(linkId = "visit", occurrence = 0)
Item(linkId = "diagnosis", occurrence = 1)
Component("code")
```

- `item[linkId]` selects a Questionnaire item.
- `[index]` selects an occurrence.
- `.item[linkId]` descends to a direct child item.
- `.component` selects part of the answer datatype.

## Processing pipeline

Parsing has nine ordered phases:

1. Preserve the decoded HTML entry list.
2. Separate envelope controls from answer controls.
3. Tokenize paths and decode each `linkId` selector.
4. Resolve every item step against the Questionnaire hierarchy.
5. Validate and group item and answer occurrences.
6. Normalize optional atomic value sugar.
7. Parse raw values using the Questionnaire item type.
8. Validate Questionnaire rules and datatype invariants.
9. Materialize QuestionnaireResponse in deterministic order.

No phase may repair or guess an ambiguous request.

## 1. Preserve the HTML entry list

HTML form data is an ordered list of `(name, value)` entries, not a map. The HTTP
adapter MUST preserve:

- duplicate names;
- field order;
- whether a value is text or a file;
- multipart file metadata.

Converting the request to a map before parsing is non-conforming because it can
silently discard duplicate values.

The normal HTML form decoder runs before this parser. An encoded `linkId` remains
encoded at the inner path layer:

```text
HTML name:       item[diagnosis%5Dprimary].code
HTTP wire name: item%5Bdiagnosis%255Dprimary%5D.code
decoded name:   item[diagnosis%5Dprimary].code
decoded linkId: diagnosis]primary
```

## 2. Tokenize paths

Tokenization is syntactic and does not inspect submitted values.

The tokenizer MUST:

- require the `item[...]` root;
- recognize only item, index, and component tokens;
- reject empty selectors or components;
- reject negative, signed, decimal, or non-canonical indexes;
- reject trailing punctuation and unconsumed characters;
- percent-decode each selector exactly once as UTF-8;
- reject malformed escapes, invalid UTF-8, and an empty decoded `linkId`.

It MUST NOT accept the obsolete slash, `#`, `@`, or colon syntax.

## 3. Resolve against Questionnaire

Resolution starts among the Questionnaire root items. Every following
`.item[linkId]` MUST resolve to a direct child of the current Questionnaire item.

Global `linkId` uniqueness does not permit skipped ancestors. Given the
Questionnaire hierarchy `contact -> email`, only this path is canonical:

```text
item[contact].item[email]
```

The shorter `item[email]` is invalid even if `email` is globally unique.

Resolution validates that:

- every item exists under the specified parent;
- no component occurs before the final item step;
- the component is supported by the item's answer type;
- group and display items do not receive answer values;
- the submitted hierarchy matches the Questionnaire hierarchy.

Implementations SHOULD index items by parent and `linkId` once per Questionnaire
version.

## 4. Interpret occurrences

The Questionnaire determines what `[index]` means:

- on a repeating group, it selects a QuestionnaireResponse group occurrence;
- on a repeating question, it selects an entry in that item's `answer[]`;
- on a non-repeating item, an index is forbidden.

Indexes are local to their containing occurrence:

```text
item[visit][0].item[diagnosis][0].code
```

The two zeroes address different repeat scopes.

Within each repeat scope, indexes MUST:

- start at zero;
- be contiguous;
- appear in ascending first-seen order;
- identify one logical occurrence.

Component fields reuse the same index to assemble one complex answer. For
example, `.system`, `.code`, and `.display` at index `1` belong to one Coding.

Indexes are request-local positions, not persistent identifiers. Update and row
identity protocols MUST carry stable identity separately.

## 5. Build an intermediate tree

The parser builds a draft before producing FHIR JSON:

```text
ItemDraft
  definition: Questionnaire.item
  groupOccurrences: GroupDraft[]
  answers: AnswerDraft[]

GroupDraft
  index: integer
  children: ItemDraft[]

AnswerDraft
  index: integer
  atomicValue: TextValue | FileValue | absent
  components: Map<ComponentPath, TextValue>
  children: ItemDraft[]
```

The runtime key is the complete item ancestry plus local occurrence indexes. A
bare `linkId` is never sufficient as a draft key.

```text
item[visit][2].item[diagnosis][1].display
```

addresses `display` in diagnosis answer `1` inside visit group `2`.

## 6. Collect values

A primitive answer uses the item path itself:

```text
item[age]=42
```

A complex answer uses components:

```text
item[diagnosis].system=http://snomed.info/sct
item[diagnosis].code=44054006
item[diagnosis].display=Diabetes mellitus type 2
```

The optional atomic Coding form:

```text
item[diagnosis]=system|code|display
```

is expanded into `.system`, `.code`, and `.display` before type validation. The
parser MUST reject atomic and component forms for the same answer occurrence.

Two entries with the same complete canonical path are an error unless a specific
multipart extension explicitly defines otherwise. Repeated answers use indexes,
not duplicate names.

## 7. Parse typed answers

The Questionnaire item type selects the value parser. Field names do not choose a
FHIR `value[x]` type by themselves.

| Questionnaire type | Accepted field shape | Response value |
|---|---|---|
| `boolean` | bare `true` or `false` | `valueBoolean` |
| `decimal` | bare strict decimal | `valueDecimal` |
| `integer` | bare strict integer | `valueInteger` |
| `date` | bare FHIR date | `valueDate` |
| `dateTime` | bare FHIR dateTime | `valueDateTime` |
| `time` | bare FHIR time | `valueTime` |
| `string`, `text` | bare text | `valueString` |
| `url` | bare URI | `valueUri` |
| `choice`, `coding` | Coding components or atomic Coding | `valueCoding` |
| `open-choice` | bare text or Coding components | `valueString` or `valueCoding` |
| `quantity` | Quantity components | `valueQuantity` |
| `reference` | Reference components | `valueReference` |
| `attachment` | file or Attachment components | `valueAttachment` |

FHIR-version differences in item type names belong in a version-specific type
table. They MUST NOT be handled by relaxing path parsing.

### Lexical values

Boolean, integer, decimal, date, dateTime, and time MUST use their FHIR lexical
forms. Locale-specific input such as `1,25` or `08/05/2026` must be normalized by
the UI before submission or rejected.

The parser MUST NOT silently:

- round numbers or convert units;
- infer a time zone;
- treat an unknown boolean token as false;
- replace an invalid date with a partial date;
- infer a Coding system unless the Questionnaire fixes it unambiguously.

### Coding

Supported components are:

```text
.system
.version
.code
.display
.userSelected
```

`.code` is required. `.system` is required unless the Questionnaire or selected
answer option supplies exactly one fixed system. `.display` is optional and is
not part of clinical identity.

### Quantity

Supported components are:

```text
.value
.comparator
.unit
.system
.code
```

If any Quantity component is present, `.value` is required. Unit normalization
and conversion are separate clinical operations.

### Reference

Accepted fields follow the configured Reference profile:

```text
item[referrer].reference
item[referrer].type
item[referrer].identifier.system
item[referrer].identifier.value
item[referrer].display
```

Reference target restrictions declared by the Questionnaire or implementation
profile MUST be validated.

### Attachment

A file entry at the item path creates an Attachment draft. Registered metadata
components may supply values such as `.title` or `.creation`. The server, not the
browser, determines trusted byte length, digest, and effective media type.

Upload size and media-type policy MUST be enforced before creating the response.

## Empty, absent, and false

These states are distinct:

- no successful control means no submitted answer;
- `false` is a present boolean answer;
- an empty textual control is normalized to no answer;
- all-empty complex components produce no answer;
- a partly populated complex answer is valid or produces an error;
- omission in this snapshot parser is not a delete instruction.

The parser MUST NOT infer `false` from an absent checkbox. Renderers must submit
explicit `true` or `false`. Hidden fallback and checkbox values must be
canonicalized before parsing so that they do not create duplicate paths.

## 8. Validate Questionnaire rules

After type parsing, validate the complete draft:

- required applicable items have answers;
- non-repeating items have at most one occurrence;
- repeating items meet configured minimum and maximum constraints;
- answers conform to answer options, value sets, and answer constraints;
- disabled items do not carry submitted answers;
- read-only or calculated answers comply with server policy;
- children occur under the correct group or answer occurrence;
- group items contain children rather than answers;
- display items do not contain response answers;
- expression-based Questionnaire invariants hold.

Terminology and expression validation may run as separate stages, but the server
must not accept a response as valid until all required stages succeed.

## 9. Materialize QuestionnaireResponse

Output ordering is deterministic:

- siblings follow Questionnaire definition order;
- repeated groups follow occurrence index;
- repeated answers follow occurrence index;
- FHIR properties follow the normal serializer.

Mapping rules:

- a non-repeating group creates one response item containing `item[]`;
- a repeating group creates repeated sibling response items with the same
  `linkId`;
- a question creates one response item;
- question occurrences create entries in that item's `answer[]`;
- group children become `item.item[]`;
- question children become `item.answer[n].item[]`.

Empty structural items SHOULD be omitted unless a profile requires them.

## End-to-end example

Input entries:

```text
item[visit][0].item[date] = 2026-08-05
item[visit][0].item[diagnosis][0].system = http://snomed.info/sct
item[visit][0].item[diagnosis][0].code = 44054006
item[visit][0].item[diagnosis][0].display = Diabetes mellitus type 2
item[visit][0].item[diagnosis][1].system = http://snomed.info/sct
item[visit][0].item[diagnosis][1].code = 38341003
item[visit][1].item[date] = 2026-08-12
```

Result:

```json
{
  "resourceType": "QuestionnaireResponse",
  "status": "completed",
  "questionnaire": "Questionnaire/clinical-visit",
  "item": [
    {
      "linkId": "visit",
      "item": [
        {
          "linkId": "date",
          "answer": [{ "valueDate": "2026-08-05" }]
        },
        {
          "linkId": "diagnosis",
          "answer": [
            {
              "valueCoding": {
                "system": "http://snomed.info/sct",
                "code": "44054006",
                "display": "Diabetes mellitus type 2"
              }
            },
            {
              "valueCoding": {
                "system": "http://snomed.info/sct",
                "code": "38341003"
              }
            }
          ]
        }
      ]
    },
    {
      "linkId": "visit",
      "item": [
        {
          "linkId": "date",
          "answer": [{ "valueDate": "2026-08-12" }]
        }
      ]
    }
  ]
}
```

Envelope fields in this example come from trusted context, not item controls.

## Children attached to answers

Input:

```text
item[symptom][0] = headache
item[symptom][0].item[severity] = moderate
item[symptom][1] = nausea
item[symptom][1].item[severity] = mild
```

The children are placed under their corresponding answers:

```json
{
  "linkId": "symptom",
  "answer": [
    {
      "valueString": "headache",
      "item": [
        {
          "linkId": "severity",
          "answer": [{ "valueString": "moderate" }]
        }
      ]
    },
    {
      "valueString": "nausea",
      "item": [
        {
          "linkId": "severity",
          "answer": [{ "valueString": "mild" }]
        }
      ]
    }
  ]
}
```

## Errors

Errors are structured and field-addressable:

```json
{
  "code": "value.invalid-lexical-form",
  "path": "item[weight].value",
  "linkId": "weight",
  "occurrences": [],
  "message": "Expected a FHIR decimal"
}
```

Recommended stable codes:

```text
path.invalid-syntax
path.invalid-escape
path.unknown-item
path.wrong-parent
path.unknown-component
cardinality.index-required
cardinality.index-forbidden
cardinality.sparse-index
cardinality.duplicate-field
value.empty-required
value.invalid-lexical-form
value.incomplete-complex-type
value.conflicting-representations
value.answer-not-allowed
security.file-too-large
security.media-type-not-allowed
```

Messages MUST NOT echo uploaded content or sensitive raw answers. A FHIR endpoint
may map issues to `OperationOutcome.issue`, retaining the canonical form path in
an expression or implementation extension.

## Security limits

Before allocating the full draft, enforce configured limits for:

- number of entries;
- field-name and value length;
- Questionnaire nesting depth;
- occurrences per repeating item;
- total decoded text bytes;
- individual and total upload bytes;
- component nesting depth.

Field names are data. They must never be evaluated as source code, object paths,
filesystem paths, database expressions, or templates. Dynamic-object
implementations MUST prevent prototype and property injection.

## Determinism

Given the same ordered entries, Questionnaire version, parser profile, and trusted
context, the parser MUST produce the same response or semantic errors.

The result cannot depend on:

- map iteration order;
- server locale or timezone;
- framework-specific bracket parsing;
- silent duplicate-field coalescing;
- Coding display text when system and code are present.

## Pseudocode

```text
function parse(entries, questionnaire, context):
  definitions = indexQuestionnaire(questionnaire)
  draft = new ResponseDraft(context)
  issues = []

  for entry in entries:
    tokens = tokenize(entry.name)
    if tokens.error:
      issues.add(tokens.error)
      continue

    resolved = resolve(tokens, definitions)
    if resolved.error:
      issues.add(resolved.error)
      continue

    slot = draft.locate(resolved.itemChain, resolved.occurrences)
    issues.addAll(slot.collect(resolved.componentPath, entry.value))

  issues.addAll(validateIndexes(draft))
  issues.addAll(expandAtomicSugar(draft))
  issues.addAll(parseTypedValues(draft, questionnaire))
  issues.addAll(validateQuestionnaire(draft, questionnaire))

  if issues.anyError:
    return issues.sortedByCanonicalPath()

  return materializeQuestionnaireResponse(draft, questionnaire, context)
```

Tokenization, resolution, collection, type parsing, validation, and
materialization remain separate so syntax errors cannot be confused with
clinical validation errors.
