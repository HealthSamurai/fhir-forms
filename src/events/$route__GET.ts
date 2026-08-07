// GET /events — long-lived Server-Sent Events stream.
// Every page opens one; the server pushes reload / custom events down it. The
// stream doubles as presence: it begins when a tab opens and ends when it
// closes, which is a better answer to "who is here" than anything a heartbeat
// could give.
export default async function (ctx: Context, session: Session, opts: { req: Request }) {
    let cleanup = () => {};
    const stream = new ReadableStream({
        start(controller) {
            const enc = new TextEncoder();
            let closed = false;
            let unsub = () => {};
            const send = (e: any) => {
                try { controller.enqueue(enc.encode(`data: ${JSON.stringify(e)}\n\n`)); }
                catch { cleanup(); }
            };
            send({ type: "hello", serverStart: (ctx.state as any).serverStart });
            unsub = ctx.fns.events.subscribe({ handler: send });
            // The stream is also the presence: it lasts exactly as long as the tab.
            const leave = ctx.fns.events.join({});
            const keepalive = setInterval(() => {
                try { controller.enqueue(enc.encode(`: ping\n\n`)); } catch { cleanup(); }
            }, 5_000);
            cleanup = () => {
                if (closed) return;
                closed = true;
                clearInterval(keepalive);
                leave();
                unsub();
                try { controller.close(); } catch { /* already closed */ }
            };
            opts.req.signal.addEventListener("abort", cleanup, { once: true });
        },
        cancel() { cleanup(); },
    });
    return new Response(stream, {
        headers: {
            "content-type": "text/event-stream",
            "cache-control": "no-cache, no-transform",
            "connection": "keep-alive",
        },
    });
}
