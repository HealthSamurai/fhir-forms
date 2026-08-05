export default function (ctx: Context, _session: Session | null, _opts?: {}) {
    const ui = ctx.fns.examples.ui;
    const styles = ui.styles({});
    const body = `<div class="${styles.formGrid}">
  ${ui.input({ label: "Repeat missing index", name: "item[tag]", value: "alpha" })}
  ${ui.input({ label: "Scalar with index", name: "item[age][0]", value: "40" })}
</div>`;
    return {
        id: "cardinality", group: "Expected rejections", title: "Wrong index usage", badge: "index",
        description: "Repeats require indexes; non-repeats forbid them.",
        questionnaire: ui.questionnaire({ name: "cardinality-errors", item: [
            { linkId: "tag", type: "string", repeats: true }, { linkId: "age", type: "integer" },
        ] }),
        form: ui.form({ id: "cardinality", body, hint: "index required + index forbidden", button: "Show rejection" }),
    };
}
