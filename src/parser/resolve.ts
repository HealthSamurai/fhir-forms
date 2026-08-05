
export default function (
    _ctx: Context,
    _session: Session | null,
    opts: { questionnaire: any; path: string; tokens: { steps: Array<{ linkId: string; index: number | null }>; components: string[] } }
) {
    const issue = (code: string, message: string) => ({ ok: false as const, issue: { code, path: opts.path, message } });
    const questionnaire = opts.questionnaire;
    if (!questionnaire || questionnaire.resourceType !== "Questionnaire") {
        return issue("questionnaire.invalid", "A Questionnaire resource is required");
    }

    let children = Array.isArray(questionnaire.item) ? questionnaire.item : [];
    const steps: Array<{ linkId: string; index: number | null; definition: any }> = [];

    for (const token of opts.tokens.steps) {
        const matches = children.filter((candidate: any) => candidate?.linkId === token.linkId);
        if (matches.length === 0) return issue("path.unknown-item", "Unknown item or incorrect parent: " + token.linkId);
        if (matches.length > 1) return issue("questionnaire.duplicate-linkId", "Questionnaire contains duplicate sibling linkId: " + token.linkId);
        const definition = matches[0];
        const repeats = definition.repeats === true;
        if (repeats && token.index === null) {
            return issue("cardinality.index-required", "Repeating item requires an occurrence index: " + token.linkId);
        }
        if (!repeats && token.index !== null) {
            return issue("cardinality.index-forbidden", "Non-repeating item cannot have an occurrence index: " + token.linkId);
        }
        steps.push({ ...token, definition });
        children = Array.isArray(definition.item) ? definition.item : [];
    }

    const leaf = steps[steps.length - 1]?.definition;
    if (!leaf) return issue("path.invalid-syntax", "Path contains no item");
    if (leaf.type === "group" || leaf.type === "display") {
        return issue("path.not-an-answer", "Group and display items cannot receive answer values");
    }

    if (opts.tokens.components.length > 0) {
        const component = opts.tokens.components.join(".");
        const allowed: Record<string, Set<string>> = {
            choice: new Set(["system", "version", "code", "display", "userSelected"]),
            coding: new Set(["system", "version", "code", "display", "userSelected"]),
            "open-choice": new Set(["system", "version", "code", "display", "userSelected"]),
            quantity: new Set(["value", "comparator", "unit", "system", "code"]),
            reference: new Set(["reference", "type", "identifier.system", "identifier.value", "display"]),
            attachment: new Set(["contentType", "language", "url", "title", "creation"]),
        };
        if (!allowed[leaf.type]?.has(component)) {
            return issue("path.unknown-component", "Component " + component + " is not valid for item type " + leaf.type);
        }
    }

    return { ok: true as const, steps, components: opts.tokens.components, definition: leaf };
}
