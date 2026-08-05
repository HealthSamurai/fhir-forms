export default async function (ctx: Context, _session: Session | null, opts: { params: { section: string; page: string } }) {
    const page = `${opts.params.section}/${opts.params.page}`;
    return { title: "Specification", main: await ctx.fns.spec.render({ page }) };
}
