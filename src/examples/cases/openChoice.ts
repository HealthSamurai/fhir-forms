export default function (ctx: Context, _session: Session | null, _opts?: {}) {
    const ui = ctx.fns.examples.ui;
    const body = `${ui.group({ legend: "Free text occurrence", body: ui.input({ label: "Text", name: "item[answer][0].text", value: "Something else" }) })}
${ui.coding({ path: "item[answer][1]", legend: "Coded occurrence", code: "LA6568-5", display: "Yes", system: "http://loinc.org" })}`;
    return {
        id: "openChoice", group: "Valid responses", title: "Open choice", badge: "open-choice",
        description: "Free text and Coding answers coexist as separate occurrences.",
        questionnaire: ui.questionnaire({ name: "open-choice", item: [{ linkId: "answer", type: "open-choice", repeats: true }] }),
        form: ui.form({ id: "openChoice", body, hint: "valueString beside valueCoding", shell: false }),
    };
}
