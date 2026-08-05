export default function (ctx: Context, _session: Session | null, _opts?: {}) {
    const ui = ctx.fns.examples.ui;
    const body = ui.repeat({
        rows: [
            ui.coding({ path: "item[diagnosis][0]", legend: "Diagnosis 0", code: "44054006", display: "Diabetes mellitus type 2" }),
            ui.coding({ path: "item[diagnosis][1]", legend: "Diagnosis 1", code: "38341003", display: "Hypertensive disorder" }),
        ],
        template: ui.coding({ path: "item[diagnosis][__INDEX__]", legend: "Diagnosis __INDEX__", code: "", display: "" }),
        nextIndex: 2,
        label: "Add diagnosis",
    });
    return {
        id: "diagnosis", group: "Valid responses", title: "Repeated Coding", badge: "coding[]",
        description: "Component fields merge by occurrence into ordered valueCoding answers.",
        questionnaire: ui.questionnaire({ name: "diagnosis-list", item: [{ linkId: "diagnosis", type: "choice", repeats: true }] }),
        form: ui.form({ id: "diagnosis", body, hint: "item[diagnosis][n].component", shell: false }),
    };
}
