export default async function (ctx: Context, _session: Session | null, opts?: { example?: string }) {
    const catalog = ctx.fns.examples.catalog({}) as Array<any>;
    const requested = opts?.example ?? "decisionSupport";
    const selected = catalog.find(entry => entry.id === requested || slug(entry.id) === requested) ?? catalog[0]!;
    const groups = [...new Set(catalog.map(entry => entry.group))];
    const card = await ctx.fns.examples.card({ example: selected.id });

    return `<section class="grid gap-7 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
  <aside class="lg:sticky lg:top-24 lg:self-start">
    <p class="mb-3 font-mono text-[.68rem] font-medium uppercase tracking-[.14em] text-teal">Live examples</p>
    <nav class="flex gap-2 overflow-x-auto pb-2 lg:block lg:max-h-[calc(100vh-8rem)] lg:space-y-5 lg:overflow-y-auto lg:pr-2" aria-label="FHIR form examples">
      ${groups.map(group => navigationGroup(group, catalog, selected.id)).join("\n")}
    </nav>
  </aside>
  <div class="min-w-0">
    <header class="mb-7 border-b border-ink/10 pb-6">
      <p class="mb-3 font-mono text-xs font-medium uppercase tracking-[.14em] text-teal">${groupLabel(selected.group)} / FHIR semantics, arbitrary HTML</p>
      <h1 class="mb-3 text-[clamp(2.4rem,6vw,4.8rem)] font-bold leading-[.94] tracking-[-.06em]">One contract. Any interface.</h1>
      <p class="max-w-3xl text-lg leading-relaxed text-muted">Start with interfaces a generic Questionnaire renderer cannot produce. Continue with binding reference cases and explicit rejections. Every page exposes the live form, submitted HTML, and resulting QuestionnaireResponse.</p>
    </header>
    ${card}
  </div>
</section>`;
}

function navigationGroup(group: string, catalog: Array<any>, selectedId: string) {
    const links = catalog.filter(entry => entry.group === group).map(entry => {
        const active = entry.id === selectedId;
        const classes = active
            ? "block whitespace-nowrap rounded-lg bg-teal px-3 py-2 text-sm font-semibold text-white no-underline"
            : "block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-muted no-underline hover:bg-teal-soft hover:text-teal-dark";
        return `<a class="${classes}" href="/examples/${slug(entry.id)}">${entry.title}</a>`;
    }).join("\n");
    return `<div class="min-w-max lg:min-w-0"><h2 class="mb-1 px-3 font-mono text-[.6rem] font-medium uppercase tracking-[.12em] text-muted">${groupLabel(group)}</h2><div class="space-y-1">${links}</div></div>`;
}

function groupLabel(group: string) {
    if (group === "Valid responses") return "Binding reference";
    if (group === "Expected rejections") return "Rejection cases";
    return group;
}

function slug(value: string) {
    return value.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}
