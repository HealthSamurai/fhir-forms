export default function (ctx: Context, _session: Session | null, _opts?: {}) {
    const ui = ctx.fns.examples.ui;
    return {
        id: "sparse", group: "Expected rejections", title: "Sparse occurrence", badge: "sparse",
        description: "The first submitted repeat cannot start at index 1.",
        questionnaire: ui.questionnaire({ name: "sparse-repeats", item: [{ linkId: "tag", type: "string", repeats: true }] }),
        form: ui.form({ id: "sparse", body: ui.input({ label: "First posted index is 1", name: "item[tag][1]", value: "orphan" }), hint: "expects cardinality.sparse-index", button: "Show rejection" }),
    };
}
