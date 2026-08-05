export default function (ctx: Context, _session: Session | null, _opts?: {}) {
    const ui = ctx.fns.examples.ui;
    const styles = ui.styles({});
    const body = `<div class="${styles.formGrid}">
  ${ui.input({ label: "Non-canonical index", name: "item[tag][01]", value: "alpha" })}
  ${ui.input({ label: "Malformed escape", name: "item[bad%ZZ]", value: "value" })}
</div>`;
    return {
        id: "malformedPath", group: "Expected rejections", title: "Malformed paths", badge: "syntax",
        description: "Non-canonical indexes and invalid percent escapes fail tokenization.",
        questionnaire: ui.questionnaire({ name: "malformed-path", item: [
            { linkId: "tag", type: "string", repeats: true }, { linkId: "bad", type: "string" },
        ] }),
        form: ui.form({ id: "malformedPath", body, hint: "invalid index + percent escape", button: "Show rejection" }),
    };
}
