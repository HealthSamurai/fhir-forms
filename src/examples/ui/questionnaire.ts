export default function (_ctx: Context, _session: Session | null, opts: { name: string; item: any[] }) {
    return {
        resourceType: "Questionnaire",
        url: `https://example.org/Questionnaire/${opts.name}`,
        version: "0.1.0",
        status: "active",
        item: opts.item,
    };
}
