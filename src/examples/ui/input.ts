export default function (ctx: Context, _session: Session | null, opts: { label: string; name: string; value: string; extra?: string; type?: string; step?: string; inputmode?: string }) {
    const styles = ctx.fns.examples.ui.styles({});
    const classes = opts.extra ? `${styles.field} ${opts.extra}` : styles.field;
    const step = opts.step ? ` step="${opts.step}"` : "";
    const inputmode = opts.inputmode ? ` inputmode="${opts.inputmode}"` : "";
    return `<label class="${classes}"><span>${opts.label}</span><input class="${styles.control}" type="${opts.type ?? "text"}" name="${opts.name}" value="${opts.value}"${step}${inputmode}></label>`;
}
