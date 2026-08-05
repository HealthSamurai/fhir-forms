export default function (ctx: Context, _session: Session | null, _opts?: {}) {
    const ui = ctx.fns.examples.ui;
    const styles = ui.styles({});
    const body = `<div class="${styles.formGrid}">
  ${ui.input({ label: "Age copy A", name: "item[age]", value: "40" })}
  ${ui.input({ label: "Age copy B", name: "item[age]", value: "41" })}
</div>`;
    return {
        id: "duplicates", group: "Expected rejections", title: "Duplicate scalar", badge: "duplicate",
        description: "Two successful controls cannot claim one complete scalar path.",
        questionnaire: ui.questionnaire({ name: "duplicate-field", item: [{ linkId: "age", type: "integer" }] }),
        form: ui.form({ id: "duplicates", body, hint: "expects cardinality.duplicate-field", button: "Show rejection" }),
    };
}
