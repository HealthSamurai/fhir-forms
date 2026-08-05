export default function (ctx: Context, _session: Session | null, _opts?: {}) {
    const ui = ctx.fns.examples.ui;
    const perMinute = [{ value: "/min", label: "per minute" }, { value: "Hz", label: "Hz" }];
    const pressure = [{ value: "mmHg", label: "mmHg" }, { value: "kPa", label: "kPa" }];
    const path = (linkId: string) => `item[vitals].item[${linkId}]`;
    const measurements = [
        ui.quantity({ path: path("systolic"), label: "Systolic", value: "120", unit: "mmHg", units: pressure }),
        ui.quantity({ path: path("diastolic"), label: "Diastolic", value: "80", unit: "mmHg", units: pressure }),
        ui.quantity({ path: path("heart-rate"), label: "Heart rate", value: "72", unit: "/min", units: perMinute }),
        ui.quantity({ path: path("respiratory-rate"), label: "Respiratory rate", value: "16", unit: "/min", units: perMinute }),
        ui.quantity({ path: path("temperature"), label: "Temperature", value: "36.7", unit: "°C", units: [{ value: "°C", label: "°C" }, { value: "°F", label: "°F" }] }),
        ui.quantity({ path: path("oxygen-saturation"), label: "SpO2", value: "98", unit: "%", units: [{ value: "%", label: "%" }, { value: "fraction", label: "fraction" }] }),
        ui.quantity({ path: path("weight"), label: "Weight", value: "70", unit: "kg", units: [{ value: "kg", label: "kg" }, { value: "lb", label: "lb" }] }),
        ui.quantity({ path: path("height"), label: "Height", value: "175", unit: "cm", units: [{ value: "cm", label: "cm" }, { value: "in", label: "in" }] }),
    ].join("\n");
    const bmi = ui.quantity({
        path: path("bmi"),
        label: "BMI",
        value: "",
        unit: "kg/m2",
        units: [{ value: "kg/m2", label: "kg/m²" }],
        readonly: true,
    });
    const body = ui.group({
        legend: "Vitals",
        bodyClass: "grid grid-cols-1 gap-px bg-ink/20 sm:grid-cols-2 md:grid-cols-12 [&>.ifta-field]:border-0",
        body: `${ui.input({ label: "Measurement date", name: "item[vitals].item[date]", value: "2026-08-05", type: "date", extra: "md:col-span-6" })}\n${bmi}\n${measurements}`,
    });

    return {
        id: "vitals",
        group: "Clinical forms",
        title: "Vital signs",
        badge: "Quantity",
        description: "Clinical measurements represented as Quantity components with selectable display units.",
        questionnaire: ui.questionnaire({ name: "vital-signs", item: [{
            linkId: "vitals",
            type: "group",
            item: [
                { linkId: "date", type: "date", required: true },
                { linkId: "bmi", type: "quantity", readOnly: true },
                { linkId: "systolic", type: "quantity" },
                { linkId: "diastolic", type: "quantity" },
                { linkId: "heart-rate", type: "quantity" },
                { linkId: "respiratory-rate", type: "quantity" },
                { linkId: "temperature", type: "quantity" },
                { linkId: "oxygen-saturation", type: "quantity" },
                { linkId: "weight", type: "quantity" },
                { linkId: "height", type: "quantity" },
            ],
        }] }),
        form: ui.form({ id: "vitals", body, hint: "item[vitals].item[measurement].value + .unit", shell: false }),
    };
}
