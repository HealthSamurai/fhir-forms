export type GeneratorWarning = {
    code: string;
    path: string;
    message: string;
};

export type RenderedItem = {
    html: string;
    warnings: GeneratorWarning[];
};

export default function (
    ctx: Context,
    _session: Session | null,
    opts: { item: any; parent?: string; depth?: number },
): RenderedItem {
    const item = opts.item ?? {};
    const depth = opts.depth ?? 0;
    const indent = "  ".repeat(depth);
    const warnings: GeneratorWarning[] = [];
    const linkId = typeof item.linkId === "string" ? item.linkId : "";
    const type = typeof item.type === "string" ? item.type : "";
    const occurrence = item.repeats === true ? 0 : undefined;
    const path = linkId
        ? ctx.fns.generator.path({ parent: opts.parent, linkId, occurrence })
        : opts.parent ?? "item[unknown]";
    const escape = (value: unknown) => ctx.fns.generator.escape({ value });
    const label = escape(item.text || linkId || "Unnamed item");
    const field = escape(path);
    const id = "ff-" + path.replace(/[^A-Za-z0-9_-]+/g, "-").replace(/-+$/g, "");
    const required = item.required === true ? " required" : "";

    if (!linkId || !type) {
        warnings.push({
            code: "questionnaire.invalid-item",
            path,
            message: "Every generated item requires linkId and type",
        });
        return {
            html: indent + "<!-- TODO invalid Questionnaire item: linkId and type are required -->",
            warnings,
        };
    }

    if (item.repeats === true) {
        warnings.push({
            code: "repeat.first-occurrence-only",
            path,
            message: "The scaffold renders occurrence 0; add/remove UI must preserve contiguous indexes",
        });
    }
    if (Array.isArray(item.enableWhen) && item.enableWhen.length > 0) {
        warnings.push({
            code: "runtime.enable-when",
            path,
            message: "Wire enableWhen through the Reactive Runtime before publication",
        });
    }
    if (hasExtension(item, "calculatedExpression")) {
        warnings.push({
            code: "runtime.calculated",
            path,
            message: "Compile or server-render this calculated item before publication",
        });
    }

    if (type === "display") {
        return {
            html: indent + '<p class="ff-display" data-field="' + field + '">' + label + "</p>",
            warnings,
        };
    }

    if (type === "group") {
        const children = Array.isArray(item.item) ? item.item : [];
        if (children.length === 0) {
            warnings.push({
                code: "questionnaire.empty-group",
                path,
                message: "The group has no child items",
            });
        }
        const rendered = children.map((child: any) =>
            ctx.fns.generator.renderItem({ item: child, parent: path, depth: depth + 1 })
        );
        for (const child of rendered) warnings.push(...child.warnings);
        const repeatNote = item.repeats === true
            ? indent + "  <!-- Repeat this fieldset with contiguous indexes [0], [1], ... -->\n"
            : "";
        return {
            html: [
                indent + '<fieldset class="ff-group" data-field="' + field + '"' +
                    (item.repeats === true ? ' data-repeat="true"' : "") + ">",
                indent + "  <legend>" + label + "</legend>",
                repeatNote + rendered.map(result => result.html).join("\n"),
                indent + "</fieldset>",
            ].join("\n"),
            warnings,
        };
    }

    const initial = initialValue(item);
    let control = "";

    if (item.readOnly === true) {
        control = [
            indent + '<div class="ff-field" data-field="' + field + '" data-type="' + escape(type) + '">',
            indent + "  <span>" + label + "</span>",
            indent + '  <output id="' + escape(id) + '">' + escape(displayInitial(initial)) + "</output>",
            indent + "</div>",
        ].join("\n");
    } else if (type === "boolean") {
        control = [
            indent + '<fieldset class="ff-field ff-options" data-field="' + field + '" data-type="boolean">',
            indent + "  <legend>" + label + "</legend>",
            indent + '  <label><input type="radio" name="' + field + '" value="true"' + required + "> Yes</label>",
            indent + '  <label><input type="radio" name="' + field + '" value="false"' + required + "> No</label>",
            indent + "</fieldset>",
        ].join("\n");
    } else if (type === "text") {
        control = fieldWrapper(indent, field, type, label,
            '<textarea id="' + escape(id) + '" name="' + field + '"' + required + ">" +
            escape(typeof initial === "string" ? initial : "") + "</textarea>");
    } else if (["string", "integer", "decimal", "date", "dateTime", "time", "url"].includes(type)) {
        const htmlType: Record<string, string> = {
            string: "text",
            integer: "number",
            decimal: "number",
            date: "text",
            dateTime: "text",
            time: "text",
            url: "url",
        };
        const step = type === "integer" ? ' step="1"' : type === "decimal" ? ' step="any"' : "";
        const placeholder = type === "date"
            ? ' placeholder="YYYY, YYYY-MM, or YYYY-MM-DD"'
            : type === "dateTime"
                ? ' placeholder="FHIR dateTime with offset"'
                : type === "time"
                    ? ' placeholder="HH:MM:SS"'
                    : "";
        control = fieldWrapper(indent, field, type, label,
            '<input id="' + escape(id) + '" name="' + field + '" type="' + htmlType[type] +
            '" value="' + escape(initial ?? "") + '"' + step + placeholder + required + ">");
    } else if (type === "quantity") {
        control = renderQuantity(item, indent, path, field, id, label, required, initial, escape);
    } else if (type === "choice" || type === "coding") {
        control = renderCoding(item, indent, path, field, id, label, required, false, warnings, escape);
    } else if (type === "open-choice") {
        control = renderCoding(item, indent, path, field, id, label, required, true, warnings, escape);
    } else if (type === "reference") {
        control = fieldWrapper(indent, field, type, label,
            '<input id="' + escape(id) + '" name="' + field + '.reference" type="text"' +
            ' placeholder="ResourceType/id" value=""' + required + ">");
    } else if (type === "attachment") {
        control = fieldWrapper(indent, field, type, label,
            '<input id="' + escape(id) + '" name="' + field + '" type="file"' + required + ">");
    } else {
        warnings.push({
            code: "questionnaire.unsupported-type",
            path,
            message: "No scaffold widget is available for Questionnaire item type " + type,
        });
        control = indent + "<!-- TODO unsupported Questionnaire item type " + escape(type) +
            " at " + field + " -->";
    }

    const children = Array.isArray(item.item) ? item.item : [];
    if (children.length === 0) return { html: control, warnings };

    const renderedChildren = children.map((child: any) =>
        ctx.fns.generator.renderItem({ item: child, parent: path, depth: depth + 1 })
    );
    for (const child of renderedChildren) warnings.push(...child.warnings);
    return {
        html: [
            indent + '<section class="ff-answer-with-items" data-answer-field="' + field + '">',
            control,
            renderedChildren.map(result => result.html).join("\n"),
            indent + "</section>",
        ].join("\n"),
        warnings,
    };
}

function fieldWrapper(
    indent: string,
    field: string,
    type: string,
    label: string,
    control: string,
): string {
    return [
        indent + '<label class="ff-field" data-field="' + field + '" data-type="' + type + '">',
        indent + "  <span>" + label + "</span>",
        indent + "  " + control,
        indent + "</label>",
    ].join("\n");
}

function renderQuantity(
    item: any,
    indent: string,
    path: string,
    field: string,
    id: string,
    label: string,
    required: string,
    initial: any,
    escape: (value: unknown) => string,
): string {
    const units = unitOptions(item);
    const quantity = initial && typeof initial === "object" ? initial : {};
    const value = quantity.value ?? "";
    const currentUnit = quantity.code ?? quantity.unit ?? units[0]?.code ?? "";
    let unitControl: string;

    if (units.length === 1) {
        const unit = units[0]!;
        unitControl = '<span class="ff-unit">' + escape(unit.display || unit.code) + "</span>" +
            '<input type="hidden" name="' + field + '.unit" value="' + escape(unit.display || unit.code) + '">' +
            (unit.system ? '<input type="hidden" name="' + field + '.system" value="' + escape(unit.system) + '">' : "") +
            '<input type="hidden" name="' + field + '.code" value="' + escape(unit.code) + '">';
    } else if (units.length > 1) {
        const options = units.map(unit =>
            '<option value="' + escape(unit.code) + '"' +
            (unit.code === currentUnit ? " selected" : "") + ">" +
            escape(unit.display || unit.code) + "</option>"
        ).join("");
        unitControl = '<select name="' + field + '.unit" aria-label="' + label + ' unit">' +
            '<option value="">Unit</option>' + options + "</select>";
    } else {
        unitControl = '<input name="' + field + '.unit" type="text" placeholder="unit" aria-label="' +
            label + ' unit">';
    }

    return [
        indent + '<div class="ff-field ff-quantity" data-field="' + field + '" data-type="quantity">',
        indent + '  <label for="' + escape(id) + '">' + label + "</label>",
        indent + '  <div class="ff-compound">',
        indent + '    <input id="' + escape(id) + '" name="' + field +
            '.value" type="number" step="any" value="' + escape(value) + '"' + required + ">",
        indent + "    " + unitControl,
        indent + "  </div>",
        indent + "</div>",
    ].join("\n");
}

function renderCoding(
    item: any,
    indent: string,
    path: string,
    field: string,
    id: string,
    label: string,
    required: string,
    open: boolean,
    warnings: GeneratorWarning[],
    escape: (value: unknown) => string,
): string {
    const options = codingOptions(item);
    const systems = [...new Set(options.map(option => option.system).filter(Boolean))];
    const sameSystem = systems.length === 1 ? systems[0]! : "";
    const choiceRequired = open ? "" : required;
    let choice = "";

    if (options.length > 0 && sameSystem) {
        choice = '<input type="hidden" name="' + field + '.system" value="' + escape(sameSystem) + '">' +
            '<select id="' + escape(id) + '" name="' + field + '.code"' + choiceRequired + ">" +
            '<option value="">Select...</option>' +
            options.map(option =>
                '<option value="' + escape(option.code) + '">' +
                escape(option.display || option.code) + "</option>"
            ).join("") +
            "</select>";
    } else if (options.length > 0) {
        warnings.push({
            code: "coding.atomic-sugar",
            path,
            message: "Mixed Coding systems require the advertised atomic Coding representation or a custom widget",
        });
        choice = '<select id="' + escape(id) + '" name="' + field + '"' + choiceRequired + ">" +
            '<option value="">Select...</option>' +
            options.map(option =>
                '<option value="' + escape(codingSugar(option)) + '">' +
                escape(option.display || option.code) + "</option>"
            ).join("") +
            "</select>";
    } else {
        if (item.answerValueSet) {
            warnings.push({
                code: "terminology.widget-required",
                path,
                message: "Replace the generated Coding inputs with a terminology widget for " + item.answerValueSet,
            });
        }
        choice = '<div class="ff-compound">' +
            '<input name="' + field + '.system" type="url" placeholder="Code system">' +
            '<input id="' + escape(id) + '" name="' + field + '.code" type="text" placeholder="Code"' +
            choiceRequired + "></div>";
    }

    const freeText = open
        ? indent + '  <input name="' + field + '.text" type="text" placeholder="Other answer" aria-label="' +
            label + ' free text">\n'
        : "";

    return [
        indent + '<div class="ff-field ff-coding" data-field="' + field + '" data-type="' +
            (open ? "open-choice" : "coding") + '">',
        indent + '  <label for="' + escape(id) + '">' + label + "</label>",
        indent + "  " + choice,
        freeText.trimEnd(),
        indent + "</div>",
    ].filter(Boolean).join("\n");
}

function initialValue(item: any): any {
    const initial = Array.isArray(item.initial) ? item.initial[0] : undefined;
    if (!initial || typeof initial !== "object") return "";
    const key = Object.keys(initial).find(candidate => candidate.startsWith("value"));
    return key ? initial[key] : "";
}

function displayInitial(value: any): string {
    if (value === null || value === undefined) return "";
    if (typeof value === "object") return value.display ?? value.value ?? value.code ?? "";
    return String(value);
}

function hasExtension(item: any, suffix: string): boolean {
    return Array.isArray(item.extension) && item.extension.some(
        (extension: any) => typeof extension?.url === "string" && extension.url.includes(suffix),
    );
}

function unitOptions(item: any): Array<{ system: string; code: string; display: string }> {
    if (!Array.isArray(item.extension)) return [];
    const units: Array<{ system: string; code: string; display: string }> = [];
    for (const extension of item.extension) {
        if (typeof extension?.url !== "string" || !extension.url.includes("questionnaire-unit")) continue;
        const coding = extension.valueCoding;
        if (!coding?.code) continue;
        if (units.some(unit => unit.system === (coding.system ?? "") && unit.code === coding.code)) continue;
        units.push({
            system: coding.system ?? "",
            code: coding.code,
            display: coding.display ?? coding.code,
        });
    }
    return units;
}

function codingOptions(item: any): Array<{ system: string; code: string; display: string }> {
    if (!Array.isArray(item.answerOption)) return [];
    return item.answerOption.flatMap((option: any) => {
        const coding = option?.valueCoding;
        if (!coding?.code) return [];
        return [{
            system: coding.system ?? "",
            code: String(coding.code),
            display: coding.display ?? String(coding.code),
        }];
    });
}

function codingSugar(coding: { system: string; code: string; display: string }): string {
    const escapePart = (value: string) => value.replace(/\\/g, "\\\\").replace(/\|/g, "\\|");
    return [coding.system, coding.code, coding.display].map(escapePart).join("|");
}
