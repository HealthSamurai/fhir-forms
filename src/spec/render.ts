import { posix, resolve } from "node:path";

type Page = { id: string; file: string; label: string };

const LABELS: Record<string, string> = {
    index: "Overview",
    concepts: "Presentation layer",
    components: "Components",
    "field-names": "Field names",
    "entry-list": "Form entry list",
    types: "FHIR type binding",
    rendering: "Rendering",
    exchange: "Exchange",
    expressions: "Reactive runtime",
    extraction: "Extraction",
    parser: "Collector & validation",
    linter: "Form linter",
    conformance: "Conformance",
    decisions: "Decisions",
    "open-questions": "Open questions",
    "prior-art": "Prior art",
    compatibility: "Compatibility index",
};

const NAVIGATION = [
    { label: "Start", ids: ["index", "concepts", "components"] },
    { label: "HTML contract", ids: ["rendering", "field-names", "entry-list", "types"] },
    { label: "Runtime components", ids: ["parser", "linter", "expressions"] },
    { label: "Protocol", ids: ["exchange"] },
    { label: "Output", ids: ["extraction", "conformance"] },
    { label: "Examples", ids: ["examples/blood-pressure", "examples/phq9", "examples/diagnosis"] },
    { label: "Design notes", ids: ["decisions", "open-questions", "prior-art", "compatibility"] },
];

const ALIASES: Record<string, string> = {
    "collect-and-render": "rendering",
};

export default async function (ctx: Context, _session: Session | null, opts: { page?: string }) {
    const root = ctx.fns.project.projectRoot({});
    const pages = pagesAt(root);
    const requested = ALIASES[opts.page ?? "index"] ?? opts.page ?? "index";
    const page = pages.find(candidate => candidate.id === requested) ?? pages[0]!;
    const markdown = await Bun.file(resolve(root, page.file)).text();
    const raw = Bun.markdown.html(markdown, { headings: true });
    const highlighted = await highlightFences(ctx, raw);
    const html = rewriteLinks(highlighted, page.file, pages);

    return `<section class="grid gap-7 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
  <aside class="lg:sticky lg:top-24 lg:self-start">
    <p class="mb-3 font-mono text-[.68rem] font-medium uppercase tracking-[.14em] text-teal">Specification</p>
    <nav class="flex gap-2 overflow-x-auto pb-2 lg:block lg:max-h-[calc(100vh-8rem)] lg:space-y-1 lg:overflow-y-auto" aria-label="Specification sections">
      ${renderNavigation(pages, page.id)}
    </nav>
  </aside>
  <article class="min-w-0 overflow-hidden rounded-[18px] border border-line bg-surface/95 shadow-card">
    <header class="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-[#f5f2e9] px-5 py-3 text-xs text-muted">
      <strong class="text-teal-dark">${escapeHtml(page.label)}</strong>
      <code class="rounded bg-code px-2 py-1 text-[.68rem]">${escapeHtml(page.file)}</code>
    </header>
    <div class="spec-prose prose prose-slate max-w-none px-5 py-7 prose-headings:scroll-mt-24 prose-headings:tracking-tight prose-a:text-teal prose-code:before:content-none prose-code:after:content-none prose-pre:bg-[#f6f8fa] sm:px-8 sm:py-10">${html}</div>
  </article>
</section>`;
}

function pagesAt(root: string): Page[] {
    const core = [...new Bun.Glob("*.md").scanSync({ cwd: resolve(root, "docs") })].map(file => page(`docs/${file}`));
    const examples = [...new Bun.Glob("examples/**/*.md").scanSync({ cwd: resolve(root, "docs") })].map(file => page(`docs/${file}`));
    const extras = [
        { id: "prior-art", file: "prior-art.md", label: "Prior art" },
        { id: "compatibility", file: "spec.md", label: "Compatibility index" },
    ];
    const order = NAVIGATION.flatMap(section => section.ids);
    return [...core, ...examples, ...extras].sort((a, b) => {
        const ai = order.indexOf(a.id);
        const bi = order.indexOf(b.id);
        return (ai < 0 ? order.length : ai) - (bi < 0 ? order.length : bi) || a.id.localeCompare(b.id);
    });
}

function renderNavigation(pages: Page[], activeId: string): string {
    const byId = new Map(pages.map(candidate => [candidate.id, candidate]));
    const listed = new Set(NAVIGATION.flatMap(section => section.ids));
    const sections = NAVIGATION.map(section => ({
        ...section,
        pages: section.ids.map(id => byId.get(id)).filter((page): page is Page => Boolean(page)),
    }));
    const remaining = pages.filter(page => !listed.has(page.id));
    if (remaining.length > 0) sections.push({ label: "More", ids: [], pages: remaining });
    return sections.filter(section => section.pages.length > 0).map(section => `<div class="contents lg:block lg:pb-4">
  <p class="hidden px-3 pb-1 pt-2 font-mono text-[.58rem] font-semibold uppercase tracking-[.14em] text-muted lg:block">${escapeHtml(section.label)}</p>
  <div class="contents lg:block lg:space-y-1">${section.pages.map(page => navLink(page, page.id === activeId)).join("\n")}</div>
</div>`).join("\n");
}

function page(file: string): Page {
    const id = file.replace(/^docs\//, "").replace(/\.md$/, "");
    const base = id.split("/").at(-1)!;
    return { id, file, label: LABELS[id] ?? humanize(base) };
}

function navLink(page: Page, active: boolean): string {
    const classes = active
        ? "whitespace-nowrap rounded-lg bg-teal px-3 py-2 text-sm font-semibold text-white no-underline lg:block"
        : "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-muted no-underline hover:bg-teal-soft hover:text-teal-dark lg:block";
    return `<a class="${classes}" href="${pageHref(page.id)}">${escapeHtml(page.label)}</a>`;
}

function rewriteLinks(html: string, currentFile: string, pages: Page[]): string {
    const known = new Map(pages.map(page => [page.file, page.id]));
    return html.replace(/href="([^"#]+\.md)(#[^"]*)?"/g, (original, href: string, hash = "") => {
        if (/^[a-z]+:/i.test(href)) return original;
        const target = posix.normalize(posix.join(posix.dirname(currentFile), href));
        const id = known.get(target);
        return id ? `href="${pageHref(id)}${hash}"` : original;
    });
}

function pageHref(id: string): string {
    if (id === "index") return "/spec";
    return "/spec/" + id.split("/").map(encodeURIComponent).join("/");
}

async function highlightFences(ctx: Context, html: string): Promise<string> {
    const pattern = /<pre><code(?: class="language-([^"]+)")?>([\s\S]*?)<\/code><\/pre>/g;
    const matches = [...html.matchAll(pattern)];
    const rendered = await Promise.all(matches.map(match => ctx.fns.ui.highlight({
        code: decodeCode(match[2] ?? ""),
        lang: match[1] ?? "text",
    })));
    let index = 0;
    return html.replace(pattern, () => rendered[index++]!);
}

function decodeCode(value: string): string {
    return value
        .replace(/&#x([0-9a-f]+);/gi, (_match, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
        .replace(/&#(\d+);/g, (_match, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)))
        .replace(/&quot;/g, "\"")
        .replace(/&#39;|&apos;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&");
}

function humanize(value: string): string {
    const text = value.replace(/[-_]/g, " ");
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function escapeHtml(value: unknown): string {
    return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]!));
}
