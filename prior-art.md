# Prior art

Several form traditions solve parts of the Questionnaire-to-HTML boundary. None
combines a public HTML entry contract with Questionnaire-aware FHIR typing.

## Nested field names

Rails, PHP, Spring, ASP.NET, OpenAPI `deepObject` and JavaScript `qs` encode
structure in names such as:

~~~text
user[address][city]
posts[0][title]
~~~

Rails nested attributes also model deletion, persistent row IDs and temporary
child indexes. These are useful patterns once a repeated row has identity beyond
one submission.

The abandoned W3C
[HTML JSON Form Submission](https://www.w3.org/TR/html-json-forms/) specified a
similar bracket grammar and merge rules for `application/json`. Browsers did not
implement it.

These systems parse shape but do not know clinical types. Schema-driven binding
is still required to distinguish, for example, an identifier string from a
number. Parsers also need depth limits and strict collision rules.

## Schema-generated forms

[react-jsonschema-form](https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/uiSchema/)
and JSON Forms separate a data schema from a UI schema. This enables reusable
rendering but makes bespoke presentation dependent on another model and its
renderer.

FHIR Forms instead keeps semantic definition in Questionnaire and uses HTML as
the presentation representation.

## XForms

XForms defined close equivalents of SDC behavior:

| XForms | Questionnaire/SDC |
|---|---|
| `relevant` | `enableWhenExpression` |
| `calculate` | `calculatedExpression` |
| `constraint` | constraints |
| `required` | `required` |
| `readonly` | `readOnly` |
| `ref` / `nodeset` | response paths |
| `submission` | exchange protocol |

Browsers did not adopt XForms. Orbeon demonstrates the viable alternative:
evaluate the model on the server and render ordinary HTML.

## FHIR renderers

[LHC-Forms](https://lhncbc.github.io/lforms/), CSIRO Smart Forms, Android FHIR
SDC and Formbox render Questionnaire and support behavior such as terminology,
units, scoring and FHIRPath.

Their HTML bindings are implementation details. They solve rendering, but do not
publish a framework-independent entry contract that hand-written HTML can target.

## Hypermedia runtimes

htmx preserves ordinary forms while adding fragment requests. Three patterns are
relevant:

- issue recompute from a wrapper so incomplete native validation does not block it;
- use `hx-sync="closest form:queue last"` for rapid changes;
- replace only affected fragments or out-of-band outputs.

Datastar represents state as client signals and evaluates rules from attributes.
This removes field-path parsing inside the client model, but makes that model and
JavaScript runtime part of the application contract. Its plain-form escape hatch
returns to ordinary name/value submission.

## Design lessons

| lesson | consequence |
|---|---|
| names may carry stable item identity | use Questionnaire `linkId`, not visual position |
| the definition must type answers | never infer FHIR types from submitted strings |
| repeat position is not domain identity | use explicit trusted identity when needed |
| parsers face hostile input | bound depth and reject ambiguous collisions |
| no-script operation is valuable | keep server rendering and native submission valid |
| client calculations are previews | server evaluation remains authoritative |
| contracts must be public | another renderer, test or agent must be able to implement them |

Security mechanisms such as authentication, authorization and CSRF protection
belong to the host HTTP protocol, not the field-path grammar.

## Sources

- [W3C HTML JSON Form Submission](https://www.w3.org/TR/html-json-forms/)
- [`qs`](https://github.com/ljharb/qs)
- [react-jsonschema-form UI schema](https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/uiSchema/)
- [Orbeon binds](https://doc.orbeon.com/xforms/core/binds)
- [LHC-Forms](https://lhncbc.github.io/lforms/)
- [htmx `hx-sync`](https://htmx.org/attributes/hx-sync/)
- [Datastar](https://data-star.dev)
- [HL7 Structured Data Capture](https://github.com/HL7/sdc)
- [HTML form control infrastructure](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html)

