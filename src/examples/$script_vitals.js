const paths = {
    weight: "item[vitals].item[weight].value",
    weightUnit: "item[vitals].item[weight].unit",
    height: "item[vitals].item[height].value",
    heightUnit: "item[vitals].item[height].unit",
    bmi: "item[vitals].item[bmi].value",
};

function calculateBmi(form) {
    const field = name => form.elements.namedItem(name);
    const bmi = field(paths.bmi);
    if (!(bmi instanceof HTMLInputElement)) return;

    const weight = Number(field(paths.weight)?.value);
    const height = Number(field(paths.height)?.value);
    const weightUnit = field(paths.weightUnit)?.value;
    const heightUnit = field(paths.heightUnit)?.value;
    if (!Number.isFinite(weight) || weight <= 0 || !Number.isFinite(height) || height <= 0) {
        bmi.value = "";
        return;
    }

    const kilograms = weightUnit === "lb" ? weight * 0.45359237 : weight;
    const meters = heightUnit === "in" ? height * 0.0254 : height / 100;
    bmi.value = (kilograms / (meters * meters)).toFixed(1);
}

function updateFromEvent(event) {
    const control = event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement
        ? event.target
        : null;
    if (!control || !Object.values(paths).includes(control.name)) return;
    const form = control.closest("form");
    if (form) calculateBmi(form);
}

function updateAll() {
    document.querySelectorAll("form").forEach(calculateBmi);
}

document.addEventListener("input", updateFromEvent);
document.addEventListener("change", updateFromEvent);
document.addEventListener("htmx:afterSwap", updateAll);
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", updateAll);
else updateAll();

globalThis.FHIRForms = Object.assign(globalThis.FHIRForms || {}, { calculateBmi });
