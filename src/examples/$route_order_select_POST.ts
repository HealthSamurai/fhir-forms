export default async function (
    ctx: Context,
    _session: Session | null,
    opts: { req: Request },
) {
    const form = await opts.req.formData();
    const template = String(form.get("template") ?? "");
    const catalog = ctx.fns.examples.orderCatalog({}) as Array<any>;
    const order = catalog.find(candidate => candidate.id === template);
    if (!order) {
        return '<div class="rounded-lg border border-coral/30 bg-[#fff8f4] p-4 text-sm text-coral">Unknown order template.</div>';
    }

    const indexes = Array.from(form.keys()).flatMap(name => {
        const match = /^item\[order\]\[(\d+)\]/.exec(name);
        return match ? [Number(match[1])] : [];
    });
    const index = indexes.length === 0 ? 0 : Math.max(...indexes) + 1;
    return ctx.fns.examples.orderFields({ index, order });
}
