# Decision register

## Canonical HTML field-path grammar

The canonical grammar is `item[linkId][index].component`. A child Questionnaire
item is an explicit `.item[linkId]` step. Brackets select an item or occurrence;
dots navigate to child items and datatype components.

```text
item[visit][0].item[diagnosis][1].code
```

All QuestionnaireResponse ancestors appear in the path. An occurrence index is
zero-based and required exactly where the Questionnaire permits repetition.
`linkId` selector contents use UTF-8 percent encoding. The former slash paths,
`#`/`@` repeat markers, and colon components are removed rather than retained as
alternate canonical forms. See [Field names and Questionnaire paths](field-names.md).

## The decisions, numbered

Everything above rests on choices that could have gone the other way. They are
listed so an argument can be had about a number rather than about a feeling.
Status: **built** · **specified** (written here, not in the code) · **open**.

### Names

| # | decision | instead of | why | status |
|---|---|---|---|---|
| D1 | the field name **is** the `linkId` | a path of linkIds; positional indexes; opaque field ids | FHIR already requires `linkId` to be unique inside a questionnaire, so a path adds ceremony and a rename risk without adding information | built |
| D2 | a repetition scope is `bp#0/sbp` | `bp[0].sbp`, `bp.0.sbp`, a separate `__rows=3` counter | brackets and dots collide with real `linkId`s; a counter can disagree with the fields actually posted | specified |
| D3 | the suffix mirrors the datatype: a bare path only for a primitive, `:value`/`:unit`/`:code`/`:text`/`:reference` for the elements of a composite answer | a bare name everywhere (the unit as a sibling field); `:value` on everything | a `Quantity` has no single "the answer", so naming one half bare is a lie about the type; making `:value` mandatory taxes every simple field for a rarity | specified |
| D4 | control fields are `__`-prefixed and reserved | HTTP headers, query parameters, a second endpoint | a plain form must be able to express everything in its body, or "works without JavaScript" stops being true | built |
| D5 | `.` is never a separator | dotted paths | `1.1` is an ordinary `linkId` in LOINC panels | built |
| D6 | a `linkId` colliding with a reserved name is refused **at render time** | silently escaping or renaming it | a renamed field breaks the round trip somewhere far away from the cause | specified |

### What the body means

| # | decision | instead of | why | status |
|---|---|---|---|---|
| D7 | the definition is the authority; an unknown field is an **error** | ignoring what is not recognised | a typo that writes an empty answer is the bug this whole contract exists to prevent | built |
| D8 | `""` is no answer; `0` and `false` are answers | treating empty as an empty answer | otherwise `required` cannot be checked, and a zero reading disappears | built |
| D9 | a Coding choice is represented canonically by `:system`, `:code`, and optional `:display` | code alone; display text; option position | `system + code` is clinical identity; display is optional representation and position is unstable | specified |
| D9a | consumers also accept optional bare-field sugar `system|code|display` | making the sugar canonical | explicit components mirror FHIR and remain extensible; sugar lets one HTML control submit the Coding atomically. Mixed representations are an error | specified |
| D10 | `boolean` renders as two radios | a checkbox | an unchecked box sends nothing, so "no" and "not answered" would be the same request | built |
| D11 | a repeating **question** repeats the same field name | indexed names | `getAll` is what a browser already does with a checkbox group | built |
| D12 | `__drop=<name>,<value>` removes one value server-side | removing it in client JS; a DELETE endpoint | the form has no client state, and a delete that only happened in the DOM is lost on the next recompute | built |
| D13 | one declared unit is implicit; several units must be **chosen** | taking the first option; guessing from magnitude | the LOINC vitals panel offers F before Cel — the guess turns 36.8 °C into a fever of nothing | built |
| D14 | a range is compared in the unit it is stated in; nothing is converted | UCUM conversion | a wrong conversion is worse than a refusal, and the refusal names the unit | built |
| D15 | `36,8` is read as `36.8`; a non-number is an error on the field | rejecting the comma; `NaN` in the record | a keyboard, not a mistake | specified |
| D16 | the server attaches the offset to a `dateTime` | storing what the browser sent | `datetime-local` has no offset, so two sites disagree by hours | specified |
| D17 | partial dates (`1990`, `1990-05`) fall back to a text field | forcing a full date | they are valid FHIR and a date input cannot express them | specified |

### Building the response

| # | decision | instead of | why | status |
|---|---|---|---|---|
| D18 | the answer is built by walking the **definition** | building it from the body | the body knows names; only the definition knows types, nesting and what was asked | built |
| D19 | an item disabled by `enableWhen` has **no answer**, even on an amend | keeping the old answer | FHIR is explicit; a preserved answer to a question nobody was asked is a claim about the patient | built |
| D20 | a group is emitted even when nothing under it was answered | omitting empty groups | the response keeps the shape of the form, which is what makes the grid columns line up | built |
| D21 | `item.text` is copied onto the response | leaving it out (it is optional) | an answer read years later should say what was asked, not just which `linkId` | built |
| D22 | the score is computed on every render, never posted | a hidden score field | a posted number can disagree with the answers under it | built |
| D23 | the answer's own elements are ordinary fields (`questionnaire`, `subject`, `id`, `authored`, `status`), and hidden items are hidden inputs | one opaque `__qr` blob; keeping the draft server-side in a session | a blob is a second encoding inside the first, unwritable by hand; a server-side draft is state the form promised not to have | specified |
| D24 | `readOnly` and `hidden` items are rendered `disabled` (or as text) so the browser never submits them; a closed `enableWhen` branch is a `<fieldset disabled>` | rendering them `readonly` and ignoring what arrives | `readonly` still submits and `disabled` does not — using the attribute that matches the intent removes the trust question instead of answering it, and one attribute on a fieldset disables a whole branch | specified |
| D25 | the body **states** `subject.reference` and `id`; the server **verifies** them against the address and refuses a mismatch | taking them only from the URL and ignoring the body; trusting the body | silently ignoring hides tampering, trusting it lets a form answer for another patient — refusing does neither | specified |

### The exchange

| # | decision | instead of | why | status |
|---|---|---|---|---|
| D26 | one address; `__submit=1` distinguishes a submission from a recompute | `/validate` and `/submit`; a header | one address is one thing to write in a page, and a native submit reaches the same place | built |
| D27 | a recompute writes **nothing** | autosaving every change | a half-typed number is not an answer; drafts are a separate decision (Q2) | built |
| D28 | a successful submit answers with the grid plus `hx-location` | a 303 to the grid | the fragment is what htmx swaps; the location keeps the URL honest for a reload | built |
| D29 | both `application/x-www-form-urlencoded` and `multipart/form-data` parse | one of them | a file upload needs multipart, everything else does not | built |
| D30 | a new answer is `completed`, an existing one `amended`; nothing is replaced silently | overwriting in place | an amended answer is a clinical event, not an edit | built |
| D31 | a form that declares extraction goes through `$submit`, and extracting nothing is an **error** | a plain PUT, or a warning | "saved fine" with a chart that never moved is the failure this replaced | built |
| D32 | the Questionnaire is published to the box before `$submit` | assuming it is there | a file on disk is not a resource; the server answers `422 not-found`, which reads as "your answer is wrong" | built |
| D33 | identity comes from the address (`response=new` mints an id, `response=<id>` amends) | a nonce; a hash of the body | the address is already the state of the page, and a double submit therefore amends rather than duplicates | built |
| D34 | no client JS: the htmx path and the native-submit path produce the same result | a JS form runtime | it is testable server-side, and it works in a browser that blocks scripts | built |
| D35 | the server **transpiles** the form's expressions to plain JS and sends it **inline** with the form, under a nonce | shipping a FHIRPath engine to the browser; serving the code as a separate versioned file; evaluating only on the server (chatty) | an engine plus response-assembly is a large client for a small job; a separate file buys a cache nobody needed and a URL to invalidate. The ban on JS in templates is about hand-written code — generated code has the standing of the generated markup around it. The server still re-evaluates everything on collect, so a client rule can only wrongly *show* something, never wrongly *store* it | specified |
| D36 | the transpiler may refuse: what it cannot express keeps its server round trip | hand-writing the hard rules; refusing to transpile anything unless everything transpiles | a hand-written rule is a second implementation, which is where two evaluators drift apart | specified |
| D37 | the two evaluators are held together by a **test**, not by care: the same answers through the server and through the generated module must agree | reviewing the transpiler; trusting it | drift is silent by nature, and only an executable check notices it | specified |

### What the browser decides

| # | decision | instead of | why | status |
|---|---|---|---|---|
| D38 | a draft is a **second submit button** (`formaction=…&status=in-progress`, `formnovalidate`) | a hidden `status` field; a separate endpoint | the submitter is how HTML expresses "this click means something else", and `formnovalidate` is the only way an unfinished form can be posted at all | specified |
| D39 | cross-field rules are SDC **`targetConstraint`** — expression, human message, severity — evaluated after the answer is assembled | hard-coding them in whoever renders the form; leaving them to the server that stores it | a rule written in a page cannot travel with the form or be reviewed with it | specified |
| D40 | precision picks the control: year → number, year-month → `<input type=month>`, full → `date` | one date input and a text fallback for anything partial | partial dates are ordinary in histories, and the browser has a control for the commonest of them | specified |
| D41 | a branch closed by `enableWhen` is **not rendered at all** where it can be dropped, and `<fieldset disabled>` where it must stay visible (`disabledDisplay: protected`) | hiding it with CSS or the `hidden` attribute | only `disabled` removes it from both the body and constraint validation; a hidden-but-enabled `required` field makes the browser refuse to submit and point at nothing | specified |
