export default function (ctx: Context, _session: Session | null, _opts?: {}) {
    const ui = ctx.fns.examples.ui;
    const diagnosis = (visitIndex: string, diagnosisIndex: string, code: string, display: string) => ui.coding({
        path: `item[visit][${visitIndex}].item[diagnosis][${diagnosisIndex}]`,
        legend: `Diagnosis ${diagnosisIndex}`,
        code,
        display,
        nested: true,
    });
    const visit = (index: string, date: string, diagnoses: Array<{ code: string; display: string }>) => ui.group({
        legend: `Visit ${index}`,
        body: `${ui.input({ label: "Date", name: `item[visit][${index}].item[date]`, value: date, type: "date" })}
${ui.repeat({
            rows: diagnoses.map((entry, diagnosisIndex) => diagnosis(index, String(diagnosisIndex), entry.code, entry.display)),
            template: diagnosis(index, "__DIAGNOSIS_INDEX__", "", ""),
            nextIndex: diagnoses.length,
            label: "Add diagnosis",
            token: "__DIAGNOSIS_INDEX__",
        })}`,
    });
    const body = ui.repeat({
        rows: [
            visit("0", "2026-08-05", [
                { code: "44054006", display: "Diabetes mellitus type 2" },
                { code: "38341003", display: "Hypertensive disorder" },
            ]),
            visit("1", "2026-08-12", [{ code: "195967001", display: "Asthma" }]),
        ],
        template: visit("__VISIT_INDEX__", "", [{ code: "", display: "" }]),
        nextIndex: 2,
        label: "Add visit",
        token: "__VISIT_INDEX__",
    });
    return {
        id: "visits", group: "Valid responses", title: "Nested repetitions", badge: "group[]",
        description: "Repeated diagnoses remain scoped to their repeated parent visit.",
        questionnaire: ui.questionnaire({ name: "nested-visits", item: [{
            linkId: "visit", type: "group", repeats: true, item: [
                { linkId: "date", type: "date", required: true },
                { linkId: "diagnosis", type: "choice", repeats: true },
            ],
        }] }),
        form: ui.form({ id: "visits", body, hint: "client-added visits + independently repeated diagnoses", shell: false }),
    };
}
