export default function (ctx: Context, _session: Session | null, _opts?: {}) {
    const ui = ctx.fns.examples.ui;
    const styles = ui.styles({});
    const body = `<div class="${styles.formGrid}">
  ${ui.input({ label: "linkId contains ]", name: "item[diagnosis%5Dprimary]", value: "confirmed" })}
  ${ui.input({ label: "Unicode linkId", name: "item[%E7%97%87%E7%8A%B6]", value: "頭痛" })}
</div>`;
    return {
        id: "encoded", group: "Valid responses", title: "Encoded linkIds", badge: "%XX",
        description: "Reserved brackets and Unicode are percent-decoded exactly once.",
        questionnaire: ui.questionnaire({ name: "encoded-linkids", item: [
            { linkId: "diagnosis]primary", type: "string" }, { linkId: "症状", type: "string" },
        ] }),
        form: ui.form({ id: "encoded", body, hint: "UTF-8 percent-decoded once" }),
    };
}
