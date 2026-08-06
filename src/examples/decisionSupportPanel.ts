export default function (
    _ctx: Context,
    _session: Session | null,
    opts: {
        level: "urgent" | "same-day" | "routine";
        score: number;
        title: string;
        message: string;
        factors: string[];
    },
) {
    const tone = opts.level === "urgent"
        ? {
            box: "border-[#d86850] bg-[#fff4ef]",
            eyebrow: "text-[#9e3d2a]",
            score: "bg-[#d86850] text-white",
        }
        : opts.level === "same-day"
            ? {
                box: "border-[#d39b45] bg-[#fff8e8]",
                eyebrow: "text-[#8b5d15]",
                score: "bg-[#b87718] text-white",
            }
            : {
                box: "border-teal/35 bg-teal-soft/70",
                eyebrow: "text-teal-dark",
                score: "bg-teal text-white",
            };
    const factors = opts.factors.length > 0
        ? opts.factors.map(factor => "<li>" + escapeHtml(factor) + "</li>").join("")
        : "<li>No escalation factors selected</li>";

    return [
        '<aside id="decision-support-result" class="rounded-xl border ' + tone.box +
            ' p-5 shadow-sm transition" aria-live="polite">',
        '<div class="flex items-start justify-between gap-4">',
        "<div>",
        '<p class="font-mono text-[.58rem] font-bold uppercase tracking-[.16em] ' +
            tone.eyebrow + '">Server recompute / illustrative rule</p>',
        '<h3 class="mt-1 text-2xl font-bold tracking-[-.04em]">' +
            escapeHtml(opts.title) + "</h3>",
        '<p class="mt-2 max-w-xl text-sm leading-relaxed text-ink/75">' +
            escapeHtml(opts.message) + "</p>",
        "</div>",
        '<strong class="grid size-14 shrink-0 place-items-center rounded-full font-mono text-xl ' +
            tone.score + '" aria-label="Illustrative score ' + opts.score + '">' +
            opts.score + "</strong>",
        "</div>",
        '<ul class="mt-4 grid gap-1 border-t border-current/10 pt-3 font-mono text-[.65rem] text-ink/65">' +
            factors + "</ul>",
        '<p class="mt-4 text-[.7rem] leading-relaxed text-muted">Demonstration rule only. It is not a validated clinical protocol or medical advice.</p>',
        "</aside>",
    ].join("\n");
}

function escapeHtml(value: unknown): string {
    return String(value ?? "").replace(
        /[&<>"']/g,
        character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "\"": "&quot;",
            "'": "&#39;",
        })[character]!,
    );
}
