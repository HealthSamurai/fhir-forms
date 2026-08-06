export default function (
    _ctx: Context,
    _session: Session | null,
    opts: { value: unknown },
): string {
    return String(opts.value ?? "").replace(
        /[&<>"']/g,
        character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "\"": "&quot;",
            "'": "&#39;",
        })[character]!,
    );
}
