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
    <span class="inline-grid size-[30px] place-items-center" aria-hidden="true">
      <svg viewBox="0 0 32 38" width="27" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.6 1.8c1.2 7.1-3.8 9.6-6.6 13.8-1.6 2.4-2.1 5.1-.9 7.5-3.4-1.5-4.7-5.2-3.5-9.3C2.5 17.4.3 22 .9 26.5 1.7 33 7.6 37.2 14.3 37.2c8.8 0 15.8-5.6 16.5-13.5.7-7.6-4.3-14.8-13.2-21.9Z" fill="#238C7D"/>
        <path d="M18.6 17.2c.5 3.7-2.6 5.2-4.1 7.7-.9 1.5-1 3.2-.1 4.6-1.8-.5-3.2-2-3.4-4.1-1.7 1.7-2.2 4.1-1 6.1 1.2 2.1 3.5 3.2 6.1 3.2 4.5 0 8.1-2.8 8.3-6.9.2-4-2.4-7.6-5.8-10.6Z" fill="#BFE8DC"/>
      </svg>
    </span>
    <span>FHIR Forms</span>
  </a>
  <nav class="flex items-center gap-1" aria-label="Primary">
    <a class="rounded-full px-3 py-2 text-sm font-semibold text-muted no-underline hover:bg-teal-soft hover:text-teal-dark" href="/">Specification</a>
    <a class="rounded-full px-3 py-2 text-sm font-semibold text-muted no-underline hover:bg-teal-soft hover:text-teal-dark" href="/examples">Examples</a>
    <a class="hidden rounded-full px-3 py-2 text-sm font-semibold text-muted no-underline hover:bg-teal-soft hover:text-teal-dark sm:block" href="/fns">Registry</a>
  <a class="text-sm font-semibold text-muted no-underline transition-colors hover:text-teal" href="https://github.com/HealthSamurai/fhir-forms" target="_blank" rel="noreferrer">GitHub</a>
    </nav>
</header>
<main id="main" class="mx-auto w-[min(1180px,calc(100%_-_2rem))] py-10 md:py-16">${opts.main}</main>
</body>
</html>`;
}

function escapeHtml(value: unknown): string {
    return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]!));
}
