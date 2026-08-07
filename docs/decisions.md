# Decision register

| decision | rationale |
|---|---|
| HTML is the presentation representation | avoids a second proprietary UI schema |
| Conformance is behavioral | bespoke and generated forms have equal standing |
| Paths use `item[linkId][index].component` | separates item selection, occurrence and datatype navigation |
| Collector consumes ordered entries | preserves duplicates, order and files |
| Questionnaire types submitted values | prevents body-driven type guessing |
| Server collection is strict | malformed, unknown and conflicting input cannot disappear silently |
| Components share one binding kernel | linter, runtime and Collector cannot disagree on semantics |
| Static linting is supplemented by scenarios | arbitrary dynamic behavior cannot be proven from one DOM snapshot |
| Reactive execution is selected per rule | simple rules stay local; unsupported rules fall back to the server |
| Repeat editing may be local or server-rendered | both strategies preserve the same indexed entry list |
| Renderer is optional | the contract also supports hand-written HTML |
| Generated HTML becomes project-owned | regeneration cannot overwrite bespoke work implicitly |

Open design work is tracked in [Open questions](open-questions.md).

