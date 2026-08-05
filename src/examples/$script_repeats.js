function addRepeatRow(button) {
    const repeat = button.closest("[data-repeat]");
    if (!repeat) return;
    const rows = repeat.querySelector(":scope > [data-repeat-rows]");
    const template = repeat.querySelector(":scope > template[data-repeat-template]");
    const token = repeat.dataset.repeatToken || "__INDEX__";
    const index = Number(repeat.dataset.nextIndex);
    if (!rows || !template || !Number.isSafeInteger(index) || index < 0) return;

    const rendered = document.createElement("template");
    rendered.innerHTML = template.innerHTML.replaceAll(token, String(index));
    const firstControl = rendered.content.querySelector("input, select, textarea");
    rows.append(rendered.content);
    repeat.dataset.nextIndex = String(index + 1);
    firstControl?.focus();
}

globalThis.FHIRForms = Object.assign(globalThis.FHIRForms || {}, { addRepeatRow });

document.addEventListener("click", event => {
    const button = event.target instanceof Element ? event.target.closest("[data-repeat-add]") : null;
    if (button) addRepeatRow(button);
});
