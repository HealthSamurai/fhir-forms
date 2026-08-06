import { dirname, isAbsolute, relative, resolve } from "node:path";
import { mkdir } from "node:fs/promises";

export default async function (
    ctx: Context,
    _session: Session | null,
    opts: {
        questionnaire: any;
        output: string;
        force?: boolean;
        action?: string;
        method?: "get" | "post";
        title?: string;
        submitLabel?: string;
        document?: boolean;
    },
) {
    if (typeof opts.output !== "string" || opts.output.trim() === "") {
        return {
            ok: false as const,
            issue: { code: "output.required", message: "An output path is required" },
        };
    }

    const root = ctx.fns.project.projectRoot({});
    const absolute = resolve(root, opts.output);
    const projectRelative = relative(root, absolute);
    if (projectRelative === "" || projectRelative.startsWith("..") || isAbsolute(projectRelative)) {
        return {
            ok: false as const,
            issue: {
                code: "output.outside-project",
                message: "Generated files must stay inside the project root",
            },
        };
    }

    if (await Bun.file(absolute).exists() && opts.force !== true) {
        return {
            ok: false as const,
            issue: {
                code: "output.exists",
                message: "Refusing to overwrite " + projectRelative + "; pass force: true explicitly",
            },
        };
    }

    const generated = ctx.fns.generator.generate({
        questionnaire: opts.questionnaire,
        action: opts.action,
        method: opts.method,
        title: opts.title,
        submitLabel: opts.submitLabel,
        document: opts.document,
    });
    if (!generated.ok) return generated;

    await mkdir(dirname(absolute), { recursive: true });
    await Bun.write(absolute, generated.html);
    return {
        ok: true as const,
        output: projectRelative,
        bytes: Buffer.byteLength(generated.html),
        warnings: generated.warnings,
    };
}
