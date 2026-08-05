export default function (ctx: Context, _session: Session | null, opts: {
    path: string;
    label: string;
    value: string;
    unit: string;
    units: Array<{ value: string; label: string }>;
    readonly?: boolean;
}) {
    const styles = ctx.fns.examples.ui.styles({});
    const labelId = `quantity-${opts.path.replace(/[^A-Za-z0-9]+/g, "-")}`;
    const options = opts.units.map(option =>
        `<option value="${option.value}"${option.value === opts.unit ? " selected" : ""}>${option.label}</option>`
    ).join("");
    const unitControl = opts.units.length === 1
        ? `<span class="self-center px-3 pb-2 pt-0.5 text-right text-ink">${opts.units[0]!.label}</span><input type="hidden" name="${opts.path}.unit" value="${opts.unit}">`
        : `<select class="min-h-[38px] w-auto bg-transparent px-3 pb-2 pt-0.5 text-right text-ink outline-none" name="${opts.path}.unit" aria-label="${opts.label} unit">${options}</select>`;
    const readonly = opts.readonly ? ` readonly aria-live="polite"` : "";
    return `<div class="${styles.field} md:col-span-6 hover:bg-white" role="group" aria-labelledby="${labelId}">
  <span id="${labelId}">${opts.label}</span>
  <div class="grid min-w-0 grid-cols-[minmax(0,1fr)_max-content]">
    <input class="${styles.control}" type="number" step="any" inputmode="decimal" name="${opts.path}.value" value="${opts.value}" aria-label="${opts.label} value"${readonly}>
    ${unitControl}
  </div>
</div>`;
}
