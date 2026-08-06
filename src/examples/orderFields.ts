export default function (
    _ctx: Context,
    _session: Session | null,
    opts: { index: number; order: any },
) {
    const path = "item[order][" + opts.index + "].item";
    const order = opts.order;
    const fields = [
        coding(path + "[kind]", order.kind),
        coding(path + "[code]", order.code),
    ];

    if (order.dose) {
        fields.push(hidden(path + "[dose].value", order.dose.value));
        fields.push(hidden(path + "[dose].unit", order.dose.unit));
        fields.push(hidden(path + "[dose].system", order.dose.system));
        fields.push(hidden(path + "[dose].code", order.dose.code));
    }
    if (order.asNeeded !== undefined) {
        fields.push(hidden(path + "[asNeeded]", String(order.asNeeded)));
    }
    if (order.bodySite) {
        fields.push(coding(path + "[bodySite]", order.bodySite));
    }

    return [
        '<article class="animate-rise rounded-lg border border-teal/20 bg-white p-4 shadow-sm" data-order-row data-order-index="' +
            opts.index + '">',
        '<div class="flex items-start justify-between gap-4">',
        "<div>",
        '<p class="font-mono text-[.55rem] font-bold uppercase tracking-[.14em] text-teal">' +
            escapeHtml(order.kind.display) + " / order " + (opts.index + 1) + "</p>",
        '<h3 class="mt-1 text-lg font-bold tracking-[-.03em]">' + escapeHtml(order.label) + "</h3>",
        '<p class="mt-1 text-xs text-muted">' + escapeHtml(order.description) + "</p>",
        "</div>",
        '<span class="rounded bg-[#f5f2e9] px-2 py-1 font-mono text-[.58rem] text-muted">hidden FHIR fields</span>',
        "</div>",
        '<div class="mt-3 hidden" aria-hidden="true">' + fields.join("") + "</div>",
        "</article>",
    ].join("\n");
}

function coding(path: string, value: any): string {
    return [
        hidden(path + ".system", value.system),
        hidden(path + ".code", value.code),
        hidden(path + ".display", value.display),
    ].join("");
}

function hidden(name: string, value: string): string {
    return '<input type="hidden" name="' + escapeHtml(name) + '" value="' +
        escapeHtml(value) + '">';
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
