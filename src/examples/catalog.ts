export default function (ctx: Context, _session: Session | null, _opts?: {}) {
    const procedures = ctx.fns.examples.cases as any;
    const showcase = new Set([
        "decisionSupport",
        "orderComposer",
        "vitals",
        "phq9",
        "bodyMap",
        "medicationSentence",
        "adaptiveIntake",
    ]);

    return ctx.fns.examples.caseIds({}).map(id => {
        const example = procedures[id]({});
        return showcase.has(id) ? { ...example, group: "Showcase" } : example;
    });
}
