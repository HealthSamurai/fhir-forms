export default function (ctx: Context, _session: Session | null, _opts?: {}) {
    const ui = ctx.fns.examples.ui;
    const base = "item[medication].item";
    const selectClass = "min-w-0 border-0 border-b border-dashed border-teal/45 bg-transparent px-1 py-1 font-serif text-[clamp(1.15rem,3vw,1.7rem)] font-bold text-teal-dark outline-none focus:border-coral";
    const numberClass = "w-16 border-0 border-b border-dashed border-teal/45 bg-transparent px-1 py-1 text-center font-serif text-[clamp(1.15rem,3vw,1.7rem)] font-bold text-teal-dark outline-none focus:border-coral";

    const body = [
        '<section class="overflow-hidden rounded-xl border border-ink/20 bg-[#fffdf8]">',
        '<header class="flex flex-wrap items-end justify-between gap-3 border-b border-ink/10 px-5 py-4">',
        '<div><p class="font-mono text-[.6rem] font-bold uppercase tracking-[.16em] text-coral">Composed widget</p><h2 class="mt-1 text-2xl font-bold tracking-[-.04em]">Medication instruction</h2></div>',
        '<span class="rounded border border-teal/20 bg-teal-soft px-2 py-1 font-mono text-[.62rem] text-teal-dark">5 Questionnaire items / 1 sentence</span>',
        "</header>",
        '<div class="px-5 py-8 sm:px-8">',
        '<p class="flex flex-wrap items-baseline gap-x-2 gap-y-4 font-serif text-[clamp(1.15rem,3vw,1.7rem)] leading-relaxed text-ink">',
        "<span>Take</span>",
        '<input type="hidden" name="' + base + '[drug].system" value="https://example.org/CodeSystem/medication">',
        '<select aria-label="Medication" class="' + selectClass + '" name="' + base + '[drug].code" required><option value="amoxicillin" selected>amoxicillin</option><option value="metformin">metformin</option><option value="lisinopril">lisinopril</option></select>',
        '<input aria-label="Dose value" class="' + numberClass + '" type="number" step="any" name="' + base + '[dose].value" value="1" required>',
        '<select aria-label="Dose unit" class="' + selectClass + '" name="' + base + '[dose].unit"><option value="tablet" selected>tablet</option><option value="mg">mg</option><option value="mL">mL</option></select>',
        "<span>by</span>",
        '<input type="hidden" name="' + base + '[route].system" value="https://example.org/CodeSystem/route">',
        '<select aria-label="Route" class="' + selectClass + '" name="' + base + '[route].code"><option value="oral" selected>mouth</option><option value="topical">skin</option><option value="inhaled">inhalation</option></select>',
        '<input type="hidden" name="' + base + '[frequency].system" value="https://example.org/CodeSystem/frequency">',
        '<select aria-label="Frequency" class="' + selectClass + '" name="' + base + '[frequency].code"><option value="once-daily">once daily</option><option value="twice-daily" selected>twice daily</option><option value="as-needed">as needed</option></select>',
        "<span>.</span>",
        "</p>",
        '<label class="mt-8 block border-t border-ink/10 pt-5"><span class="font-mono text-[.58rem] font-bold uppercase tracking-[.14em] text-muted">Additional instruction</span><input class="mt-2 w-full border-0 bg-transparent p-0 text-base text-ink outline-none placeholder:text-muted/60" name="' + base + '[instruction]" value="Take with food and finish the full course"></label>',
        "</div>",
        '<aside class="border-t border-ink/10 bg-[#f5f2e9] px-5 py-3 text-sm text-muted">A generic renderer can place five controls in sequence. It cannot infer the grammar that turns them into one readable prescription sentence.</aside>',
        "</section>",
    ].join("\n");

    return {
        id: "medicationSentence",
        group: "Bespoke presentation",
        title: "Medication sentence",
        badge: "composed UI",
        description: "Five typed Questionnaire items become one natural-language prescription widget without changing their wire paths.",
        questionnaire: ui.questionnaire({
            name: "medication-sentence",
            item: [{
                linkId: "medication",
                type: "group",
                text: "Medication instruction",
                item: [
                    {
                        linkId: "drug",
                        type: "choice",
                        required: true,
                        answerOption: ["amoxicillin", "metformin", "lisinopril"].map(code => ({
                            valueCoding: {
                                system: "https://example.org/CodeSystem/medication",
                                code,
                            },
                        })),
                    },
                    { linkId: "dose", type: "quantity", required: true },
                    {
                        linkId: "route",
                        type: "choice",
                        answerOption: ["oral", "topical", "inhaled"].map(code => ({
                            valueCoding: {
                                system: "https://example.org/CodeSystem/route",
                                code,
                            },
                        })),
                    },
                    {
                        linkId: "frequency",
                        type: "choice",
                        answerOption: ["once-daily", "twice-daily", "as-needed"].map(code => ({
                            valueCoding: {
                                system: "https://example.org/CodeSystem/frequency",
                                code,
                            },
                        })),
                    },
                    { linkId: "instruction", type: "string" },
                ],
            }],
        }),
        form: ui.form({
            id: "medicationSentence",
            body,
            hint: "one sentence -> group children + Quantity + Codings",
            shell: false,
        }),
    };
}
