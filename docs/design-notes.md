# Design notes

## Decisions

| decision | rationale |
|---|---|
| HTML is the presentation representation | avoids a second proprietary UI schema |
| Conformance is behavioral | bespoke and generated forms have equal standing |
| Paths use `item[linkId][index].component` | separates item, occurrence and datatype navigation |
| Collector consumes ordered entries | preserves duplicates, order and files |
| Questionnaire types submitted values | prevents body-driven type guessing |
| Server collection is strict | malformed and conflicting input cannot disappear silently |
| Components share one binding kernel | tools cannot disagree on semantics |
| Static linting uses runtime scenarios | dynamic behavior cannot be proven from one DOM snapshot |
| Reactive execution is selected per rule | unsupported rules fall back to the server |
| Repeat editing may be local or server-rendered | both preserve the same indexed entry list |
| Renderer is optional | hand-written HTML has equal standing |
| Generated HTML becomes project-owned | regeneration cannot overwrite bespoke work implicitly |

## Open questions

- **Form coverage:** how does a partial form declare intentionally omitted items
  without another form-definition model?
- **Prompt equivalence:** which changes to labels and help text can be linted, and
  which require clinical review?
- **Dynamic proof:** what is the smallest useful Questionnaire-derived scenario set?
- **Expression subset:** which FHIRPath/CQL rules may compile to JavaScript?
- **Repeat scope:** how are cross-occurrence expressions represented and proven?
- **Version binding:** how are HTML, generated code and evidence bound to one
  Questionnaire canonical and version?
- **Publication evidence:** should a published form carry signed evidence or rely
  on CI scenarios?
- **Draft editing:** how are partial answers preserved across server recomputes
  without making browser state authoritative?

