export default async function (ctx: Context, _session: Session | null, _opts: { req: Request }) {
    return { title: "FHIR Forms Presentation Layer", main: await ctx.fns.spec.render({ page: "index" }) };
}
