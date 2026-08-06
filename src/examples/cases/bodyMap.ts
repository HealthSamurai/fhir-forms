export default function (ctx: Context, _session: Session | null, _opts?: {}) {
    const ui = ctx.fns.examples.ui;
    const styles = ui.styles({});
    const locationPath = "item[pain].item[location]";
    const region = (
        code: string,
        label: string,
        position: string,
        checked = false,
    ) => [
        '<label class="absolute ' + position + ' cursor-pointer">',
        '<input class="peer sr-only" type="radio" name="' + locationPath +
            '.code" value="' + code + '"' + (checked ? " checked" : "") + " required>",
        '<span class="block rounded-full border border-teal/30 bg-white/95 px-2.5 py-1 font-mono text-[.6rem] font-bold uppercase tracking-[.08em] text-teal-dark shadow-sm transition hover:-translate-y-0.5 hover:border-teal peer-checked:border-coral peer-checked:bg-coral peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-teal">' +
            label + "</span>",
        "</label>",
    ].join("");

    const body = [
        '<input type="hidden" name="' + locationPath +
            '.system" value="https://example.org/CodeSystem/body-region">',
        '<section class="overflow-hidden rounded-xl border border-ink/20 bg-[#fffdf8]">',
        '<header class="border-b border-ink/10 px-5 py-4">',
        '<p class="font-mono text-[.6rem] font-bold uppercase tracking-[.16em] text-coral">Spatial widget</p>',
        '<h2 class="mt-1 text-2xl font-bold tracking-[-.04em]">Where does it hurt?</h2>',
        '<p class="mt-1 text-sm text-muted">Select the area on the body, then describe this pain episode.</p>',
        "</header>",
        '<div class="grid lg:grid-cols-[minmax(18rem,.8fr)_minmax(18rem,1.2fr)]">',
        '<div class="relative min-h-[31rem] overflow-hidden border-b border-ink/10 bg-[radial-gradient(circle_at_50%_35%,#d7eee8_0,transparent_55%)] lg:border-b-0 lg:border-r">',
        '<svg class="absolute inset-0 m-auto h-[28rem] w-full max-w-[18rem] text-teal/20" viewBox="0 0 220 440" aria-hidden="true">',
        '<circle cx="110" cy="42" r="28" fill="currentColor"/>',
        '<path d="M80 80 Q110 68 140 80 L155 205 Q145 238 132 252 L137 410 H112 L105 270 L98 410 H73 L82 252 Q69 238 65 205 Z" fill="currentColor"/>',
        '<path d="M72 96 L30 235 L49 241 L91 128 M148 96 L190 235 L171 241 L129 128" fill="none" stroke="currentColor" stroke-width="20" stroke-linecap="round"/>',
        "</svg>",
        region("head", "Head", "left-1/2 top-[8%] -translate-x-1/2"),
        region("chest", "Chest", "left-1/2 top-[28%] -translate-x-1/2", true),
        region("abdomen", "Abdomen", "left-1/2 top-[43%] -translate-x-1/2"),
        region("left-knee", "L knee", "left-[27%] top-[70%]"),
        region("right-knee", "R knee", "right-[27%] top-[70%]"),
        "</div>",
        '<div class="grid content-start gap-px bg-ink/15">',
        '<label class="' + styles.field + '"><span>Intensity</span><div class="grid grid-cols-[1fr_auto] items-center gap-4 px-3 pb-3"><input class="accent-teal" type="range" min="0" max="10" name="item[pain].item[intensity]" value="6"><strong class="font-mono text-xl text-coral">6/10</strong></div></label>',
        '<label class="' + styles.field + '"><span>Laterality</span><select class="' + styles.control + '" name="item[pain].item[laterality].code"><option value="">Not applicable</option><option value="left">Left</option><option value="right">Right</option><option value="bilateral" selected>Bilateral</option></select></label>',
        '<input type="hidden" name="item[pain].item[laterality].system" value="https://example.org/CodeSystem/laterality">',
        '<label class="' + styles.field + '"><span>What does it feel like?</span><textarea class="' + styles.control + ' min-h-28 resize-y" name="item[pain].item[description]">Pressure that gets worse with movement</textarea></label>',
        '<aside class="m-4 rounded-lg border border-teal/20 bg-teal-soft/60 p-4 text-sm leading-relaxed text-teal-dark"><strong class="block font-mono text-[.62rem] uppercase tracking-[.12em]">Why this is bespoke</strong>The Questionnaire knows that location is a Coding. It does not contain coordinates, a body silhouette, or the decision to make anatomy the primary navigation.</aside>',
        "</div>",
        "</div>",
        "</section>",
    ].join("\n");

    return {
        id: "bodyMap",
        group: "Bespoke presentation",
        title: "Anatomical body map",
        badge: "spatial UI",
        description: "A coded answer is selected through a spatial SVG interface that a generic item renderer cannot infer.",
        questionnaire: ui.questionnaire({
            name: "pain-body-map",
            item: [{
                linkId: "pain",
                type: "group",
                text: "Pain assessment",
                item: [
                    {
                        linkId: "location",
                        type: "choice",
                        text: "Body region",
                        required: true,
                        answerOption: ["head", "chest", "abdomen", "left-knee", "right-knee"].map(code => ({
                            valueCoding: {
                                system: "https://example.org/CodeSystem/body-region",
                                code,
                            },
                        })),
                    },
                    { linkId: "intensity", type: "integer", text: "Intensity" },
                    {
                        linkId: "laterality",
                        type: "choice",
                        text: "Laterality",
                        answerOption: ["left", "right", "bilateral"].map(code => ({
                            valueCoding: {
                                system: "https://example.org/CodeSystem/laterality",
                                code,
                            },
                        })),
                    },
                    { linkId: "description", type: "text", text: "Description" },
                ],
            }],
        }),
        form: ui.form({
            id: "bodyMap",
            body,
            hint: "spatial HTML -> ordinary Coding and primitive entries",
            shell: false,
        }),
    };
}
