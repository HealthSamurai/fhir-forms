export default function (ctx: Context, _session: Session | null, _opts?: {}) {
    const ui = ctx.fns.examples.ui;
    const styles = ui.styles({});
    const body = `<div class="${styles.formGrid}">
  ${ui.input({ label: "Invalid boolean", name: "item[consent]", value: "yes" })}
  ${ui.input({ label: "Impossible date", name: "item[date]", value: "2026-02-30" })}
  ${ui.input({ label: "Quantity value", name: "item[dose].value", value: "12" })}
  ${ui.input({ label: "Invalid comparator", name: "item[dose].comparator", value: "~" })}
  ${ui.input({ label: "Reference display only", name: "item[subject].display", value: "Nobody" })}
  ${ui.input({ label: "Component on string", name: "item[label].code", value: "illegal" })}
</div>`;
    return {
        id: "invalidValues", group: "Expected rejections", title: "Invalid typed values", badge: "types",
        description: "Lexical, complex completeness, and illegal component errors accumulate.",
        questionnaire: ui.questionnaire({ name: "invalid-values", item: [
            { linkId: "consent", type: "boolean" }, { linkId: "date", type: "date" },
            { linkId: "dose", type: "quantity" }, { linkId: "subject", type: "reference" },
            { linkId: "label", type: "string" },
        ] }),
        form: ui.form({ id: "invalidValues", body, hint: "lexical, incomplete, and component errors", button: "Show rejection" }),
    };
}
