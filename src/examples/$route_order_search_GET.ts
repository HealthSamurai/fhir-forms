export default function (
    ctx: Context,
    _session: Session | null,
    opts: { req: Request },
) {
    const url = new URL(opts.req.url);
    return ctx.fns.examples.orderSearch({ query: url.searchParams.get("q") ?? "" });
}
