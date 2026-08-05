export default function (ctx: Context, _session: Session | null, _opts?: {}) {
    const ui = ctx.fns.examples.ui;
    const styles = ui.styles({});
    const body = `<div class="${styles.formGrid}">
  ${ui.input({ label: "Atomic value", name: "item[code]", value: "http://loinc.org|LA6568-5|Yes", extra: "sm:col-span-2" })}
  ${ui.input({ label: "Component system", name: "item[code].system", value: "http://loinc.org" })}
  ${ui.input({ label: "Component code", name: "item[code].code", value: "LA6568-5" })}
</div>`;
    return {
        id: "conflictingCoding", group: "Expected rejections", title: "Conflicting Coding", badge: "conflict",
        description: "Atomic sugar and component representation cannot describe the same answer.",
        questionnaire: ui.questionnaire({ name: "conflicting-coding", item: [{ linkId: "code", type: "coding" }] }),
        form: ui.form({ id: "conflictingCoding", body, hint: "atomic and components cannot mix", button: "Show rejection" }),
    };
}
