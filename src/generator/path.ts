export default function (
    _ctx: Context,
    _session: Session | null,
    opts: { linkId: string; parent?: string; occurrence?: number | string },
): string {
    if (typeof opts.linkId !== "string" || opts.linkId.length === 0) {
        throw new Error("A non-empty Questionnaire item.linkId is required");
    }

    const encoded = encodeURIComponent(opts.linkId).replace(
        /[!'()*]/g,
        character => "%" + character.charCodeAt(0).toString(16).toUpperCase(),
    );
    const item = (opts.parent ? opts.parent + ".item[" : "item[") + encoded + "]";
    return opts.occurrence === undefined ? item : item + "[" + opts.occurrence + "]";
}
