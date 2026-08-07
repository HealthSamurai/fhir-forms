const scoreFields = Array.from({ length: 9 }, (_, index) => `item[q${index + 1}].code`);

function severity(score) {
    if (score < 5) return "Minimal";
    if (score < 10) return "Mild";
    if (score < 15) return "Moderate";
    if (score < 20) return "Moderately severe";
    return "Severe";
}

function updatePhq9(form) {
    if (!(form instanceof HTMLFormElement) || !form.matches("[data-phq9]")) return;
    const selected = scoreFields.map(name => form.querySelector(`input[name="${name}"]:checked`)).filter(Boolean);
    const score = selected.reduce((sum, control) => sum + Number(control.dataset.phqScore), 0);
    const complete = selected.length === scoreFields.length;
    const total = form.querySelector("[data-phq-total]");
    const band = form.querySelector("[data-phq-severity]");
    const progress = form.querySelector("[data-phq-progress]");

    if (total) total.textContent = complete ? `${score} / 27` : `-- / 27`;
    if (band) band.textContent = complete ? severity(score) : `${selected.length} of 9 answered`;
    if (progress instanceof HTMLProgressElement) progress.value = complete ? score : 0;

    const impact = form.querySelector("[data-phq-impact]");
    if (impact instanceof HTMLFieldSetElement) {
        const enabled = selected.some(control => Number(control.dataset.phqScore) > 0);
        impact.hidden = !enabled;
        impact.disabled = !enabled;
        if (!enabled) impact.querySelectorAll("input[type=radio]").forEach(control => control.checked = false);
    }
}

function updateFromEvent(event) {
    const control = event.target instanceof HTMLInputElement ? event.target : null;
    if (!control || !control.matches("[data-phq-score]")) return;
    updatePhq9(control.closest("form"));
}

function updateAllPhq9() {
    document.querySelectorAll("form[data-phq9]").forEach(updatePhq9);
}

document.addEventListener("change", updateFromEvent);
document.addEventListener("htmx:afterSwap", updateAllPhq9);
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", updateAllPhq9);
else updateAllPhq9();

globalThis.FHIRForms = Object.assign(globalThis.FHIRForms || {}, { updatePhq9 });
