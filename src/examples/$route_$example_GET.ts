export default async function (ctx: Context, _session: Session | null, opts: { params: { example: string } }) {
    return { title: "Parser examples", main: await ctx.fns.examples.render({ example: opts.params.example }) };
}
