import { resolve } from "node:path";

export default function (ctx: Context, _session: Session | null, _opts: { req: Request }) {
    const path = resolve(ctx.fns.project.projectRoot({}), ".runtime/app.css");
    return new Response(Bun.file(path), {
        headers: {
            "content-type": "text/css; charset=utf-8",
            "cache-control": ctx.env.NODE_ENV === "production" ? "public, max-age=3600" : "no-cache",
        },
    });
}
