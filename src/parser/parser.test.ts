
import { beforeAll, describe, expect, test } from "bun:test";
import { bootRegistry } from "../$main";

let ctx: Context;

beforeAll(async () => {
    ctx = await bootRegistry();
});

const visitQuestionnaire = {
    resourceType: "Questionnaire",
    id: "clinical-visit",
    status: "active",
    item: [{
        linkId: "visit",
        type: "group",
        repeats: true,
        item: [
            { linkId: "date", type: "date" },
            { linkId: "diagnosis", type: "choice", repeats: true },
        ],
    }],
};

describe("QuestionnaireResponse parser", () => {
    test("tokenizes encoded linkId, occurrences, children, and components", () => {
        expect(ctx.fns.parser.tokenize({ name: "item[visit][0].item[diagnosis%5Dprimary][1].code" })).toEqual({
            ok: true,
            steps: [
                { linkId: "visit", index: 0 },
                { linkId: "diagnosis]primary", index: 1 },
            ],
            components: ["code"],
        });
    });

    test("materializes repeated groups and repeated Coding answers", async () => {
        const result = await ctx.fns.parser.parse({
            questionnaire: visitQuestionnaire,
            context: { status: "completed" },
            entries: [
                ["item[visit][0].item[date]", "2026-08-05"],
                ["item[visit][0].item[diagnosis][0].system", "http://snomed.info/sct"],
                ["item[visit][0].item[diagnosis][0].code", "44054006"],
                ["item[visit][0].item[diagnosis][0].display", "Diabetes mellitus type 2"],
                ["item[visit][0].item[diagnosis][1].system", "http://snomed.info/sct"],
                ["item[visit][0].item[diagnosis][1].code", "38341003"],
                ["item[visit][1].item[date]", "2026-08-12"],
            ],
        });

        expect(result).toEqual({
            ok: true,
            response: {
                resourceType: "QuestionnaireResponse",
                status: "completed",
                questionnaire: "Questionnaire/clinical-visit",
                item: [
                    {
                        linkId: "visit",
                        item: [
                            { linkId: "date", answer: [{ valueDate: "2026-08-05" }] },
                            {
                                linkId: "diagnosis",
                                answer: [
                                    { valueCoding: { system: "http://snomed.info/sct", code: "44054006", display: "Diabetes mellitus type 2" } },
                                    { valueCoding: { system: "http://snomed.info/sct", code: "38341003" } },
                                ],
                            },
                        ],
                    },
                    {
                        linkId: "visit",
                        item: [{ linkId: "date", answer: [{ valueDate: "2026-08-12" }] }],
                    },
                ],
            },
        });
    });

    test("places child items under the matching answer", async () => {
        const questionnaire = {
            resourceType: "Questionnaire",
            id: "symptoms",
            status: "active",
            item: [{
                linkId: "symptom",
                type: "string",
                repeats: true,
                item: [{ linkId: "severity", type: "string" }],
            }],
        };
        const result = await ctx.fns.parser.parse({
            questionnaire,
            entries: [
                ["item[symptom][0]", "headache"],
                ["item[symptom][0].item[severity]", "moderate"],
                ["item[symptom][1]", "nausea"],
                ["item[symptom][1].item[severity]", "mild"],
            ],
        });
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.response.item[0].answer[0]).toEqual({
                valueString: "headache",
                item: [{ linkId: "severity", answer: [{ valueString: "moderate" }] }],
            });
            expect(result.response.item[0].answer[1]).toEqual({
                valueString: "nausea",
                item: [{ linkId: "severity", answer: [{ valueString: "mild" }] }],
            });
        }
    });

    test("rejects sparse occurrence indexes", async () => {
        const result = await ctx.fns.parser.parse({
            questionnaire: visitQuestionnaire,
            entries: [["item[visit][1].item[date]", "2026-08-05"]],
        });
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.issues.map((issue: any) => issue.code)).toContain("cardinality.sparse-index");
    });

    test("rejects a child submitted without its Questionnaire parent", async () => {
        const questionnaire = {
            resourceType: "Questionnaire",
            id: "contact",
            status: "active",
            item: [{ linkId: "contact", type: "group", item: [{ linkId: "email", type: "string" }] }],
        };
        const result = await ctx.fns.parser.parse({ questionnaire, entries: [["item[email]", "a@example.org"]] });
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.issues[0].code).toBe("path.unknown-item");
    });

    test("rejects duplicate complete paths", async () => {
        const questionnaire = {
            resourceType: "Questionnaire",
            id: "age",
            status: "active",
            item: [{ linkId: "age", type: "integer" }],
        };
        const result = await ctx.fns.parser.parse({ questionnaire, entries: [["item[age]", "40"], ["item[age]", "41"]] });
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.issues.map((issue: any) => issue.code)).toContain("cardinality.duplicate-field");
    });

    test("materializes open-choice text from the canonical text component", async () => {
        const questionnaire = {
            resourceType: "Questionnaire",
            id: "open-choice",
            status: "active",
            item: [{ linkId: "answer", type: "open-choice", repeats: true }],
        };
        const result = await ctx.fns.parser.parse({
            questionnaire,
            entries: [
                ["item[answer][0].text", "Something else"],
                ["item[answer][1].system", "http://loinc.org"],
                ["item[answer][1].code", "LA6568-5"],
            ],
        });

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.response.item[0].answer).toEqual([
                { valueString: "Something else" },
                { valueCoding: { system: "http://loinc.org", code: "LA6568-5" } },
            ]);
        }
    });
});
