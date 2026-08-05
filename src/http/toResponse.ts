export default function (ctx: Context, session: Session | null, opts: { value: any }): Response {
    const value = opts.value;
    if (value instanceof Response) return value;
    if (typeof value === "string" && (ctx as any).layout) return page(ctx, session, { main: value });
    if (value && typeof value === "object" && typeof value.main === "string" && (ctx as any).layout) {
        const { status, ...layout } = value;
        return page(ctx, session, layout, status ?? 200);
    }
    return new Response(JSON.stringify(value ?? null), {
        status: 200,
        headers: { "content-type": "application/json" },
    });
}

function page(ctx: Context, session: Session | null, opts: any, status = 200): Response {
    const partial = session?.req?.headers.get("hx-request") === "true";
    const body = partial ? opts.main : ctx.layout(opts);
    return new Response(body, {
        status,
        headers: { "content-type": "text/html; charset=utf-8" },
    });
}
