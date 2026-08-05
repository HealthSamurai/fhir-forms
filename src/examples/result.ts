import { format } from "prettier";

export default async function (ctx: Context, _session: Session | null, opts: { result: any }) {
    const ok = opts.result?.ok === true;
    const value = ok ? opts.result.response : opts.result.issues;
    const json = await format(safeJson(value), { parser: "json", tabWidth: 2, printWidth: 100 });
    const highlighted = await ctx.fns.ui.highlight({ code: json, lang: "json" });
    const shell = ok ? "border-line bg-white" : "border-[#e9b7aa] bg-[#fffaf8]";
    const status = ok ? "text-teal-dark" : "text-[#a43e28]";

    return `<section class="result overflow-hidden rounded-xl border ${shell} text-left text-ink">
  <div class="flex justify-between gap-4 border-b border-line bg-[#f5f2e9] px-3.5 py-3 text-xs"><strong class="${status}">${ok ? "QuestionnaireResponse" : "Rejected as expected"}</strong><span>Prettier + Shiki</span></div>
  ${highlighted}
</section>`;
}

function safeJson(value: unknown): string {
    const seen = new WeakSet<object>();
    return JSON.stringify(value ?? null, (_key, current) => {
        if (typeof current === "bigint") return current.toString();
        if (current && typeof current === "object") {
            if (seen.has(current)) return "[Circular]";
            seen.add(current);
        }
        return current;
    });
}
