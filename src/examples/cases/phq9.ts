const ANSWER_SYSTEM = "http://loinc.org";
const ITEM_WEIGHT = "http://hl7.org/fhir/StructureDefinition/itemWeight";
const CALCULATED_EXPRESSION = "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-calculatedExpression";
const ENABLE_WHEN_EXPRESSION = "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-enableWhenExpression";

const answers = [
    { code: "LA6568-5", label: "Not at all", score: 0 },
    { code: "LA6569-3", label: "Several days", score: 1 },
    { code: "LA6570-1", label: "More than half", score: 2 },
    { code: "LA6571-9", label: "Nearly every day", score: 3 },
];

const questions = [
    { linkId: "q1", code: "44250-9", text: "Little interest or pleasure in doing things" },
    { linkId: "q2", code: "44255-8", text: "Feeling down, depressed, or hopeless" },
    { linkId: "q3", code: "44259-0", text: "Trouble falling or staying asleep, or sleeping too much" },
    { linkId: "q4", code: "44254-1", text: "Feeling tired or having little energy" },
    { linkId: "q5", code: "44251-7", text: "Poor appetite or overeating" },
    { linkId: "q6", code: "44258-2", text: "Feeling bad about yourself, or that you are a failure" },
    { linkId: "q7", code: "44252-5", text: "Trouble concentrating on things" },
    { linkId: "q8", code: "44253-3", text: "Moving or speaking slowly, or being unusually restless" },
    { linkId: "q9", code: "44260-8", text: "Thoughts that you would be better off dead or of hurting yourself" },
];

export default function (ctx: Context, _session: Session | null, _opts?: {}) {
    const ui = ctx.fns.examples.ui;
    const initialScores = [1, 1, 0, 1, 0, 0, 0, 0, 0];
    const rows = questions.map((question, index) => renderQuestion(question, index, initialScores[index]!)).join("\n");
    const impactOptions = [
        ["not-difficult", "Not difficult"],
        ["somewhat-difficult", "Somewhat difficult"],
        ["very-difficult", "Very difficult"],
        ["extremely-difficult", "Extremely difficult"],
    ].map(([code, label], index) => `<label class="cursor-pointer">
  <input class="peer sr-only" type="radio" name="item[impact].code" value="${code}"${index === 1 ? " checked" : ""} required>
  <span class="grid min-h-12 place-items-center rounded-lg bg-[#f1f6f3] px-3 py-2 text-center text-xs font-bold leading-tight text-muted transition hover:bg-[#e6f1ec] peer-checked:bg-teal peer-checked:text-white">${label}</span>
</label>`).join("\n");

    const form = `<form data-phq9>
  <input type="hidden" name="_example" value="phq9">
  <section class="overflow-hidden rounded-2xl bg-white shadow-[0_18px_50px_rgba(25,62,50,.10)] ring-1 ring-teal/10">
    <header class="grid gap-5 bg-[linear-gradient(120deg,#e9f6f1_0%,#fff8eb_100%)] px-5 py-5 lg:grid-cols-[minmax(0,1fr)_14rem] lg:items-end sm:px-6">
      <div>
        <p class="font-mono text-[.6rem] font-bold uppercase tracking-[.16em] text-coral">Compiled client rules</p>
        <h2 class="mt-1 text-3xl font-bold tracking-[-.05em]">PHQ-9</h2>
        <p class="mt-2 max-w-2xl text-sm leading-relaxed text-muted">Over the last two weeks, how often have you been bothered by the following problems?</p>
      </div>
      <div class="rounded-xl bg-white/80 p-3 shadow-sm ring-1 ring-teal/10" aria-live="polite">
        <div class="flex items-end justify-between gap-3">
          <div><span class="font-mono text-[.55rem] font-black uppercase tracking-[.16em] text-muted">Live score</span><output data-phq-total class="mt-1 block text-3xl font-black tracking-[-.05em]">3 / 27</output></div>
          <output data-phq-severity class="pb-1 text-right text-xs font-bold text-teal-dark">Minimal</output>
        </div>
        <progress data-phq-progress class="mt-2 h-1.5 w-full accent-teal" max="27" value="3">3</progress>
      </div>
    </header>
    <div class="divide-y divide-ink/10">${rows}</div>
    <fieldset data-phq-impact class="border-0 bg-[#f4f8f6] p-5 sm:p-6">
      <input type="hidden" name="item[impact].system" value="https://example.org/CodeSystem/phq9-impact">
      <legend class="float-left mb-3 w-full text-sm font-bold text-ink">How difficult have these problems made it to work, take care of things, or get along with people?</legend>
      <div class="clear-both grid grid-cols-2 gap-2 lg:grid-cols-4">${impactOptions}</div>
    </fieldset>
  </section>
  <div class="mt-3 flex flex-wrap items-center justify-between gap-4">
    <small class="max-w-2xl font-mono text-[.62rem] leading-relaxed text-muted">Preview is client-only. The server discards posted calculated fields and recomputes them before collection. Demonstration only; not a diagnostic or safety workflow.</small>
    <button class="${ui.styles({}).button}" type="submit" hx-post="/examples/phq9/parse" hx-include="closest form" hx-target="#example-phq9" hx-swap="outerHTML">Materialize response</button>
  </div>
</form>`;

    const questionnaire: any = ui.questionnaire({
        name: "phq9-presentation-example",
        item: [
            ...questions.map(question => ({
                linkId: question.linkId,
                type: "choice",
                text: question.text,
                required: true,
                code: [{ system: ANSWER_SYSTEM, code: question.code }],
                answerOption: answers.map(answer => ({
                    valueCoding: { system: ANSWER_SYSTEM, code: answer.code, display: answer.label },
                    extension: [{ url: ITEM_WEIGHT, valueDecimal: answer.score }],
                })),
            })),
            {
                linkId: "impact",
                type: "choice",
                text: "Functional impact",
                extension: [{
                    url: ENABLE_WHEN_EXPRESSION,
                    valueExpression: {
                        language: "text/fhirpath",
                        expression: "%resource.item.where(linkId.matches('q[1-9]')).answer.value.where(code != 'LA6568-5').exists()",
                    },
                }],
                answerOption: [
                    ["not-difficult", "Not difficult"],
                    ["somewhat-difficult", "Somewhat difficult"],
                    ["very-difficult", "Very difficult"],
                    ["extremely-difficult", "Extremely difficult"],
                ].map(([code, display]) => ({ valueCoding: { system: "https://example.org/CodeSystem/phq9-impact", code, display } })),
            },
            {
                linkId: "total",
                type: "integer",
                text: "PHQ-9 total score",
                readOnly: true,
                code: [{ system: ANSWER_SYSTEM, code: "44261-6" }],
                extension: [{
                    url: CALCULATED_EXPRESSION,
                    valueExpression: {
                        language: "text/fhirpath",
                        expression: "%resource.item.where(linkId.matches('q[1-9]')).answer.value.weight().sum()",
                    },
                }],
            },
            {
                linkId: "severity",
                type: "string",
                text: "Score band",
                readOnly: true,
                extension: [{
                    url: CALCULATED_EXPRESSION,
                    valueExpression: {
                        language: "text/fhirpath",
                        expression: "iif(%total < 5, 'Minimal', iif(%total < 10, 'Mild', iif(%total < 15, 'Moderate', iif(%total < 20, 'Moderately severe', 'Severe'))))",
                    },
                }],
            },
        ],
    });
    questionnaire.meta = { profile: ["http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-behave"] };
    questionnaire.copyright = "PHQ-9 is copyrighted by Pfizer Inc.; no permission is required to reproduce, translate, display, or distribute it.";

    return {
        id: "phq9",
        group: "Bespoke presentation",
        title: "PHQ-9 reactive score",
        badge: "FHIRPath -> JS",
        description: "A compact clinical matrix with a compiled score preview, conditional functional-impact question, and authoritative server recomputation.",
        questionnaire,
        form,
    };
}

function renderQuestion(question: typeof questions[number], index: number, initialScore: number) {
    const choices = answers.map(answer => `<label class="cursor-pointer p-1.5">
  <input class="peer sr-only" data-phq-score="${answer.score}" type="radio" name="item[${question.linkId}].code" value="${answer.code}"${answer.score === initialScore ? " checked" : ""} required>
  <span class="grid min-h-11 place-items-center rounded-lg px-2 py-2 text-center text-[.68rem] font-bold leading-tight text-muted transition hover:bg-teal-soft peer-checked:bg-teal peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-teal">${answer.label}</span>
</label>`).join("\n");
    return `<section class="grid min-w-0 lg:grid-cols-[minmax(15rem,1.15fr)_minmax(26rem,1fr)]">
  <input type="hidden" name="item[${question.linkId}].system" value="${ANSWER_SYSTEM}">
  <div class="flex gap-3 bg-[#fffefa] px-4 py-3 lg:items-center lg:px-5">
    <span class="grid size-6 shrink-0 place-items-center rounded-full bg-teal-soft font-mono text-[.62rem] font-black text-teal-dark">${index + 1}</span>
    <p class="text-sm font-semibold leading-snug${question.linkId === "q9" ? " text-[#8f3f31]" : ""}">${question.text}</p>
  </div>
  <div class="grid grid-cols-2 bg-white sm:grid-cols-4">${choices}</div>
</section>`;
}
