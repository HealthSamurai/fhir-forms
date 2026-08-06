export default function (ctx: Context, _session: Session | null, _opts?: {}) {
    const ui = ctx.fns.examples.ui;
    const styles = ui.styles({});
    const reason = "item[reason].item";
    const safety = "item[safety].item";
    const context = "item[context].item";
    const boolean = (path: string, label: string, value: boolean) => [
        '<fieldset class="grid gap-2 border-0 p-0">',
        '<legend class="font-mono text-[.55rem] font-bold uppercase tracking-[.14em] text-muted">' + label + "</legend>",
        '<div class="grid grid-cols-2 gap-2">',
        '<label class="cursor-pointer"><input class="peer sr-only" type="radio" name="' + path + '" value="true"' + (value ? " checked" : "") + '><span class="block rounded-md border border-ink/15 px-3 py-2 text-center text-sm font-semibold transition peer-checked:border-coral peer-checked:bg-coral/10 peer-checked:text-coral">Yes</span></label>',
        '<label class="cursor-pointer"><input class="peer sr-only" type="radio" name="' + path + '" value="false"' + (!value ? " checked" : "") + '><span class="block rounded-md border border-ink/15 px-3 py-2 text-center text-sm font-semibold transition peer-checked:border-teal peer-checked:bg-teal-soft peer-checked:text-teal-dark">No</span></label>',
        "</div>",
        "</fieldset>",
    ].join("");

    const body = [
        '<section class="overflow-hidden rounded-xl border border-ink/20 bg-[#fffdf8]">',
        '<div class="grid lg:grid-cols-[13rem_minmax(0,1fr)]">',
        '<aside class="border-b border-ink/10 bg-[#f5f2e9] p-4 lg:border-b-0 lg:border-r">',
        '<p class="font-mono text-[.58rem] font-bold uppercase tracking-[.16em] text-coral">Adaptive workflow</p>',
        '<h2 class="mt-1 text-xl font-bold tracking-[-.04em]">Same form, own navigation</h2>',
        '<nav class="mt-4 flex gap-2 overflow-x-auto lg:grid" aria-label="Intake sections">',
        '<a class="whitespace-nowrap rounded-md bg-teal px-3 py-2 text-sm font-semibold text-white" href="#intake-reason">1. Reason</a>',
        '<a class="whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold text-muted hover:bg-white" href="#intake-safety">2. Safety</a>',
        '<a class="whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold text-muted hover:bg-white" href="#intake-context">3. Context</a>',
        "</nav>",
        '<div class="mt-6 hidden lg:block"><div class="h-1.5 overflow-hidden rounded-full bg-ink/10"><div class="h-full w-2/3 rounded-full bg-coral"></div></div><p class="mt-2 font-mono text-[.58rem] text-muted">2 of 3 sections reviewed</p></div>',
        "</aside>",
        '<div class="divide-y divide-ink/10">',
        '<section id="intake-reason" class="scroll-mt-24 p-5 sm:p-7">',
        '<p class="font-mono text-[.58rem] font-bold uppercase tracking-[.14em] text-teal">01 / Reason</p>',
        '<h3 class="mt-1 text-2xl font-bold tracking-[-.04em]">What brings you in?</h3>',
        '<div class="mt-5 grid gap-px overflow-hidden rounded-lg border border-ink/15 bg-ink/15 sm:grid-cols-2">',
        '<label class="' + styles.field + ' sm:col-span-2"><span>Chief complaint</span><input class="' + styles.control + '" name="' + reason + '[complaint]" value="Shortness of breath on stairs" required></label>',
        '<label class="' + styles.field + '"><span>Started</span><input class="' + styles.control + '" type="text" name="' + reason + '[onset]" value="2026-07"></label>',
        '<label class="' + styles.field + '"><span>Severity</span><div class="grid grid-cols-[1fr_auto] items-center gap-3 px-3 pb-2"><input class="accent-teal" type="range" min="0" max="10" name="' + reason + '[severity]" value="4"><strong class="font-mono text-coral">4/10</strong></div></label>',
        "</div>",
        "</section>",
        '<section id="intake-safety" class="scroll-mt-24 p-5 sm:p-7">',
        '<p class="font-mono text-[.58rem] font-bold uppercase tracking-[.14em] text-teal">02 / Safety</p>',
        '<h3 class="mt-1 text-2xl font-bold tracking-[-.04em]">Immediate concerns</h3>',
        '<div class="mt-5 grid gap-5 sm:grid-cols-2">',
        boolean(safety + "[breathing]", "Difficulty breathing now", false),
        boolean(safety + "[chestPain]", "Chest pain", false),
        boolean(safety + "[fainting]", "Fainting or near-fainting", false),
        boolean(safety + "[worsening]", "Rapidly getting worse", true),
        "</div>",
        "</section>",
        '<section id="intake-context" class="scroll-mt-24 p-5 sm:p-7">',
        '<p class="font-mono text-[.58rem] font-bold uppercase tracking-[.14em] text-teal">03 / Context</p>',
        '<h3 class="mt-1 text-2xl font-bold tracking-[-.04em]">Anything we should know?</h3>',
        '<div class="mt-5 grid gap-px overflow-hidden rounded-lg border border-ink/15 bg-ink/15 sm:grid-cols-2">',
        '<label class="' + styles.field + '"><span>Best contact</span><input class="' + styles.control + '" name="' + context + '[contact]" value="+351 910 000 000"></label>',
        '<label class="' + styles.field + '"><span>Preferred language</span><input class="' + styles.control + '" name="' + context + '[language]" value="English"></label>',
        '<label class="' + styles.field + ' sm:col-span-2"><span>Additional context</span><textarea class="' + styles.control + ' min-h-28 resize-y" name="' + context + '[note]">Symptoms began after a long flight.</textarea></label>',
        "</div>",
        "</section>",
        "</div>",
        "</div>",
        '<aside class="border-t border-ink/10 bg-teal-soft/50 px-5 py-3 text-sm text-teal-dark">The Questionnaire defines three groups. It does not define a sticky section rail, progress model, mobile stacking order, or review workflow.</aside>',
        "</section>",
    ].join("\n");

    return {
        id: "adaptiveIntake",
        group: "Bespoke presentation",
        title: "Adaptive intake workspace",
        badge: "responsive UI",
        description: "Questionnaire groups become product navigation and responsive sections instead of generic nested fieldsets.",
        questionnaire: ui.questionnaire({
            name: "adaptive-intake",
            item: [
                {
                    linkId: "reason",
                    type: "group",
                    item: [
                        { linkId: "complaint", type: "string", required: true },
                        { linkId: "onset", type: "date" },
                        { linkId: "severity", type: "integer" },
                    ],
                },
                {
                    linkId: "safety",
                    type: "group",
                    item: [
                        { linkId: "breathing", type: "boolean" },
                        { linkId: "chestPain", type: "boolean" },
                        { linkId: "fainting", type: "boolean" },
                        { linkId: "worsening", type: "boolean" },
                    ],
                },
                {
                    linkId: "context",
                    type: "group",
                    item: [
                        { linkId: "contact", type: "string" },
                        { linkId: "language", type: "string" },
                        { linkId: "note", type: "text" },
                    ],
                },
            ],
        }),
        form: ui.form({
            id: "adaptiveIntake",
            body,
            hint: "custom navigation -> ordinary group ancestry",
            shell: false,
        }),
    };
}
