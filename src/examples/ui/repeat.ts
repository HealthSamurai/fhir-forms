export default function (ctx: Context, _session: Session | null, opts: { rows: string[]; template: string; nextIndex: number; label: string; token?: string }) {
    const styles = ctx.fns.examples.ui.styles({});
    return `<div data-repeat data-repeat-token="${opts.token ?? "__INDEX__"}" data-next-index="${opts.nextIndex}">
  <div data-repeat-rows>${opts.rows.join("\n")}</div>
  <template data-repeat-template>${opts.template}</template>
  <div class="mt-3 flex justify-end"><button class="${styles.addButton}" type="button" data-repeat-add>+ ${opts.label}</button></div>
</div>`;
}
