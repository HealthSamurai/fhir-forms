export default function (ctx: Context, _session: Session | null, opts: { legend: string; body: string; nested?: boolean; bodyClass?: string }) {
    const styles = ctx.fns.examples.ui.styles({});
    const bodyClass = opts.bodyClass ? ` ${opts.bodyClass}` : "";
    if (opts.nested) {
        return `<fieldset class="${styles.fieldset} ifta-group-nested"><legend>${opts.legend}</legend><div class="ifta-group-shell ifta-group-shell-nested overflow-hidden rounded border border-ink/20 bg-[#fffdf8]"><div class="ifta-group-body${bodyClass}">${opts.body}</div></div></fieldset>`;
    }
    return `<fieldset class="${styles.fieldset}"><legend>${opts.legend}</legend><div class="ifta-group-shell overflow-hidden rounded-xl border border-ink/20 bg-[#fffdf8]"><div class="ifta-group-body${bodyClass}">${opts.body}</div></div></fieldset>`;
}
