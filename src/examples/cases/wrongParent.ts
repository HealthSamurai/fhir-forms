export default function (ctx: Context, _session: Session | null, _opts?: {}) {
    const ui = ctx.fns.examples.ui;
    return {
        id: "wrongParent", group: "Expected rejections", title: "Wrong ancestry", badge: "parent",
        description: "A child linkId is invalid without its Questionnaire parent path.",
        questionnaire: ui.questionnaire({ name: "wrong-parent", item: [{
            linkId: "contact", type: "group", item: [{ linkId: "email", type: "string" }],
        }] }),
        form: ui.form({ id: "wrongParent", body: ui.input({ label: "Email without contact ancestor", name: "item[email]", value: "ada@example.org" }), hint: "expects path.unknown-item", button: "Show rejection" }),
    };
}
