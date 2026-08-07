# Repetition and row editing

Questionnaire defines repetition. JavaScript or a server endpoint may edit rows,
but both must produce the same canonical entry list.

## Paths

A definition path identifies a repeat:

~~~text
item[diagnosis]
item[visit][0].item[diagnosis]
~~~

An answer path selects an occurrence:

~~~text
item[diagnosis][0].code
item[visit][0].item[diagnosis][1].code
~~~

A definition path is not a valid answer field when `repeats = true`.

## Invariants

- Each occurrence has one explicit zero-based index.
- Indexes are contiguous and follow submission order.
- Descendant names contain the complete repeated ancestry.
- Removing a row removes all successful controls in that occurrence.
- Remaining rows are compacted before final collection.
- An empty optional occurrence produces no response item.
- Editing and recompute actions do not persist a response.
- Final cardinality and paths are validated on the server.

Indexes are presentation positions, not persistent identifiers.

## Client templates

Local JavaScript may clone a trusted template whose only unresolved values are
occurrence tokens:

~~~html
<div data-repeat data-repeat-prefix="item[diagnosis]">
  <div data-repeat-rows>
    <fieldset data-repeat-row data-repeat-index="0">
      <input name="item[diagnosis][0].system" type="hidden" value="http://snomed.info/sct">
      <input name="item[diagnosis][0].code">
    </fieldset>
  </div>

  <template data-repeat-template>
    <fieldset data-repeat-row data-repeat-index="__INDEX__">
      <input name="item[diagnosis][__INDEX__].system" type="hidden" value="http://snomed.info/sct">
      <input name="item[diagnosis][__INDEX__].code">
    </fieldset>
  </template>

  <button type="button" data-repeat-add>Add diagnosis</button>
</div>
~~~

The enhancement:

1. clones the trusted template and replaces its explicit index token;
2. removes complete occurrence containers;
3. compacts indexes in `name`, labels, IDs, ARIA references and nested prefixes;
4. never constructs a client-side QuestionnaireResponse.

LinkIds, types, systems and units come from the trusted template or shared path
builder, never from visible labels.

Nested repeats use distinct tokens:

~~~text
item[visit][__VISIT__].item[diagnosis][__DIAGNOSIS__].code
~~~

Compacting an outer repeat also updates concrete parent prefixes held by inner
repeat containers.

## Server editing with htmx

The same operation may be a normal non-writing form request enhanced by htmx:

~~~html
<button type="submit"
        name="__repeat.add"
        value="item[diagnosis]"
        formnovalidate
        formaction="/forms/intake/repeat"
        hx-post="/forms/intake/repeat"
        hx-include="closest form"
        hx-target="closest [data-repeat]"
        hx-swap="outerHTML">
  Add diagnosis
</button>
~~~

Removal uses an occurrence path:

~~~text
__repeat.remove = item[visit][0].item[diagnosis][1]
~~~

The host consumes `__repeat.*` before collection. The endpoint:

1. reads the ordered entries, retaining empty strings;
2. resolves and authorizes the command path against the Questionnaire;
3. adds or removes the requested occurrence;
4. compacts affected indexes and descendant paths;
5. evaluates affected dynamic rules;
6. writes nothing and renders the fragment or full form.

`formnovalidate` permits row editing while final required answers are incomplete.
Final submit still performs native and server validation.

## Strategy choice

| concern | local JavaScript | server/htmx |
|---|---|---|
| latency | immediate | request round trip |
| source of rows | trusted template | server renderer |
| no-script behavior | needs fallback | native action |
| complex rules | attach runtime | evaluate directly |
| final authority | Collector | Collector |

Strategies may be mixed. They must preserve identical names and response order.

## Ordering and identity

Moving rows changes answer order. If a row has durable domain identity, represent
it as a trusted child answer or host-managed identifier. An occurrence index is
never that identity.

Conformance scenarios cover add, remove, reorder, compaction, empty rows, nested
scopes and dynamic branches. Live examples: [diagnoses](/examples/diagnosis),
[nested visits](/examples/visits), [server orders](/examples/order-composer).

