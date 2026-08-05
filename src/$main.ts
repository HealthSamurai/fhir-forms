import { resolve } from "node:path";

export function makeCtx(): Context {
    const ctx: any = { env: { ...process.env }, state: { serverStart: Date.now(), registry: {} }, routes: {}, session: null };
    Object.defineProperty(ctx, "fns", { get() { return wrapFns(this, this.state.registry); } });
    return ctx as Context;
}

function wrapFns(ctx: any, node: any): any {
    return new Proxy(node, { get(target, property) {
        const value = target[property as any];
        if (typeof value === "function") return (opts?: any) => value(ctx, ctx.session, opts);
        if (value && typeof value === "object") return wrapFns(ctx, value);
        return value;
    }});
}

export function makeRequestCtx(base: Context, session: Session): Context {
    const child: any = Object.create(base);
    child.session = session;
    return child as Context;
}

export async function boot(opts?: { root?: string }): Promise<Context> {
    const ctx = makeCtx();
    ctx.state.root = opts?.root ?? resolve(import.meta.dir, "..");
    const { default: loadFns } = await import("./loadFns");
    await loadFns(ctx, null, {});
    const lint = await ctx.fns.dev.lint({});
    if (!lint.ok) throw new Error(lint.errors.join("\n"));
    await ctx.genTypes({});
    await ctx.fns.http.loadRoutes({});
    await ctx.fns.lifecycle.start({});
    const shutdown = async (signal: string) => {
        console.log("\n[" + signal + "] shutting down");
        await ctx.fns.lifecycle.stop({});
        process.exit(0);
    };
    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    if (ctx.env.WATCH) await ctx.fns.dev.watch({});
    return ctx;
}

export default boot;

export async function bootRegistry(opts?: { root?: string }): Promise<Context> {
    const ctx = makeCtx();
    ctx.state.root = opts?.root ?? resolve(import.meta.dir, "..");
    const { default: loadFns } = await import("./loadFns");
    const log = console.log;
    console.log = () => {};
    try { await loadFns(ctx, null, {}); } finally { console.log = log; }
    return ctx;
}

if (import.meta.main) {
    const ctx = await boot();
    (globalThis as any).ctx = ctx;
}
