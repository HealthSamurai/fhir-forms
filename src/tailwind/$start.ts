export default async function (ctx: Context, _session: Session | null, _config?: {}) {
    const built = await ctx.fns.tailwind.build({ minify: ctx.env.NODE_ENV === "production" });
    ctx.fns.log.info({ event: "tailwind.ready", msg: `${built.bytes} bytes`, output: built.output });
}
