export default function (ctx: Context, _session: Session | null, opts: { path: string; legend: string; code: string; display: string; system?: string; nested?: boolean }) {
    const styles = ctx.fns.examples.ui.styles({});
    const input = ctx.fns.examples.ui.input;
    const body = `<div class="${styles.repeatGrid}">
  ${input({ label: "Code", name: `${opts.path}.code`, value: opts.code })}
  ${input({ label: "Display", name: `${opts.path}.display`, value: opts.display })}
</div><input type="hidden" name="${opts.path}.system" value="${opts.system ?? "http://snomed.info/sct"}">`;
    return ctx.fns.examples.ui.group({ legend: opts.legend, body, nested: opts.nested });
}
