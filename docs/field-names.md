# Field names and Questionnaire paths

HTML control names address Questionnaire items, repeat occurrences and FHIR
datatype components:

~~~text
item[visit][0].item[diagnosis][1].code
~~~

Brackets select items and occurrences. Dots navigate to child items or datatype
components. The parser resolves every step against the Questionnaire; it does
not infer a JSON shape from punctuation.

## Grammar

~~~abnf
path          = item-step *( "." item-step ) [ "." component-path ]
item-step     = "item[" encoded-link-id "]" [ occurrence ]
occurrence    = "[" index "]"
index         = "0" / ( %x31-39 *DIGIT )
component-path = component-name *( "." component-name )
~~~

Components are validated against the Questionnaire item type. Supported examples
include `value`, `unit`, `system`, `code`, `display`, `reference`,
`identifier.system` and `identifier.value`.

## Common forms

| answer shape | canonical names |
|---|---|
| primitive | `item[age]` |
| Quantity | `item[weight].value`, `item[weight].unit` |
| Coding | `item[diagnosis].system`, `.code`, `.display` |
| Reference | `item[referrer].reference`, `.display` |
| nested group | `item[contact].item[email]` |
| repeated primitive | `item[allergy][0]`, `item[allergy][1]` |
| repeated Coding | `item[diagnosis][0].system`, `.code` |

All components of one complex answer use the same item path and occurrence.
`Coding.system + Coding.code` establish clinical identity; display does not.

## Repetition and ancestry

Every repeating item or group has an explicit zero-based index. Indexes start at
zero, are contiguous and follow document order:

~~~text
item[visit][0].item[date]
item[visit][0].item[diagnosis][0].code
item[visit][0].item[diagnosis][1].code
item[visit][1].item[date]
~~~

Each repeat level has its own local index. An index is forbidden when the
Questionnaire item cannot repeat. Non-repeating groups remain explicit in every
descendant path.

## Children of answers

FHIR may place child items under a selected answer. The path syntax is unchanged;
the Questionnaire tells the Collector whether the child belongs to `item.item`
or `answer.item`:

~~~text
item[mood].code
item[mood].item[why]
item[symptom][0].item[severity]
~~~

## LinkId encoding

FHIR `linkId` is a string and may contain grammar characters. Selector contents
therefore use UTF-8 percent encoding. Only RFC 3986 unreserved characters appear
literally:

~~~text
linkId: diagnosis]primary
path:   item[diagnosis%5Dprimary].code
~~~

After normal form decoding, the path parser decodes each selector exactly once.
Malformed escapes and invalid UTF-8 are errors.

## Optional atomic Coding

A producer advertising this capability may submit one non-repeating Coding as:

~~~text
item[diagnosis]=system|code|display
~~~

Pipe and backslash are escaped as `\|` and `\\`. The Collector normalizes this
to components before validation. Atomic and component forms must not be mixed for
one occurrence. Component fields remain canonical.

## Rejection rules

The Collector rejects:

- unknown items or invalid ancestry;
- required, forbidden, malformed, duplicate or sparse indexes;
- components unsupported by the item type;
- scalar/component or atomic/component collisions;
- duplicate non-repeating scalar entries;
- malformed escapes and trailing path data.

Obsolete slash, `#`, `@` and colon forms are not accepted. Repeat editing is
defined in [Repetition and row editing](repeats.md); lexical binding is defined in
[FHIR type binding](types.md).

