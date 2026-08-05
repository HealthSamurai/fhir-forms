
export default async function (
    ctx: Context,
    _session: Session | null,
    opts: { entries: Array<{ name: string; value: unknown }> | Array<[string, unknown]> | FormData; questionnaire: any; context?: Record<string, any> }
) {
    const issues: any[] = [];
    const addIssue = (issue: any, extra?: any) => issues.push({ ...issue, ...extra });
    const questionnaire = opts.questionnaire;
    if (!questionnaire || questionnaire.resourceType !== "Questionnaire") {
        return { ok: false as const, issues: [{ code: "questionnaire.invalid", message: "A Questionnaire resource is required" }] };
    }

    let entries: Array<{ name: string; value: unknown }>;
    if (opts.entries instanceof FormData) {
        entries = Array.from(opts.entries.entries()).map(([name, value]) => ({ name, value }));
    } else if (Array.isArray(opts.entries)) {
        entries = opts.entries.map((entry: any) => Array.isArray(entry) ? { name: entry[0], value: entry[1] } : entry);
    } else {
        return { ok: false as const, issues: [{ code: "request.invalid-entries", message: "entries must be an ordered entry list or FormData" }] };
    }

    const groups = new Map<string, { definition: any; steps: any[]; path: string; hasAtomic: boolean; atomic?: unknown; components: Map<string, unknown> }>();
    const occurrenceOrder = new Map<string, number[]>();

    for (const entry of entries) {
        if (!entry || typeof entry.name !== "string") {
            addIssue({ code: "request.invalid-entry", message: "Each entry requires a string name" });
            continue;
        }
        const tokenized = ctx.fns.parser.tokenize({ name: entry.name });
        if (!tokenized.ok) { addIssue(tokenized.issue); continue; }
        const resolved = ctx.fns.parser.resolve({ questionnaire, path: entry.name, tokens: tokenized });
        if (!resolved.ok) { addIssue(resolved.issue); continue; }

        const plainSteps = resolved.steps.map((step: any) => ({ linkId: step.linkId, index: step.index }));
        for (let i = 0; i < resolved.steps.length; i++) {
            const step = resolved.steps[i]!;
            if (step.definition.repeats !== true) continue;
            const scope = JSON.stringify(plainSteps.slice(0, i)) + "/" + step.linkId;
            const order = occurrenceOrder.get(scope) ?? [];
            const occurrence = step.index as number;
            if (!order.includes(occurrence)) {
                if (occurrence !== order.length) {
                    addIssue({ code: "cardinality.sparse-index", path: entry.name, linkId: step.linkId, message: "Expected occurrence index " + order.length + " but received " + occurrence });
                } else {
                    order.push(occurrence);
                    occurrenceOrder.set(scope, order);
                }
            }
        }

        const groupKey = JSON.stringify(plainSteps);
        let group = groups.get(groupKey);
        if (!group) {
            group = { definition: resolved.definition, steps: plainSteps, path: entry.name, hasAtomic: false, components: new Map() };
            groups.set(groupKey, group);
        }
        const component = resolved.components.join(".");
        if (component === "") {
            if (group.hasAtomic) {
                addIssue({ code: "cardinality.duplicate-field", path: entry.name, linkId: resolved.definition.linkId, message: "Duplicate atomic answer field" });
            } else {
                group.hasAtomic = true;
                group.atomic = entry.value;
            }
        } else if (group.components.has(component)) {
            addIssue({ code: "cardinality.duplicate-field", path: entry.name, linkId: resolved.definition.linkId, message: "Duplicate answer component: " + component });
        } else {
            group.components.set(component, entry.value);
        }
    }

    const typedAnswers: any[] = [];
    for (const group of groups.values()) {
        const parsed = await ctx.fns.parser.parseAnswer({
            definition: group.definition,
            hasAtomic: group.hasAtomic,
            atomic: group.atomic,
            components: Object.fromEntries(group.components),
        });
        if (!parsed.ok) {
            addIssue(parsed.issue, { path: group.path, linkId: group.definition.linkId, occurrences: group.steps.map(step => step.index).filter(index => index !== null) });
        } else if (!("empty" in parsed)) {
            typedAnswers.push({ steps: group.steps, valueKey: parsed.valueKey, value: parsed.value });
        }
    }

    if (issues.length > 0) {
        issues.sort((a, b) => String(a.path ?? "").localeCompare(String(b.path ?? "")) || String(a.code).localeCompare(String(b.code)));
        return { ok: false as const, issues };
    }

    const materialized = ctx.fns.parser.materialize({ questionnaire, answers: typedAnswers });
    if (materialized.issues.length > 0) return { ok: false as const, issues: materialized.issues };

    const context = opts.context ?? {};
    const canonical = context.questionnaire ?? (questionnaire.url
        ? questionnaire.url + (questionnaire.version ? "|" + questionnaire.version : "")
        : questionnaire.id ? "Questionnaire/" + questionnaire.id : undefined);
    if (!canonical) {
        return { ok: false as const, issues: [{ code: "context.questionnaire-required", message: "Questionnaire canonical or id is required" }] };
    }

    const response: any = {
        resourceType: "QuestionnaireResponse",
        status: context.status ?? "in-progress",
        questionnaire: canonical,
    };
    for (const key of ["id", "subject", "encounter", "author", "authored"] as const) {
        if (context[key] !== undefined) response[key] = context[key];
    }
    if (materialized.item.length > 0) response.item = materialized.item;
    return { ok: true as const, response };
}
