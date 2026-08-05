export default function (ctx: Context, _session: Session | null, _opts?: {}) {
    const procedures = ctx.fns.examples.cases as any;
    return ctx.fns.examples.caseIds({}).map(id => procedures[id]({}));
}
