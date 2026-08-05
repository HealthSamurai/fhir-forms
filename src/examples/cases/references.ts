export default function (ctx: Context, _session: Session | null, _opts?: {}) {
    const ui = ctx.fns.examples.ui;
    const styles = ui.styles({});
    const body = `<fieldset class="${styles.fieldset}"><legend>Literal reference</legend><div class="${styles.repeatGrid}">
  ${ui.input({ label: "Reference", name: "item[patient].reference", value: "Patient/123" })}
  ${ui.input({ label: "Display", name: "item[patient].display", value: "Ada Lovelace" })}
</div></fieldset>
<fieldset class="${styles.fieldset}"><legend>Identifier reference</legend><div class="${styles.repeatGrid}">
  ${ui.input({ label: "Identifier system", name: "item[provider].identifier.system", value: "https://example.org/npi" })}
  ${ui.input({ label: "Identifier value", name: "item[provider].identifier.value", value: "1234567890" })}
  ${ui.input({ label: "Display", name: "item[provider].display", value: "Dr Example", extra: "sm:col-span-2" })}
</div></fieldset>`;
    return {
        id: "references", group: "Valid responses", title: "References", badge: "Reference",
        description: "Literal and identifier-based Reference shapes use nested components.",
        questionnaire: ui.questionnaire({ name: "references", item: [
            { linkId: "patient", type: "reference" }, { linkId: "provider", type: "reference" },
        ] }),
        form: ui.form({ id: "references", body, hint: "Reference.reference or identifier" }),
    };
}
