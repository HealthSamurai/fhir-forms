
export default function (
    _ctx: Context,
    _session: Session | null,
    opts: { questionnaire: any; answers: Array<{ steps: Array<{ linkId: string; index: number | null }>; valueKey: string; value: unknown }> }
) {
    const answers = opts.answers;
    const issues: any[] = [];
    const sameStep = (a: any, b: any) => a.linkId === b.linkId && a.index === b.index;
    const hasPrefix = (steps: any[], prefix: any[]) => prefix.every((step, i) => sameStep(steps[i], step));
    const encode = (value: string) => encodeURIComponent(value).replace(/[!'()*]/g, c => "%" + c.charCodeAt(0).toString(16).toUpperCase());
    const render = (steps: any[]) => steps.map((step, index) =>
        (index === 0 ? "" : ".") + "item[" + encode(step.linkId) + "]" + (step.index === null ? "" : "[" + step.index + "]")
    ).join("");

    const buildItems = (definitions: any[], prefix: any[]): any[] => {
        const output: any[] = [];
        for (const definition of definitions ?? []) {
            if (definition.type === "display") continue;
            const candidates = answers.filter(answer =>
                answer.steps.length > prefix.length &&
                hasPrefix(answer.steps, prefix) &&
                answer.steps[prefix.length]?.linkId === definition.linkId
            );
            const indexes = definition.repeats === true
                ? [...new Set(candidates.map(answer => answer.steps[prefix.length]!.index as number))].sort((a, b) => a - b)
                : candidates.length > 0 ? [null] : [];

            if (definition.type === "group") {
                const groupItems: any[] = [];
                for (const index of indexes) {
                    const path = [...prefix, { linkId: definition.linkId, index }];
                    const children = buildItems(definition.item ?? [], path);
                    if (children.length > 0) {
                        const item: any = { linkId: definition.linkId, item: children };
                        if (definition.text) item.text = definition.text;
                        groupItems.push(item);
                    }
                }
                if (definition.required === true && !definition.enableWhen?.length && groupItems.length === 0) {
                    issues.push({ code: "value.empty-required", path: render([...prefix, { linkId: definition.linkId, index: definition.repeats ? 0 : null }]), linkId: definition.linkId, message: "Required group is missing" });
                }
                output.push(...groupItems);
                continue;
            }

            const responseAnswers: any[] = [];
            for (const index of indexes) {
                const path = [...prefix, { linkId: definition.linkId, index }];
                const direct = answers.find(answer => answer.steps.length === path.length && hasPrefix(answer.steps, path));
                const children = buildItems(definition.item ?? [], path);
                if (direct || children.length > 0) {
                    const answer: any = {};
                    if (direct) answer[direct.valueKey] = direct.value;
                    if (children.length > 0) answer.item = children;
                    responseAnswers.push(answer);
                }
            }

            if (definition.required === true && !definition.enableWhen?.length && responseAnswers.length === 0) {
                issues.push({ code: "value.empty-required", path: render([...prefix, { linkId: definition.linkId, index: definition.repeats ? 0 : null }]), linkId: definition.linkId, message: "Required answer is missing" });
            }
            if (responseAnswers.length > 0) {
                const item: any = { linkId: definition.linkId, answer: responseAnswers };
                if (definition.text) item.text = definition.text;
                output.push(item);
            }
        }
        return output;
    };

    const item = buildItems(opts.questionnaire.item ?? [], []);
    return { item, issues };
}
