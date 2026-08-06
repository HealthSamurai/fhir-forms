export default function (_ctx: Context, _session: Session | null, _opts?: {}) {
    return [
        {
            id: "ibuprofen-10-prn",
            label: "Ibuprofen 10 mg PRN",
            description: "Medication order with dose and as-needed instruction",
            keywords: "ibuprofen ibu 10 mg 10mg prn as needed pain",
            kind: {
                system: "https://example.org/CodeSystem/order-kind",
                code: "medication",
                display: "Medication",
            },
            code: {
                system: "https://example.org/CodeSystem/orderable",
                code: "ibuprofen",
                display: "Ibuprofen",
            },
            dose: {
                value: "10",
                unit: "mg",
                system: "http://unitsofmeasure.org",
                code: "mg",
            },
            asNeeded: true,
        },
        {
            id: "xray-leg",
            label: "X-ray of leg",
            description: "Imaging order with a coded body site",
            keywords: "xray x-ray radiograph leg legg lower extremity imaging",
            kind: {
                system: "https://example.org/CodeSystem/order-kind",
                code: "imaging",
                display: "Imaging",
            },
            code: {
                system: "https://example.org/CodeSystem/orderable",
                code: "xray",
                display: "X-ray",
            },
            bodySite: {
                system: "https://example.org/CodeSystem/body-site",
                code: "leg",
                display: "Leg",
            },
        },
    ];
}
