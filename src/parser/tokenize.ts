
export default function (_ctx: Context, _session: Session | null, opts: { name: string }) {
    const name = opts.name;
    const fail = (code: string, message: string): never => {
        throw { parserIssue: true, issue: { code, path: name, message } };
    };

    try {
        if (typeof name !== "string" || name.length === 0) {
            fail("path.invalid-syntax", "Field name must be a non-empty string");
        }
        if (name.length > 4096) fail("path.too-long", "Field path exceeds 4096 characters");

        let pos = 0;
        const steps: Array<{ linkId: string; index: number | null }> = [];

        const readItem = () => {
            if (!name.startsWith("item[", pos)) {
                fail("path.invalid-syntax", "Expected item[linkId]");
            }
            pos += 5;
            const close = name.indexOf("]", pos);
            if (close < 0) fail("path.invalid-syntax", "Unclosed linkId selector");
            const encoded = name.slice(pos, close);
            if (!encoded || !/^(?:[A-Za-z0-9._~-]|%[0-9A-Fa-f]{2})+$/.test(encoded)) {
                fail("path.invalid-escape", "linkId must use UTF-8 percent encoding");
            }
            let linkId = "";
            try {
                linkId = decodeURIComponent(encoded);
            } catch {
                fail("path.invalid-escape", "Malformed linkId percent encoding");
            }
            if (!linkId) fail("path.invalid-syntax", "Decoded linkId must not be empty");
            pos = close + 1;

            let index: number | null = null;
            if (name[pos] === "[") {
                const indexClose = name.indexOf("]", pos + 1);
                if (indexClose < 0) fail("path.invalid-syntax", "Unclosed occurrence index");
                const rawIndex = name.slice(pos + 1, indexClose);
                if (!/^(?:0|[1-9][0-9]*)$/.test(rawIndex)) {
                    fail("path.invalid-index", "Occurrence index must be a canonical non-negative integer");
                }
                index = Number(rawIndex);
                if (!Number.isSafeInteger(index)) fail("path.invalid-index", "Occurrence index is too large");
                pos = indexClose + 1;
            }
            return { linkId, index };
        };

        steps.push(readItem());
        while (name.startsWith(".item[", pos)) {
            pos += 1;
            steps.push(readItem());
        }

        const components: string[] = [];
        if (pos < name.length) {
            if (name[pos] !== ".") fail("path.invalid-syntax", "Expected child item or component");
            const tail = name.slice(pos + 1);
            if (!tail) fail("path.invalid-syntax", "Empty component path");
            for (const component of tail.split(".")) {
                if (!/^[A-Za-z][A-Za-z0-9]*$/.test(component)) {
                    fail("path.invalid-syntax", "Invalid component name");
                }
                components.push(component);
            }
            pos = name.length;
        }
        if (pos !== name.length) fail("path.invalid-syntax", "Trailing path data");

        return { ok: true as const, steps, components };
    } catch (error: any) {
        if (error?.parserIssue) return { ok: false as const, issue: error.issue };
        throw error;
    }
}
