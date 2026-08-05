export default function (ctx: Context, _session: Session | null, opts: { id: string; body: string; hint: string; button?: string; shell?: boolean }) {
    const styles = ctx.fns.examples.ui.styles({});
    const body = opts.shell === false
        ? opts.body
        : `<div class="overflow-hidden rounded-xl border border-ink/20 bg-[#fffdf8]"><div class="ifta-form-body">${opts.body}</div></div>`;
    return `<form hx-post="/examples/parse" hx-target="#example-${opts.id}" hx-swap="outerHTML">
  <input type="hidden" name="_example" value="${opts.id}">
  ${body}
  <div class="mt-3 flex items-center justify-between gap-4"><small class="font-mono text-[.64rem] text-muted">${opts.hint}</small><button class="${styles.button}" type="submit">${opts.button ?? "Parse form"}</button></div>
</form>`;
}
