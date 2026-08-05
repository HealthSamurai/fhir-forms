# Conformance and corner cases

These edge cases are normative and must be covered by conformance fixtures.

## Corner cases

The ones that produce a wrong answer rather than an error, which is why they are
written down.

| case | the rule |
|---|---|
| **`0` is an answer, `""` is not** | an empty field contributes no `answer[]`; zero, `false` and an empty *chosen* option all do. Never test a value for truthiness |
| **An unchecked checkbox sends nothing** | so `boolean` is two radios, not a checkbox — otherwise "no" and "not answered" are the same request |
| **Repetition indexes are not contiguous** | deleting the middle row posts `bp#0`, `bp#2`. Indexes are *identity within one submission*, not positions: collect sorts and compacts them |
| **Nested repetition** | scopes stack: `visit#1/bp#0/sbp`. The index belongs to the nearest repeating ancestor |
| **`__drop` values containing a comma** | both halves are URI-encoded: `__drop=<name>,<encoded value>` |
| **Double submit** | the same form posted twice must not write two answers. Identity is the `id` field: absent → a new answer, present → an amend of that one |
| **`type=number` swallows what it cannot parse** | a browser submits the empty string for a number field whose content is not a number, so "typed nonsense" arrives looking exactly like "left blank". A field that must be answered is caught by `required`; anything else is genuinely indistinguishable, and the design says so rather than pretending |
| **`type=range` always submits** | a slider has no empty state — it posts its midpoint if nobody touched it. An optional question therefore cannot be a slider unless the definition gives it a "not answered" option of its own |
| **Enter submits the first submit button** | with more than one field, implicit submission picks the **first** submit button in tree order — so a row's `__drop` × must never come before the real Submit, or pressing Enter deletes a row |
| **A `<button>` with no `type` is a submit button** | which is what makes `__drop` work, and what makes any other button in a form fire a submission by accident |
| **`<fieldset disabled>` spares its first `<legend>`** | controls inside that legend stay enabled — which is exactly where a "this section applies" toggle belongs, and nowhere else. Nothing else can be re-enabled: `disabled` cascades absolutely into nested fieldsets |
| **A required question in a closed branch blocks the form** | unless the branch is `disabled` — a disabled control is barred from constraint validation, while `hidden` and CSS are not. This is the reason the branch is a disabled fieldset and not a hidden div |
| **A `<fieldset>` cannot wrap table rows** | so a repeating group rendered as a `gtable` (one row per repetition) cannot use the one-attribute trick: `<tr>` may not sit inside a `<fieldset>`, and each control in the row has to be disabled on its own. Choosing a table layout chooses this cost |
| **`<fieldset>` is awkward as a CSS container** | `min-width: min-content` by default and long-standing quirks as a flex or grid parent; the layout usually goes on a `<div>` inside it |
| **`<textarea>` values are normalised to CRLF** | a line break costs two characters on submission; `maxLength` counted in FHIR characters and `maxlength` counted in UTF-16 code units are also not the same number for emoji or CJK. The server's check is the one that decides |
| **A `linkId` that collides with a reserved name** | `__submit` and `__drop` are reserved; the resource's own elements cannot collide at all, because every answer lives behind `item/`, and so are the separators `#`, `@`, `/`, `:`. A questionnaire using one as a `linkId` is **refused at render time**, loudly — silently renaming a field would break the round trip |
| **A decimal typed with a comma** | `36,8` is accepted and read as `36.8`; a value that is not a number at all is an error on that field, never a `NaN` in the record |
| **Partial dates** | `1990` and `1990-05` are valid FHIR dates and no `<input type=date>` can express them. Such an item falls back to a text field with a pattern |
| **`dateTime` has no offset in the browser** | `datetime-local` yields `1990-05-01T09:00`. The server attaches its own offset when it stores it, so two people filling the same form in two places do not disagree by hours |
| **`display` items** | never carry an answer. A body that contains one is an unknown field |
| **`open-choice` "other"** | the free text is posted under the same `linkId` as the chosen codes and lands as `valueString` beside the `valueCoding`s |
| **A score is computed, never posted** | the progress bar over the form is derived from the answers on every recompute. A posted "score" field is an unknown field |
| **The patient never comes from the body** | subject is the URL segment the host already resolved. A form cannot answer on behalf of somebody else by adding a field |
| **Extraction runs once per answer** | resubmitting an amended answer updates the Observations it produced rather than adding a second set — the SDC rule (take no action · update · create) applies to the answer's own id |


## Field-path conformance

A conforming producer MUST emit the canonical `item[linkId][index].component`
grammar. A conforming parser MUST resolve paths against the Questionnaire and
reject unknown ancestry, invalid cardinality, sparse indexes, unsupported
components, malformed percent encoding, and scalar/component collisions. Support
for the atomic Coding `system|code|display` representation is optional and MUST be
advertised separately.
