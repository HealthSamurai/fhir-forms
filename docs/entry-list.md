# HTML form entry list

An HTML form submission is an ordered list of `(name, value)` entries. It is not
an object: one name may occur more than once, order is observable, and an absent
control is different from a control whose value is the empty string.

The parser consumes that entry list together with the Questionnaire definition.
The definition supplies types, ancestry and cardinality; the body supplies only
paths and lexical values.

## Successful controls

The browser includes only successful controls in FormData:

- a disabled control is absent;
- an unchecked checkbox or radio is absent;
- a selected submit button contributes its own name and value;
- repeated names produce repeated entries in document order;
- a readonly control is included;
- a file input produces a `File` in a multipart submission;
- an enabled control with no value usually contributes `""`.

Renderers must use these rules rather than maintain a parallel client-side model
of the form. In particular, an item closed by `enableWhen` is disabled so it is
absent from both submission and browser constraint validation.

## Answer entries

Every answer entry uses the canonical path grammar:

```text
item[age]
item[weight].value
item[weight].unit
item[visit][0].item[diagnosis][1].code
```

The item path and occurrence index identify one answer. Component entries with
the same path are collected into one complex value before type validation.

Indexes are explicit for every repeating item. The parser does not infer an
occurrence from duplicate names and does not use object-key order as a substitute
for an index.

## Empty values

An empty string is no answer. `0`, `false`, and a zero-length uploaded file are
not empty strings and are handled by their declared types.

For a complex optional answer, ancillary components do not create an answer when
its primary component is empty. A selected unit without `Quantity.value`, or a
default Coding system without `Coding.code`, is omitted. A non-empty but invalid
primary value is an error rather than an empty answer.

A required item is checked after empty answers are removed. This keeps browser
defaults such as a unit select from satisfying `required` by themselves.

## Ordering and duplicates

Entry order is preserved while parsing, but the Questionnaire determines response
item order. Repeating occurrences are emitted in numeric index order.

A scalar field that occurs twice is an error. Two entries for different
components of one complex value are expected. Repeating answers use different
occurrence indexes rather than duplicate scalar fields.

Sparse, negative, malformed or repeated occurrence indexes are errors. A client
that removes a middle row must renumber the remaining DOM paths before submit.

## Non-answer controls

Application controls such as the submit action or selected example are outside
the Questionnaire path grammar. The host endpoint must consume them before it
passes the remaining entries to the parser. An unconsumed non-answer field is an
unknown path and is rejected.

This separation keeps the parser independent of HTTP endpoints, button names and
rendering libraries.
