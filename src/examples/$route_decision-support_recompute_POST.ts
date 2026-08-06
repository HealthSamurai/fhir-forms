export default async function (
    ctx: Context,
    _session: Session | null,
    opts: { req: Request },
) {
    const form = await opts.req.formData();
    const integer = (name: string): number => {
        const value = Number(form.get(name));
        return Number.isSafeInteger(value) && value >= 0 ? value : 0;
    };
    const boolean = (name: string): boolean => form.get(name) === "true";
    const decision = ctx.fns.examples.decisionSupport({
        age: integer("item[age]"),
        duration: integer("item[duration]"),
        fever: boolean("item[fever]"),
        breathless: boolean("item[breathless]"),
        chestPain: boolean("item[chestPain]"),
    });
    return ctx.fns.examples.decisionSupportPanel(decision);
}
