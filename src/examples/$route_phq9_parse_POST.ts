const ANSWER_SYSTEM = "http://loinc.org";
const weights = new Map([
    ["LA6568-5", 0],
    ["LA6569-3", 1],
    ["LA6570-1", 2],
    ["LA6571-9", 3],
]);

export default async function (ctx: Context, _session: Session | null, opts: { req: Request }) {
    const form = await opts.req.formData();
    const selected = ctx.fns.examples.getCase({ id: "phq9" }) as any;
    const issues: any[] = [];
    let score = 0;
    let hasSymptoms = false;

    for (let index = 1; index <= 9; index += 1) {
        const path = `item[q${index}]`;
        const codes = form.getAll(`${path}.code`).map(String);
        const systems = form.getAll(`${path}.system`).map(String);
        const weight = codes.length === 1 ? weights.get(codes[0]!) : undefined;
        if (codes.length !== 1 || systems.length !== 1 || systems[0] !== ANSWER_SYSTEM || weight === undefined) {
            issues.push({
                code: "phq9.answer.invalid",
                message: `Question ${index} requires exactly one permitted coded answer`,
                path,
                linkId: `q${index}`,
                occurrences: [],
            });
            continue;
        }
        score += weight;
        hasSymptoms ||= weight > 0;
    }

    if (issues.length > 0) return await ctx.fns.examples.card({ example: "phq9", result: { ok: false, issues } });

    const entries = Array.from(form.entries())
        .filter(([name]) => name.startsWith("item["))
        .filter(([name]) => name !== "item[total]" && name !== "item[severity]")
        .filter(([name]) => hasSymptoms || !name.startsWith("item[impact]"))
        .map(([name, value]) => ({ name, value }));
    entries.push({ name: "item[total]", value: String(score) });
    entries.push({ name: "item[severity]", value: severity(score) });

    const result = await ctx.fns.parser.parse({
        entries,
        questionnaire: selected.questionnaire,
        context: { status: "completed", authored: new Date().toISOString() },
    });
    return await ctx.fns.examples.card({ example: "phq9", result });
}

function severity(score: number) {
    if (score < 5) return "Minimal";
    if (score < 10) return "Mild";
    if (score < 15) return "Moderate";
    if (score < 20) return "Moderately severe";
    return "Severe";
}
