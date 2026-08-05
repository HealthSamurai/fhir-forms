export default async function (ctx: Context, _session: Session | null, _opts: { req: Request }) {
    return { title: "Parser examples", main: await ctx.fns.examples.render({ example: "basic" }) };
}
