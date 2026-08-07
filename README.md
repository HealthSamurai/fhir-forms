# fhir-forms

FHIR Forms lets teams build intentionally designed HTML interfaces while keeping
FHIR Questionnaire as the semantic source of truth. A bespoke page, generic
renderer, test, agent, or another UI can post the same public field contract and
produce the same typed QuestionnaireResponse.

- [Specification overview](docs/index.md)
- [Presentation-layer model](docs/concepts.md)
- [Field-path grammar](docs/field-names.md)
- [HTML entry-list semantics](docs/entry-list.md)
- [FHIR type binding](docs/types.md)
- [Scaffold generator](docs/generator.md)
- [Collector and validation](docs/parser.md)
- [Form linter](docs/linter.md)
- [Enablement and calculated fields](docs/expressions.md)
- [Conformance](docs/conformance.md)
- [Worked examples](docs/examples/blood-pressure.md)
- [Prior art](prior-art.md)

The implementation includes the strict Collector slice and a server-rendered
examples UI. Renderer, linter, extraction adapters, and the complete reactive
runtime are broader specification components and should not be assumed complete
without corresponding code and tests.
