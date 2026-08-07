export default function (ctx: Context, _session: Session | null, _opts?: {}) {
    const ui = ctx.fns.examples.ui;
    const styles = ui.styles({});
    const fieldSurface = styles.field + " overflow-hidden rounded-xl bg-white shadow-[0_8px_24px_rgba(25,62,50,.06)] ring-1 ring-teal/10";
    const decision = ctx.fns.examples.decisionSupport({
        age: 67,
        duration: 3,
        fever: true,
        breathless: false,
        chestPain: false,
    });
    const panel = ctx.fns.examples.decisionSupportPanel(decision);
    const yesNo = (path: string, label: string, value: boolean) => [
        '<fieldset class="grid min-w-0 gap-2 rounded-xl border-0 bg-white p-4 shadow-[0_8px_24px_rgba(25,62,50,.06)] ring-1 ring-teal/10">',
        '<legend class="font-mono text-[.55rem] font-bold uppercase tracking-[.14em] text-muted">' +
            label + "</legend>",
        '<div class="grid grid-cols-2 gap-2">',
        '<label class="cursor-pointer"><input class="peer sr-only" type="radio" name="' +
            path + '" value="true"' + (value ? " checked" : "") +
            '><span class="block rounded-lg bg-[#f3f6f4] px-3 py-2 text-center text-sm font-semibold text-muted transition hover:bg-[#edf3ef] peer-checked:bg-[#fff0eb] peer-checked:text-coral peer-checked:shadow-[inset_0_0_0_1px_#ec765d]">Yes</span></label>',
        '<label class="cursor-pointer"><input class="peer sr-only" type="radio" name="' +
            path + '" value="false"' + (!value ? " checked" : "") +
            '><span class="block rounded-lg bg-[#f3f6f4] px-3 py-2 text-center text-sm font-semibold text-muted transition hover:bg-[#edf3ef] peer-checked:bg-[#dff1eb] peer-checked:text-teal-dark peer-checked:shadow-[inset_0_0_0_1px_#238c7d]">No</span></label>',
        "</div>",
        "</fieldset>",
    ].join("");

    const form = [
        '<form>',
        '<input type="hidden" name="_example" value="decisionSupport">',
        '<section class="overflow-hidden rounded-2xl bg-white shadow-[0_18px_50px_rgba(25,62,50,.10)] ring-1 ring-teal/10">',
        '<header class="bg-[linear-gradient(120deg,#eef8f4_0%,#fffaf0_100%)] px-5 py-5 sm:px-6">',
        '<div class="flex flex-wrap items-start justify-between gap-3">',
        '<div><p class="font-mono text-[.6rem] font-bold uppercase tracking-[.16em] text-coral">Server-driven decision support</p><h2 class="mt-1 text-2xl font-bold tracking-[-.04em]">Respiratory intake</h2><p class="mt-1 max-w-2xl text-sm text-muted">Every change posts the current entry list. The server evaluates an illustrative rule and swaps only the advisory panel.</p></div>',
        '<span class="rounded-full bg-white/80 px-3 py-1.5 font-mono text-[.62rem] text-teal-dark shadow-sm">htmx / no write</span>',
        "</div>",
        "</header>",
        '<div hx-post="/examples/decision-support/recompute" hx-trigger="change from:closest form delay:250ms" hx-include="closest form" hx-target="#decision-support-result" hx-swap="outerHTML" hx-sync="closest form:queue last" class="grid gap-5 bg-[#f3f8f5] p-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,.8fr)] sm:p-6">',
        '<div class="grid content-start gap-3 sm:grid-cols-2">',
        '<label class="' + fieldSurface + '"><span>Age</span><input class="' +
            styles.control + '" type="number" step="1" min="0" name="item[age]" value="67" required></label>',
        '<label class="' + fieldSurface + '"><span>Days with symptoms</span><input class="' +
            styles.control + '" type="number" step="1" min="0" name="item[duration]" value="3"></label>',
        yesNo("item[fever]", "Fever", true),
        yesNo("item[breathless]", "Breathlessness", false),
        yesNo("item[chestPain]", "Chest pain", false),
        '<div class="grid content-center rounded-xl bg-teal-soft/70 p-4 text-sm leading-relaxed text-teal-dark shadow-[0_8px_24px_rgba(25,62,50,.05)]"><strong class="font-mono text-[.58rem] uppercase tracking-[.12em]">Questionnaire remains ordinary</strong><span class="mt-1 opacity-75">Five primitive answers are posted with canonical names. The decision panel is derived server UI, not a trusted hidden answer.</span></div>',
        "</div>",
        '<div class="self-stretch">',
        panel,
        "</div>",
        "</div>",
        "</section>",
        '<div class="mt-3 flex items-center justify-between gap-4">',
        '<small class="font-mono text-[.64rem] text-muted">change -> recompute fragment / submit -> QuestionnaireResponse</small>',
        '<button class="' + styles.button +
            '" type="submit" hx-post="/examples/parse" hx-include="closest form" hx-target="#example-decisionSupport" hx-swap="outerHTML">Materialize response</button>',
        "</div>",
        "</form>",
    ].join("\n");

    return {
        id: "decisionSupport",
        group: "Bespoke presentation",
        title: "Server decision support",
        badge: "htmx",
        description: "Questionnaire answers drive a server-evaluated advisory panel without storing on recompute or shipping a rule engine to the browser.",
        questionnaire: ui.questionnaire({
            name: "decision-support-intake",
            item: [
                { linkId: "age", type: "integer", text: "Age", required: true },
                { linkId: "duration", type: "integer", text: "Days with symptoms" },
                { linkId: "fever", type: "boolean", text: "Fever" },
                { linkId: "breathless", type: "boolean", text: "Breathlessness" },
                { linkId: "chestPain", type: "boolean", text: "Chest pain" },
            ],
        }),
        form,
    };
}
