import { beforeAll, describe, expect, test } from "bun:test";
import { bootRegistry } from "../$main";

let ctx: Context;

beforeAll(async () => {
    ctx = await bootRegistry();
});

const questionnaire = {
    resourceType: "Questionnaire",
    id: "agent-scaffold",
    url: "https://example.org/Questionnaire/agent-scaffold",
    version: "1.0.0",
    title: "Agent scaffold",
    status: "active",
    item: [{
        linkId: "visit",
        type: "group",
        item: [
            { linkId: "date", type: "date", required: true },
            {
                linkId: "weight",
                type: "quantity",
                extension: [{
                    url: "http://hl7.org/fhir/StructureDefinition/questionnaire-unitOption",
                    valueCoding: {
                        system: "http://unitsofmeasure.org",
                        code: "kg",
                        display: "kg",
                    },
                }],
            },
            {
                linkId: "diagnosis",
                type: "choice",
                repeats: true,
                answerOption: [{
                    valueCoding: {
                        system: "http://snomed.info/sct",
                        code: "44054006",
                        display: "Diabetes mellitus type 2",
                    },
                }],
            },
        ],
    }],
};

describe("Questionnaire form scaffold generator", () => {
    test("builds encoded canonical paths", () => {
        expect(ctx.fns.generator.path({
            parent: "item[visit][0]",
            linkId: "diagnosis]primary",
            occurrence: 1,
        })).toBe("item[visit][0].item[diagnosis%5Dprimary][1]");
    });

    test("generates deterministic editable HTML", () => {
        const first = ctx.fns.generator.generate({ questionnaire, action: "/responses" });
        const second = ctx.fns.generator.generate({ questionnaire, action: "/responses" });

        expect(first).toEqual(second);
        expect(first.ok).toBe(true);
        if (!first.ok) return;

        expect(first.html).toContain('name="item[visit].item[date]"');
        expect(first.html).toContain('name="item[visit].item[weight].value"');
        expect(first.html).toContain('name="item[visit].item[weight].unit"');
        expect(first.html).toContain('name="item[visit].item[diagnosis][0].code"');
        expect(first.warnings.map(warning => warning.code)).toContain("repeat.first-occurrence-only");
    });

    test("renders open-choice free text with the documented component", () => {
        const result = ctx.fns.generator.generate({
            questionnaire: {
                resourceType: "Questionnaire",
                id: "open",
                status: "active",
                item: [{ linkId: "answer", type: "open-choice" }],
            },
            document: false,
        });

        expect(result.ok).toBe(true);
        if (result.ok) expect(result.html).toContain('name="item[answer].text"');
    });
});
