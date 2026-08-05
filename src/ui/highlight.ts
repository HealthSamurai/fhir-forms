import { createHighlighter, type BundledLanguage } from "shiki";

const aliases: Record<string, BundledLanguage> = {
    "": "text",
    txt: "text",
    text: "text",
    abnf: "text",
    haml: "haml",
    html: "html",
    js: "javascript",
    javascript: "javascript",
    json: "json",
    jsonc: "jsonc",
    yaml: "yaml",
    yml: "yaml",
};

const highlighter = createHighlighter({
    themes: ["github-light-default"],
    langs: [...new Set(Object.values(aliases))],
});

export default async function (_ctx: Context, _session: Session | null, opts: { code: string; lang?: string }) {
    const engine = await highlighter;
    const lang = aliases[String(opts.lang ?? "").toLowerCase()] ?? "text";
    return engine.codeToHtml(opts.code, { lang, theme: "github-light-default" });
}
