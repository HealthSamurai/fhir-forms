export default function (ctx: Context, _session: Session | null, _opts?: {}) {
    const ui = ctx.fns.examples.ui;
    const styles = ui.styles({});
    const body = `<div class="${styles.formGrid}">
  ${ui.input({ label: "Document URL", name: "item[document].url", value: "https://example.org/report.pdf", extra: "sm:col-span-2" })}
  ${ui.input({ label: "Content type", name: "item[document].contentType", value: "application/pdf" })}
  ${ui.input({ label: "Language", name: "item[document].language", value: "en" })}
  ${ui.input({ label: "Title", name: "item[document].title", value: "Clinical report" })}
  ${ui.input({ label: "Creation", name: "item[document].creation", value: "2026-08-05T09:00:00Z" })}
</div>`;
    return {
        id: "attachment", group: "Valid responses", title: "Attachment URL", badge: "Attachment",
        description: "Metadata components form a URL-backed valueAttachment.",
        questionnaire: ui.questionnaire({ name: "attachment-url", item: [{ linkId: "document", type: "attachment" }] }),
        form: ui.form({ id: "attachment", body, hint: "URL-backed Attachment components" }),
    };
}
