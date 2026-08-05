export default function (ctx: Context, _session: Session | null, _opts?: {}) {
    const ui = ctx.fns.examples.ui;
    return {
        id: "codingSugar", group: "Valid responses", title: "Atomic Coding sugar", badge: "sugar",
        description: "Compact system|code|display syntax including an escaped pipe.",
        questionnaire: ui.questionnaire({ name: "coding-sugar", item: [{ linkId: "diagnosis", type: "coding" }] }),
        form: ui.form({
            id: "codingSugar",
            body: ui.input({ label: "Atomic Coding", name: "item[diagnosis]", value: "http://snomed.info/sct|404684003|Clinical finding with \\| marker" }),
            hint: "system|code|escaped display",
        }),
    };
}
