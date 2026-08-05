export default function (ctx: Context, _session: Session | null, opts: {
    label: string;
    name: string;
    value: string;
    options: Array<{ value: string; label: string }>;
    extra?: string;
}) {
    const styles = ctx.fns.examples.ui.styles({});
    const classes = opts.extra ? `${styles.field} ${opts.extra}` : styles.field;
    const options = opts.options.map(option =>
        `<option value="${option.value}"${option.value === opts.value ? " selected" : ""}>${option.label}</option>`
    ).join("");
    return `<label class="${classes}"><span>${opts.label}</span><select class="${styles.control}" name="${opts.name}">${options}</select></label>`;
}
