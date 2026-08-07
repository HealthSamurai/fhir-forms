# Generator and linter

Generator and Form Linter are development tools around the same binding kernel
used by the Collector. Neither is required at runtime.

## Scaffold Generator

~~~ts
generate({ questionnaire, options }) -> { html, warnings }
~~~

The generator creates deterministic, editable HTML with canonical names,
semantic controls, compound widgets, initial repeat occurrences, runtime markers
and a native submit action.

Warnings identify behavior requiring a project decision, including repeats,
expressions, terminology widgets, mixed Coding systems and unsupported item
types. Generated output is a starting point, not proof of conformance.

The writer restricts output to the project root and refuses to overwrite an
existing scaffold unless replacement is explicit. After generation, the HTML is
project-owned and may be redesigned freely while preserving bindings.

## Form Linter

~~~ts
lint({ questionnaire, document, runtime })
  -> { findings, coverage, unverified }
~~~

The linter checks current controls and trusted templates for resolvable names,
valid ancestry, cardinality, datatype components, protected calculated values,
required coverage and scoped repeat tokens.

Soundness means everything the form can submit is permitted. Completeness means
every enabled item in the form's declared coverage can be answered. Partial forms
must declare their coverage.

One DOM snapshot cannot prove arbitrary dynamic behavior. The linter separates
proven properties, definite violations and scenarios requiring browser execution.
Scenarios cross enablement conditions, change calculation dependencies, edit
repeats and round-trip existing responses through the real Collector.

Passing lint improves feedback but never lets the server skip validation.

## Agent workflow

1. Generate a scaffold without force.
2. Redesign HTML while preserving canonical bindings.
3. Resolve generator warnings and attach dynamic behavior.
4. Lint the final document against the same Questionnaire.
5. Execute required browser scenarios through the Collector.

