# Extraction

This layer is independent of the HTML wire contract and may be implemented by different host adapters.

## Which extraction mechanism

| the answer becomes | use | how it is said in the form |
|---|---|---|
| Observations — a measurement, a score, a screening result | **observation-based** | `item.code` on the question (and the panel code on the group), `observationExtract: true`, inherited from the root |
| a Condition, an AllergyIntolerance, a MedicationStatement — any other resource | **definition-based** | `definition` on the group (which resource) and on each question (which element) |
| something with fixed content around the answers | **template-based** | a template resource in the form with placeholders |
| anything the above cannot say | **StructureMap-based** | a map; the heaviest, and the last resort |

A form may use more than one: a visit form can extract its vitals as Observations
and its diagnoses as Conditions in the same submission.

---

