# FHIR Forms specification

The original single-file draft has been replaced by topical pages. Start with the
[specification overview](docs/index.md), which explains the motivation and gives
the authoritative reading order.

Core model and HTML contract:

- [Presentation layer](docs/concepts.md)
- [Components and shared kernel](docs/components.md)
- [Rendering Questionnaire items](docs/rendering.md)
- [Field names and Questionnaire paths](docs/field-names.md)
- [HTML form entry list](docs/entry-list.md)
- [FHIR type binding](docs/types.md)

Runtime and output:

- [Scaffold generator](docs/generator.md)
- [Collector and result validation](docs/parser.md)
- [Form linter](docs/linter.md)
- [Reactive runtime](docs/expressions.md)
- [Request and response exchange](docs/exchange.md)
- [Extraction](docs/extraction.md)
- [Conformance](docs/conformance.md)

Examples and design notes:

- [Blood pressure](docs/examples/blood-pressure.md)
- [PHQ-9](docs/examples/phq9.md)
- [Diagnosis](docs/examples/diagnosis.md)
- [Decision register](docs/decisions.md)
- [Open questions](docs/open-questions.md)
- [Prior art](prior-art.md)

This file remains only as a compatibility entry point for links to the former
draft. Normative content belongs in the topical pages.
