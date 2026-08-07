export default function (_ctx: Context, _session: Session | null, opts: { title?: string; main: string; headExtra?: string }) {
    const title = opts.title ? opts.title + " | FHIR Forms" : "FHIR Forms";
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Instrument+Sans:wdth,wght@75..100,400..700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/tailwind/app.css">
<script src="https://unpkg.com/htmx.org@2.0.4" defer></script>
<script src="/events/client.js" defer></script>
<script src="/examples/repeats.js" defer></script>
<script src="/examples/vitals.js" defer></script>
<script src="/examples/phq9.js" defer></script>
${opts.headExtra ?? ""}
</head>
<body>
<header class="sticky top-0 z-20 flex min-h-[68px] items-center justify-between gap-8 border-b border-ink/15 bg-paper/90 px-4 backdrop-blur-xl sm:px-[4vw]">
  <a class="inline-flex items-baseline gap-2.5 text-[1.05rem] font-bold tracking-[-.025em] no-underline" href="/">
    <span class="inline-grid size-[30px] -rotate-[7deg] place-items-center rounded-[50%_50%_50%_12%] bg-teal font-mono text-[.74rem] text-white">QR</span>
    <span>FHIR Forms</span>
    <small class="hidden font-mono text-[.68rem] font-normal text-muted sm:inline">proc runtime</small>
  </a>
  <nav class="flex items-center gap-1" aria-label="Primary">
    <a class="rounded-full px-3 py-2 text-sm font-semibold text-muted no-underline hover:bg-teal-soft hover:text-teal-dark" href="/">Specification</a>
    <a class="rounded-full px-3 py-2 text-sm font-semibold text-muted no-underline hover:bg-teal-soft hover:text-teal-dark" href="/examples">Examples</a>
    <a class="hidden rounded-full px-3 py-2 text-sm font-semibold text-muted no-underline hover:bg-teal-soft hover:text-teal-dark sm:block" href="/fns">Registry</a>
  </nav>
</header>
<main id="main" class="mx-auto w-[min(1180px,calc(100%_-_2rem))] py-10 md:py-16">${opts.main}</main>
</body>
</html>`;
}

function escapeHtml(value: unknown): string {
    return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]!));
}
