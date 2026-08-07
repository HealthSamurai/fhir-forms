import architecture from "../../docs/architecture.svg" with { type: "text" };

export default function (_ctx: Context, _session: Session | null, _opts: { req: Request }) {
    return new Response(architecture as unknown as string, {
        headers: {
            "content-type": "image/svg+xml; charset=utf-8",
            "cache-control": "no-cache",
        },
    });
}
