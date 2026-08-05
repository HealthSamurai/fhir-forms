export default function (ctx: Context, _session: Session | null, _opts?: {}) {
    const ui = ctx.fns.examples.ui;
    const styles = ui.styles({});
    const answer0 = `<div class="${styles.repeatGrid}">
  ${ui.input({ label: "Symptom", name: "item[symptom][0]", value: "headache" })}
  ${ui.input({ label: "Severity child", name: "item[symptom][0].item[severity]", value: "moderate" })}
</div>`;
    const answer1 = `<div class="${styles.repeatGrid}">
  ${ui.input({ label: "Symptom", name: "item[symptom][1]", value: "nausea" })}
  ${ui.input({ label: "Severity child", name: "item[symptom][1].item[severity]", value: "mild" })}
</div>`;
    const body = `${ui.group({ legend: "Answer 0", body: answer0 })}\n${ui.group({ legend: "Answer 1", body: answer1 })}`;
    return {
        id: "symptoms", group: "Valid responses", title: "Child under answer", badge: "answer.item",
        description: "Each repeated answer owns an independent child response item.",
        questionnaire: ui.questionnaire({ name: "answer-children", item: [{
            linkId: "symptom", type: "string", repeats: true, item: [{ linkId: "severity", type: "string" }],
        }] }),
        form: ui.form({ id: "symptoms", body, hint: "answer occurrence owns child items", shell: false }),
    };
}
