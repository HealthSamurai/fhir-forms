export default function (ctx: Context, _session: Session | null, _opts?: {}) {
    const ui = ctx.fns.examples.ui;
    const styles = ui.styles({});
    const initialSuggestions = ctx.fns.examples.orderSearch({ query: "" });
    const form = [
        '<form>',
        '<input type="hidden" name="_example" value="orderComposer">',
        '<section class="overflow-hidden rounded-xl border border-ink/20 bg-[#fffdf8]">',
        '<header class="relative border-b border-ink/10 px-5 py-5 sm:px-6">',
        '<div class="flex flex-wrap items-start justify-between gap-3">',
        '<div><p class="font-mono text-[.6rem] font-bold uppercase tracking-[.16em] text-coral">Search-to-structure</p><h2 class="mt-1 text-2xl font-bold tracking-[-.04em]">Add an order</h2><p class="mt-1 max-w-2xl text-sm text-muted">Type the final phrase. Selecting a result inserts canonical hidden controls; the search string itself never becomes the clinical answer.</p></div>',
        '<span class="rounded border border-teal/20 bg-teal-soft px-2 py-1 font-mono text-[.62rem] text-teal-dark">htmx typeahead</span>',
        "</div>",
        '<div class="relative mt-5">',
        '<label class="block"><span class="sr-only">Order search</span><input id="order-query" class="w-full rounded-lg border border-ink/20 bg-white px-4 py-3 pr-12 text-lg text-ink outline-none placeholder:text-muted/60 focus:border-teal focus:ring-2 focus:ring-teal/15" type="search" name="q" placeholder="ibuprofen 10mg prn or xray of legg" autocomplete="off" hx-get="/examples/order/search" hx-trigger="input changed delay:250ms, search" hx-target="#order-search-results" hx-swap="innerHTML"></label>',
        '<span class="pointer-events-none absolute right-4 top-3.5 font-mono text-sm text-teal">⌕</span>',
        "</div>",
        '<div id="order-search-results" data-order-search-results class="absolute z-20 mt-2 w-[min(42rem,calc(100%-3rem))]">' +
            initialSuggestions + "</div>",
        "</header>",
        '<div class="grid gap-4 bg-[#f5f2e9] p-5 sm:p-6">',
        '<div class="flex items-center justify-between gap-4"><div><p class="font-mono text-[.56rem] font-bold uppercase tracking-[.14em] text-muted">Selected orders</p><p class="mt-1 text-sm text-muted">Each card owns one contiguous Questionnaire repeat occurrence.</p></div></div>',
        '<div id="order-lines" class="grid gap-3"><div class="hidden rounded-lg border border-dashed border-ink/20 p-5 text-center text-sm text-muted only:block">No orders selected yet. Search above to add one.</div></div>',
        "</div>",
        '<aside class="border-t border-ink/10 bg-teal-soft/50 px-5 py-3 text-sm text-teal-dark">The typeahead is presentation. Once selected, an order is represented only by typed group children: kind, code, optional Quantity dose, as-needed flag, and body site.</aside>',
        "</section>",
        '<div class="mt-3 flex items-center justify-between gap-4">',
        '<small class="font-mono text-[.64rem] text-muted">search phrase -> hidden item[order][n].item[...] fields</small>',
        '<button class="' + styles.button + '" type="submit" hx-post="/examples/parse" hx-include="closest form" hx-target="#example-orderComposer" hx-swap="outerHTML">Build QuestionnaireResponse</button>',
        "</div>",
        "</form>",
    ].join("\n");

    return {
        id: "orderComposer",
        group: "Bespoke presentation",
        title: "Order composer",
        badge: "htmx search",
        description: "A free-form order phrase resolves to structured hidden Questionnaire entries before final collection.",
        questionnaire: ui.questionnaire({
            name: "order-composer",
            item: [{
                linkId: "order",
                type: "group",
                repeats: true,
                text: "Order",
                item: [
                    { linkId: "kind", type: "choice", required: true },
                    { linkId: "code", type: "choice", required: true },
                    { linkId: "dose", type: "quantity" },
                    { linkId: "asNeeded", type: "boolean" },
                    { linkId: "bodySite", type: "choice" },
                ],
            }],
        }),
        form,
    };
}
