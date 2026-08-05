
export default async function (
    _ctx: Context,
    _session: Session | null,
    opts: { definition: any; hasAtomic: boolean; atomic?: unknown; components: Record<string, unknown> }
) {
    const fail = (code: string, message: string) => ({ ok: false as const, issue: { code, message } });
    const type = opts.definition?.type;
    const components = Object.fromEntries(
        Object.entries(opts.components ?? {}).filter(([, value]) => !(typeof value === "string" && value === ""))
    );
    let hasAtomic = opts.hasAtomic && !(typeof opts.atomic === "string" && opts.atomic === "");
    const atomic = opts.atomic;
    const componentCount = Object.keys(components).length;

    if (!hasAtomic && componentCount === 0) return { ok: true as const, empty: true as const };
    if (!hasAtomic && opts.definition?.required !== true) {
        const missingPrimaryComponent =
            (["choice", "coding", "open-choice"].includes(type) && components.code === undefined) ||
            (type === "quantity" && components.value === undefined) ||
            (type === "reference" && components.reference === undefined && components["identifier.value"] === undefined) ||
            (type === "attachment" && components.url === undefined);
        if (missingPrimaryComponent) return { ok: true as const, empty: true as const };
    }
    if (hasAtomic && componentCount > 0 && type !== "attachment") {
        return fail("value.conflicting-representations", "Atomic and component values cannot be mixed");
    }

    const requireText = (): string | null => typeof atomic === "string" ? atomic : null;
    const lexical = (valueKey: string, value: unknown) => ({ ok: true as const, valueKey, value });
    const invalid = (expected: string) => fail("value.invalid-lexical-form", "Expected " + expected);
    const parseBoolean = (raw: unknown): boolean | null => raw === "true" ? true : raw === "false" ? false : null;
    const parseDecimal = (raw: unknown): number | null => {
        if (typeof raw !== "string" || !/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?$/.test(raw)) return null;
        const value = Number(raw);
        return Number.isFinite(value) ? value : null;
    };
    const validDate = (raw: string): boolean => {
        const match = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(raw);
        if (!match) return false;
        if (!match[2]) return true;
        const month = Number(match[2]);
        if (month < 1 || month > 12) return false;
        if (!match[3]) return true;
        const day = Number(match[3]);
        return day >= 1 && day <= new Date(Date.UTC(Number(match[1]), month, 0)).getUTCDate();
    };
    const splitCoding = (raw: string): string[] | null => {
        const out: string[] = [];
        let current = "";
        let escaped = false;
        for (const char of raw) {
            if (escaped) {
                if (char !== "|" && char !== "\\") return null;
                current += char;
                escaped = false;
            } else if (char === "\\") escaped = true;
            else if (char === "|") { out.push(current); current = ""; }
            else current += char;
        }
        if (escaped) return null;
        out.push(current);
        return out.length === 2 || out.length === 3 ? out : null;
    };
    const coding = (source: Record<string, unknown>) => {
        if (typeof source.code !== "string" || source.code === "") return fail("value.incomplete-complex-type", "Coding.code is required");
        if (typeof source.system !== "string" || source.system === "") return fail("value.incomplete-complex-type", "Coding.system is required");
        const value: Record<string, unknown> = { system: source.system, code: source.code };
        for (const key of ["version", "display"] as const) {
            if (typeof source[key] === "string" && source[key] !== "") value[key] = source[key];
        }
        if (source.userSelected !== undefined) {
            const parsed = parseBoolean(source.userSelected);
            if (parsed === null) return invalid("true or false for Coding.userSelected");
            value.userSelected = parsed;
        }
        return lexical("valueCoding", value);
    };

    if (["string", "text"].includes(type)) {
        const raw = requireText();
        return raw === null ? invalid("text") : lexical("valueString", raw);
    }
    if (type === "boolean") {
        const value = parseBoolean(atomic);
        return value === null ? invalid("true or false") : lexical("valueBoolean", value);
    }
    if (type === "integer") {
        const raw = requireText();
        if (raw === null || !/^-?(?:0|[1-9][0-9]*)$/.test(raw)) return invalid("FHIR integer");
        const value = Number(raw);
        return Number.isSafeInteger(value) ? lexical("valueInteger", value) : invalid("safe FHIR integer");
    }
    if (type === "decimal") {
        const value = parseDecimal(atomic);
        return value === null ? invalid("FHIR decimal") : lexical("valueDecimal", value);
    }
    if (type === "date") {
        const raw = requireText();
        return raw !== null && validDate(raw) ? lexical("valueDate", raw) : invalid("FHIR date");
    }
    if (type === "dateTime") {
        const raw = requireText();
        const pattern = /^\d{4}(?:-(?:0[1-9]|1[0-2])(?:-(?:0[1-9]|[12][0-9]|3[01])(?:T(?:[01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](?:\.[0-9]+)?(?:Z|[+-](?:[01][0-9]|2[0-3]):[0-5][0-9]))?)?)?$/;
        return raw !== null && pattern.test(raw) ? lexical("valueDateTime", raw) : invalid("FHIR dateTime");
    }
    if (type === "time") {
        const raw = requireText();
        return raw !== null && /^(?:[01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](?:\.[0-9]+)?$/.test(raw)
            ? lexical("valueTime", raw) : invalid("FHIR time");
    }
    if (type === "url") {
        const raw = requireText();
        return raw !== null && !/[\s]/.test(raw) ? lexical("valueUri", raw) : invalid("FHIR uri without whitespace");
    }
    if (type === "open-choice" && hasAtomic) {
        const raw = requireText();
        return raw === null ? invalid("open-choice text") : lexical("valueString", raw);
    }
    if (type === "choice" || type === "coding" || type === "open-choice") {
        if (hasAtomic) {
            const raw = requireText();
            if (raw === null) return invalid("atomic Coding");
            const parts = splitCoding(raw);
            if (!parts) return fail("value.invalid-coding-sugar", "Expected system|code|display with \\ escaping");
            return coding({ system: parts[0], code: parts[1], display: parts[2] });
        }
        return coding(components);
    }
    if (type === "quantity") {
        const value = parseDecimal(components.value);
        if (value === null) return fail("value.incomplete-complex-type", "Quantity.value is required and must be a FHIR decimal");
        if (components.comparator !== undefined && !["<", "<=", ">=", ">"].includes(String(components.comparator))) {
            return invalid("FHIR Quantity comparator");
        }
        const quantity: Record<string, unknown> = { value };
        for (const key of ["comparator", "unit", "system", "code"] as const) {
            if (components[key] !== undefined) quantity[key] = components[key];
        }
        return lexical("valueQuantity", quantity);
    }
    if (type === "reference") {
        if (!components.reference && !components["identifier.value"]) {
            return fail("value.incomplete-complex-type", "Reference.reference or identifier.value is required");
        }
        const reference: Record<string, unknown> = {};
        for (const key of ["reference", "type", "display"] as const) {
            if (components[key] !== undefined) reference[key] = components[key];
        }
        if (components["identifier.value"] !== undefined) {
            reference.identifier = { value: components["identifier.value"] };
            if (components["identifier.system"] !== undefined) (reference.identifier as any).system = components["identifier.system"];
        }
        return lexical("valueReference", reference);
    }
    if (type === "attachment") {
        const attachment: Record<string, unknown> = {};
        if (hasAtomic) {
            if (!(atomic instanceof Blob)) return invalid("uploaded file for Attachment");
            const bytes = new Uint8Array(await atomic.arrayBuffer());
            attachment.data = Buffer.from(bytes).toString("base64");
            if (atomic.type) attachment.contentType = atomic.type;
            if (atomic instanceof File && atomic.name) attachment.title = atomic.name;
        }
        for (const key of ["contentType", "language", "url", "title", "creation"] as const) {
            if (components[key] !== undefined) {
                if (key === "contentType" && attachment.contentType && attachment.contentType !== components[key]) {
                    return fail("value.conflicting-representations", "Attachment content types conflict");
                }
                attachment[key] = components[key];
            }
        }
        if (!attachment.data && !attachment.url) return fail("value.incomplete-complex-type", "Attachment file or url is required");
        return lexical("valueAttachment", attachment);
    }

    return fail("questionnaire.unsupported-type", "Unsupported Questionnaire item type: " + type);
}
