export default async function (ctx: Context, _session: Session | null, opts: { req: Request }) {
    const form = await opts.req.formData();
    const example = String(form.get("_example") ?? "");
    const selected = ctx.fns.examples.getCase({ id: example }) as any;
    if (!selected) {
        return await ctx.fns.examples.result({ result: { ok: false, issues: [{ code: "example.unknown", message: "Unknown example" }] } });
    }
    const entries = Array.from(form.entries()).filter(([name]) => name.startsWith("item[")).map(([name, value]) => ({ name, value }));
    const result = await ctx.fns.parser.parse({ entries, questionnaire: selected.questionnaire, context: { status: "completed", authored: new Date().toISOString() } });
    return await ctx.fns.examples.card({ example, result });
}
