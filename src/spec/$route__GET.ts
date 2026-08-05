export default async function (ctx: Context, _session: Session | null, opts: { req: Request }) {
    const legacyPage = new URL(opts.req.url).searchParams.get("page");
    if (legacyPage && /^[a-z0-9-]+(?:\/[a-z0-9-]+)?$/i.test(legacyPage)) {
        const path = legacyPage.split("/").map(encodeURIComponent).join("/");
        return Response.redirect(new URL(`/spec/${path}`, opts.req.url), 302);
    }
    return { title: "Specification", main: await ctx.fns.spec.render({ page: "index" }) };
}
