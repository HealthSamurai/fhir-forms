export default function (
    ctx: Context,
    _session: Session | null,
    opts: { query?: string },
) {
    const query = normalize(opts.query ?? "");
    const terms = query.split(" ").filter(Boolean);
    const catalog = ctx.fns.examples.orderCatalog({}) as Array<any>;
    const matches = terms.length === 0
        ? catalog
        : catalog.filter(order => {
            const haystack = normalize(order.label + " " + order.description + " " + order.keywords);
            return terms.every(term => haystack.includes(term));
        });

    if (matches.length === 0) {
        return '<div class="rounded-lg border border-dashed border-coral/35 bg-[#fff8f4] p-4 text-sm text-muted">No orderable matches. Try <strong>ibuprofen 10mg prn</strong> or <strong>xray of legg</strong>.</div>';
    }

    const eyebrow = terms.length === 0
        ? "Try a complete order phrase"
        : matches.length + (matches.length === 1 ? " match" : " matches");
    return [
        '<div class="overflow-hidden rounded-lg border border-ink/15 bg-white shadow-sm">',
        '<p class="border-b border-ink/10 px-4 py-2 font-mono text-[.56rem] font-bold uppercase tracking-[.14em] text-muted">' +
            eyebrow + "</p>",
        matches.map(order => [
            '<button class="group flex w-full cursor-pointer items-center justify-between gap-4 border-0 border-b border-ink/10 bg-white px-4 py-3 text-left last:border-b-0 hover:bg-teal-soft/60" type="button" name="template" value="' +
                escapeHtml(order.id) + '" hx-post="/examples/order/select" hx-include="closest form" hx-target="#order-lines" hx-swap="beforeend" hx-on::after-request="document.getElementById(\'order-query\').value=\'\'; this.closest(\'[data-order-search-results]\').innerHTML=\'\'">',
            '<span><strong class="block text-sm text-ink">' + escapeHtml(order.label) +
                '</strong><small class="mt-0.5 block text-xs text-muted">' +
                escapeHtml(order.description) + "</small></span>",
            '<span class="shrink-0 font-mono text-[.62rem] font-bold uppercase tracking-[.1em] text-teal transition group-hover:translate-x-0.5">Add +</span>',
            "</button>",
        ].join("\n")).join("\n"),
        "</div>",
    ].join("\n");
}

function normalize(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
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
