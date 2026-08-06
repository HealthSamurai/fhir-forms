# Scaffold generator

The scaffold generator creates editable HTML source from a Questionnaire. It is
for teams and coding agents that want a correct starting point and then intend to
design a richer interface, similar to generating a Rails scaffold and owning the
result afterward.

It is not a runtime dependency and not a second UI schema. Generated HTML is
ordinary source code that follows the same public binding contract as
hand-written forms.

## Generate in memory

~~~ts
const result = ctx.fns.generator.generate({
  questionnaire,
  action: "/responses",
  title: "Vital signs",
});

if (result.ok) {
  console.log(result.html);
  console.log(result.warnings);
}
~~~

The output is deterministic for the same Questionnaire and options. By default it
is a complete responsive HTML document with small baseline styles. Pass
<code>document: false</code> to generate only the form fragment.

## Write a scaffold

From procx REPL:

~~~ts
const questionnaire = await Bun.file("questionnaires/vitals.json").json();

await ctx.fns.generator.write({
  questionnaire,
  output: "forms/vitals.html",
  action: "/responses",
});
~~~

The writer refuses to overwrite an existing file. This is intentional: after an
agent or developer changes layout, labels, components, or interaction, the HTML
is project-owned bespoke source. Pass <code>force: true</code> only when replacing
those edits is explicit.

Output paths are restricted to the project root.

## What is generated

The generator currently emits:

- canonical names for primitive and complex answer types;
- explicit non-repeating group ancestry;
- occurrence zero for repeating items and groups;
- Quantity value/unit compound widgets;
- Coding selects from answerOption when options are available;
- open-choice Coding plus a <code>.text</code> entry;
- Reference and Attachment controls;
- output-only read-only and calculated placeholders;
- data-field and data-type markers for agents, tests, and runtime attachment;
- a normal native submit button.

It does not infer clinical meaning or silently approximate behavior absent from
the Questionnaire.

## Warnings are the handoff

Generation returns structured warnings for work that requires a project
decision, including:

- repeat add/remove behavior and contiguous index maintenance;
- enableWhen runtime attachment;
- calculated expression compilation or server recompute;
- terminology widgets for answerValueSet;
- mixed-system Coding widgets;
- unsupported Questionnaire item types.

A generated file is a valid scaffold, not automatic proof of conformance.
Resolve its warnings, run the Form Linter and browser scenarios, and collect the
real FormData through the Collector.

## Agent workflow

A coding agent can use the generator as a semantic bootstrap:

1. load the Questionnaire;
2. generate a new file without force;
3. keep every canonical name and data-field marker stable;
4. replace generic layout and widgets with product-specific HTML;
5. attach repeat and reactive behavior where warnings require it;
6. lint the final document against the same Questionnaire;
7. exercise it through the real Collector.

The agent may radically change DOM structure and styling. It must not invent a
second answer model or rewrite field names to suit a UI framework.
