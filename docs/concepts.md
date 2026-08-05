# A bridge between HTML forms and FHIR Questionnaire

A **Questionnaire** is a typed tree with codes on it. An **HTML form** is a flat
list of name/value pairs. This document is the bridge between them: how a
questionnaire becomes a page, how the page's `POST` becomes a
**QuestionnaireResponse**, and every decision and corner case in that mapping.

It is written to be usable without our renderer — a page with its own markup can
post the same names and get the same answer — and to work with no JavaScript at
all, because a clinical form that stops working when a script fails is not a form.

## The problem

The two shapes do not line up, and every difference between them is somewhere a
form loses data:

| a Questionnaire has | an HTML form has |
|---|---|
| a tree of items, nested and repeatable | one flat list of names |
| a type per question, and typed answers (`valueQuantity`, `valueCoding`) | strings |
| codes that say what a question means | nothing of the kind |
| units, ranges, skip logic, calculations | `required`, `min`, `max`, and a browser's goodwill |
| answers that mirror the tree | pairs, in whatever order the browser felt like |

And the browser has its own facts that no specification can argue with: an
unchecked checkbox posts nothing at all, a file input cannot be refilled by the
server, `datetime-local` has no offset, an empty field is indistinguishable from a
missing one unless somebody decides what that means.

So the bridge has to answer four questions, and the rest of this document is those
four answers: **what a field is called**, **what the body means**, **what comes
back**, and **who decides** when the two disagree.

## What is being bridged

### The definition

A Questionnaire is a recursive tree of `item`. Every node has a **`linkId`**
(unique in the form — its address), a **`type`**, and usually **`text`** (what a
person reads). `group` holds children and carries no answer; `display` is a
paragraph; everything else is answerable, and the answer mirrors the tree —
`QuestionnaireResponse.item[]` with the same linkIds.

Beside the type sits **`code`**, and it is a different coordinate system
altogether:

| | says |
|---|---|
| `type` | what the answer looks like — a number, a date, a choice |
| `linkId` | where the answer goes in this form |
| `item.code` | what the question **means** — LOINC, SNOMED. This is what makes a form a source of records rather than a document |
| `answerOption.valueCoding` / `answerValueSet` | the vocabulary of the **answers**, not of the question |
| `Questionnaire.code` | what the whole form is about |

A form with no codes is perfectly valid. It is a document: the answers make sense
next to it and nowhere else.

### The types

`group`, `display`, and then: `boolean`, `decimal`, `integer`, `date`, `dateTime`,
`time`, `string`, `text`, `url`, `choice`, `open-choice`, `quantity`,
`attachment`, `reference`.

Two that surprise people: `string` and `text` differ **only in how they are
typed** — both produce `valueString`, so this is the one place where the type
encodes layout rather than meaning. And in **R5 `choice`/`open-choice` are gone**,
replaced by one `coding` type plus `answerConstraint` (`optionsOnly` ·
`optionsOrType` · `optionsOrString`) — which is the more honest model: "pick, or
write your own" is a constraint, not a different kind of answer.

### The answer

A QuestionnaireResponse mirrors the questionnaire: `item[]` with the same
`linkId`s, nested the same way, each answerable item carrying `answer[]` and each
answer one of a dozen `value[x]`. A repeating group appears once per repetition,
in order; items that hang off a particular answer sit inside it. Nothing in the
response says how it was collected — which is the point, and also why the mapping
below has to be exact.

