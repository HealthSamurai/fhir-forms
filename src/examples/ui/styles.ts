export default function (_ctx: Context, _session: Session | null, _opts?: {}) {
    return {
        formGrid: "ifta-grid grid grid-cols-1 sm:grid-cols-2",
        repeatGrid: "ifta-grid grid grid-cols-1 sm:grid-cols-2",
    field: "ifta-field group grid min-w-0 grid-rows-[auto_1fr] bg-[#fffefa] transition-colors focus-within:bg-white [&>span]:px-3 [&>span]:pt-[2px] [&>span]:text-[.46rem] [&>span]:font-bold [&>span]:uppercase [&>span]:tracking-[.18em] [&>span]:text-[#686d6b]",
        control: "min-h-[38px] w-full border-0 bg-transparent px-3 pb-2 pt-0.5 text-ink outline-none placeholder:text-muted/60",
        fieldset: "ifta-group min-w-0 bg-transparent p-0",
        button: "cursor-pointer rounded-md border-0 bg-teal px-4 py-2.5 text-[.82rem] font-semibold text-white transition hover:bg-teal-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal",
        addButton: "cursor-pointer rounded border border-teal/30 bg-transparent px-3 py-2 text-[.76rem] font-semibold text-teal-dark transition hover:border-teal hover:bg-teal-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal",
    };
}
