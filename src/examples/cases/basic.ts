export default function (ctx: Context, _session: Session | null, _opts?: {}) {
    const ui = ctx.fns.examples.ui;
    const styles = ui.styles({});
    const body = `<div class="${styles.formGrid}">
  ${ui.input({ label: "Patient name", name: "item[patientName]", value: "Ada Lovelace", extra: "sm:col-span-2" })}
  ${ui.input({ label: "Narrative", name: "item[note]", value: "First programmer", extra: "sm:col-span-2" })}
  ${ui.input({ label: "Integer zero", name: "item[count]", value: "0" })}
  ${ui.input({ label: "Decimal exponent", name: "item[score]", value: "-12.5e1" })}
  ${ui.input({ label: "Partial FHIR date", name: "item[birthDate]", value: "1815-12" })}
  ${ui.input({ label: "Offset dateTime", name: "item[appointment]", value: "2026-08-05T10:30:00+01:00" })}
  ${ui.input({ label: "FHIR time", name: "item[wakeTime]", value: "09:15:30" })}
  <label class="${styles.field}"><span>Boolean false</span><select class="${styles.control}" name="item[smoker]"><option value="false" selected>false</option><option value="true">true</option></select></label>
  ${ui.input({ label: "URI", name: "item[profile]", value: "https://example.org/profile" })}
  ${ui.input({ label: "Quantity value", name: "item[weight].value", value: "68.4" })}
  <label class="${styles.field}"><span>Comparator</span><select class="${styles.control}" name="item[weight].comparator"><option value="&lt;=" selected>&lt;=</option><option value="">none</option></select></label>
  ${ui.input({ label: "Unit", name: "item[weight].unit", value: "kg" })}
</div>
<input type="hidden" name="item[weight].system" value="http://unitsofmeasure.org">
<input type="hidden" name="item[weight].code" value="kg">`;
    return {
        id: "basic", group: "Valid responses", title: "Primitive boundaries", badge: "types",
        description: "Zero, false, partial dates, offset time, URI, decimal exponent, and Quantity.",
        questionnaire: ui.questionnaire({ name: "primitive-boundaries", item: [
            { linkId: "patientName", type: "string", required: true }, { linkId: "note", type: "text" },
            { linkId: "count", type: "integer" }, { linkId: "score", type: "decimal" },
            { linkId: "birthDate", type: "date" }, { linkId: "appointment", type: "dateTime" },
            { linkId: "wakeTime", type: "time" }, { linkId: "smoker", type: "boolean" },
            { linkId: "profile", type: "url" }, { linkId: "weight", type: "quantity" },
        ] }),
        form: ui.form({ id: "basic", body, hint: "primitive + Quantity boundaries" }),
    };
}
