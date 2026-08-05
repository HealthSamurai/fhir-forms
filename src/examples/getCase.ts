export default function (ctx: Context, _session: Session | null, opts: { id: string }) {
    const id = ctx.fns.examples.caseIds({}).find(candidate =>
        candidate === opts.id || candidate.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase() === opts.id
    );
    if (!id) return null;
    const procedures = ctx.fns.examples.cases as any;
    return procedures[id]({});
}
