# fhir-forms

FHIR Forms lets teams build intentionally designed HTML interfaces while keeping
FHIR Questionnaire as the semantic source of truth. A bespoke page, generic
renderer, test, agent, or another UI can post the same public field contract and
produce the same typed QuestionnaireResponse.

- [Specification overview](docs/index.md)
- [HTML binding](docs/html-binding.md)
- [FHIR type binding](docs/type-binding.md)
- [Dynamic behavior](docs/dynamic-behavior.md)
- [Collector and validation](docs/collector.md)
- [Generator and linter](docs/tooling.md)
- [Server lifecycle](docs/server-lifecycle.md)
- [Conformance](docs/conformance.md)
- [Design notes](docs/design-notes.md)
- [Prior art](prior-art.md)

The implementation includes the strict Collector slice and a server-rendered
examples UI. Renderer, linter, extraction adapters, and the complete reactive
runtime are broader specification components and should not be assumed complete
without corresponding code and tests.
