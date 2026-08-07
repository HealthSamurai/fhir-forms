# HTML binding

An HTML form is a Questionnaire presentation when its successful controls use
canonical item paths and preserve Questionnaire structure and behavior. DOM
shape, CSS and widget composition are otherwise unrestricted.

## Entry model

Form submission is an ordered list of `(name, value)` entries, not an object.
Names may repeat, order is observable, and an absent control differs from an
empty string.

Successful-control rules apply directly:

- disabled and unchecked controls are absent;
- readonly controls are included;
- repeated names remain separate ordered entries;
- enabled empty controls usually contribute `""`;
- multipart file controls contribute `File` values.

Renderers use this browser model rather than a parallel client-side answer tree.

## Canonical paths

~~~text
item[visit][0].item[diagnosis][1].code
~~~

Brackets select Questionnaire items and repeat occurrences. Dots descend to
child items or FHIR datatype components. Every step is resolved against the
Questionnaire; punctuation never infers a JSON shape.

~~~abnf
path           = item-step *( "." item-step ) [ "." component-path ]
item-step      = "item[" encoded-link-id "]" [ occurrence ]
occurrence     = "[" index "]"
index          = "0" / ( %x31-39 *DIGIT )
component-path = component-name *( "." component-name )
~~~

Common forms:

| answer shape | names |
|---|---|
| primitive | `item[age]` |
| Quantity | `item[weight].value`, `.unit` |
| Coding | `item[diagnosis].system`, `.code`, `.display` |
| Reference | `item[referrer].reference`, `.display` |
| nested group | `item[contact].item[email]` |
| repeated item | `item[allergy][0]`, `item[allergy][1]` |

One visual widget may contain several named controls for one complex answer.
Components sharing an item path and occurrence are assembled before type
binding.

## Ancestry and repetition

Every Questionnaire ancestor appears in the path, including non-repeating
groups. Every repeating item or group has an explicit zero-based index:

~~~text
item[visit][0].item[date]
item[visit][0].item[diagnosis][0].code
item[visit][1].item[date]
~~~

Indexes start at zero, are contiguous and follow submission order. Each nested
repeat has its own local index. Indexes are forbidden for non-repeating items.

When Questionnaire structure places child items under an answer, path syntax is
unchanged:

~~~text
item[mood].code
item[mood].item[why]
~~~

The definition determines whether the response child is stored under
`item.item` or `answer.item`.

## LinkId encoding

Selector contents use UTF-8 percent encoding because FHIR `linkId` may contain
grammar characters. Only RFC 3986 unreserved characters appear literally:

~~~text
linkId: diagnosis]primary
path:   item[diagnosis%5Dprimary].code
~~~

After normal form decoding, each selector is decoded exactly once. Malformed
escapes and invalid UTF-8 are errors.

## Empty answers

An empty string is no answer. `0`, `false` and a zero-length uploaded file are
not empty strings and follow their declared type rules.

Ancillary defaults do not create an optional complex answer. A unit without
`Quantity.value`, or a Coding system without `.code`, is omitted. A non-empty but
invalid primary component is an issue. Required checks run after empty answers
are removed.

## Ordering and collisions

Questionnaire order determines response item order; repeat indexes determine
occurrence order. Duplicate non-repeating scalar entries, duplicate components,
sparse indexes and scalar/component collisions are errors.

Application controls such as submit modes and repeat commands are consumed by
the host before collection. Unconsumed non-answer fields are rejected.

## Optional Coding sugar

An advertised capability may accept one non-repeating Coding atomically:

~~~text
item[diagnosis]=system|code|display
~~~

Pipe and backslash are escaped as `\|` and `\\`. Atomic input is normalized to
components and cannot be mixed with component fields. Component form remains
canonical.

## Presentation markers

Optional markers help runtimes, linters and tests without creating another path
syntax:

| marker | meaning |
|---|---|
| `data-field` | canonical item path represented by a widget |
| `data-type` | Questionnaire item type |
| `data-required` | required while enabled |
| `data-repeat` | repeat-editing container |

The control `name`, not a marker, remains the submitted binding.

## Strict rejection

Collection rejects unknown items, invalid ancestry, malformed or misplaced
indexes, unsupported components, representation collisions, malformed escapes
and trailing path data. It never applies generic bracket-object merge rules.

FHIR value conversion is defined in [Type binding](type-binding.md); structural
editing and reactive state are defined in [Dynamic behavior](dynamic-behavior.md).

