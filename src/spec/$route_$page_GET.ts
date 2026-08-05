export default async function (ctx: Context, _session: Session | null, opts: { params: { page: string } }) {
    return { title: "Specification", main: await ctx.fns.spec.render({ page: opts.params.page }) };
}
