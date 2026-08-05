# Skip logic and calculated expressions

## Skip logic and formulas: transpiled to plain JS

The exchange above re-renders the form on every change so that `enableWhen`,
`calculatedExpression` and the score are evaluated where the definition is. That
is correct and, on a long form, chatty: most keystrokes change nothing any rule
looks at.

So the server **transpiles the form's expressions into plain JavaScript** and
sends it inline with the form. No FHIRPath engine ships — no engine exists on the
client at all — and nothing has to be fetched separately.

The rule this codebase has about JavaScript is about **hand-written** code in a
template: unreviewable, untestable, invisible to the type checker. Code that is
**generated from the definition** has the same standing as the generated markup
around it — it is the form, expressed differently:

```haml
%form{ data: { form: "phq9" }, "hx-trigger": "submit" }
  -# … the questions …
  %script{ nonce: nonce }
    :plain
      (form => {
        const enable = { … }, calc = { … };     -- generated, below
        window.qform.attach(form, enable, calc);
      })(document.currentScript.closest("form"));
```

Three consequences worth stating, because each is a small rule of its own:

- **The content-security policy is closed with a nonce**, one per response, not
  with `unsafe-inline`. Inline generated code is fine; inline *arbitrary* code is
  what a policy is for.
- **Attaching must be idempotent.** The form re-renders itself on submit and on
  any field whose rule did not transpile, htmx runs the scripts in what it swaps
  in, so the same code executes again. Listeners go on the form element, which is
  replaced along with them; nothing is registered globally and nothing accumulates.
- **Size is not a problem worth solving.** PHQ-9's rules are half a kilobyte —
  cheaper to re-send with each fragment than to cache. A form whose rules are
  genuinely large, opened on page after page, can have the same generated text
  served at a versioned URL instead; that is an optimisation, not the design.

### What the transpiler emits

Paths are resolved **at compile time**: the transpiler knows every `linkId`, so
`%resource.repeat(item).where(linkId = 'q1').answer.value` becomes a read of one
field. Nothing on the client assembles a QuestionnaireResponse, and nothing walks
a FHIRPath tree:

```js
// generated from http://ex/Questionnaire/phq9@1.0.0 — inline with the form
export const enable = {
    "why":   v => v("item[mood].code")[0] === "bad",
    "packs": v => v("item[smoke]").length > 0 && Number(v("item[age]")[0]) > 18,
};

export const calc = {
    "total": v => ["q1","q2","q3","q4","q5","q6","q7","q8","q9"]
        .reduce((n, q) => n + ordinal(v, `item/${q}:code`), 0),
};
```

`v(field)` is the values of that field as the DOM has them right now — the same
names the body would carry. That is the whole interface between the generated
module and the page.

### What it buys and what it costs

- **Nothing FHIR-shaped reaches the browser**: no engine, no response assembly, no
  expression parsing. The generated file is small, readable and cacheable per
  form version.
- **No `eval` and no engine**: the code is written out by the server, not built in
  the browser, so the policy needs a nonce and nothing else.
- **The transpiler may refuse.** What it cannot express — terminology calls
  (`memberOf`), expressions over other resources, rules reaching across rows of a
  repeating group — is simply not in the module, and those fields keep their
  `hx-trigger`. A form where nothing transpiles behaves exactly as it does today.
- **The server is still the authority.** Every rule is re-evaluated when the
  answer is collected, so a browser that shows a hidden question cannot make it
  answered, and a browser that displays a total cannot make it stored — the score
  is `readOnly` and has no field in the body at all.
- **The cost is a second evaluator**, and it is paid with a test rather than with
  discipline: for every form, evaluate its expressions server-side and through the
  generated module over the same answers, and require the two to agree. A
  transpiler that drifts fails that test on the form that drifted.

