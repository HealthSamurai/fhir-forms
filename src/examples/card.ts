import { format } from "prettier";

export default async function (ctx: Context, _session: Session | null, opts: { example: string; result?: any; delay?: number }) {
    const meta = ctx.fns.examples.getCase({ id: opts.example }) as any;
    const source = meta?.form;
    if (!meta || !source) return `<article class="rounded-xl border border-[#e9b7aa] bg-[#fffaf8] p-5">Unknown example</article>`;

    const prettyHtml = await format(source, { parser: "html", tabWidth: 2, printWidth: 100 });
    const highlightedHtml = await ctx.fns.ui.highlight({ code: prettyHtml, lang: "html" });
    const response = opts.result === undefined
        ? `<div class="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">Submit the form to materialize a QuestionnaireResponse or structured rejection.</div>`
        : await ctx.fns.examples.result({ result: opts.result });
    const id = String(meta.id).replace(/[^A-Za-z0-9_-]/g, "-");
    const responseActive = opts.result !== undefined;

    return `<article id="example-${id}" class="relative animate-rise overflow-hidden rounded-[18px] border border-line bg-surface/95 shadow-card" style="animation-delay:${opts.delay ?? 0}ms">
  <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal to-coral" aria-hidden="true"></div>
  <header class="flex items-start justify-between gap-4 px-5 pb-4 pt-6">
    <div><h3 class="text-xl font-bold tracking-[-.03em]">${meta.title}</h3><p class="mt-1 text-sm leading-relaxed text-muted">${meta.description}</p></div>
    <span class="shrink-0 rounded-full bg-teal-soft px-2.5 py-1 font-mono text-[.65rem] text-teal-dark">${meta.badge}</span>
  </header>
  <div class="relative" role="group" aria-label="${meta.title} views">
    ${tab(id, "form", "Form", !responseActive)}
    ${tab(id, "html", "HTML", false)}
    ${tab(id, "response", "Response JSON", responseActive)}
    <div class="example-tab-panels border-t border-line">
      <section class="example-tab-panel example-panel-form p-5">${source}</section>
      <section class="example-tab-panel example-panel-html example-code">${highlightedHtml}</section>
      <section class="example-tab-panel example-panel-response p-4" aria-live="polite">${response}</section>
    </div>
  </div>
</article>`;
}

function tab(id: string, tabId: string, label: string, checked: boolean) {
    return `<input class="example-tab-toggle" data-tab="${tabId}" type="radio" name="view-${id}" id="view-${id}-${tabId}"${checked ? " checked" : ""}>
    <label class="example-tab-label mb-2 ml-2 inline-flex cursor-pointer rounded-lg border border-transparent px-2.5 py-2 font-mono text-[.68rem] font-medium text-muted" for="view-${id}-${tabId}">${label}</label>`;
}
