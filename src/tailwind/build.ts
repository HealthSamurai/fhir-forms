import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export default async function (ctx: Context, _session: Session | null, opts?: { minify?: boolean }) {
    const root = ctx.fns.project.projectRoot({});
    const input = resolve(root, "src/styles/app.css");
    const output = resolve(root, ".runtime/app.css");
    const binary = resolve(root, "node_modules/.bin/tailwindcss");
    await mkdir(dirname(output), { recursive: true });

    const command = [binary, "-i", input, "-o", output];
    if (opts?.minify) command.push("--minify");
    const child = Bun.spawn(command, { cwd: root, stdout: "pipe", stderr: "pipe" });
    const [exitCode, stdout, stderr] = await Promise.all([
        child.exited,
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
    ]);
    if (exitCode !== 0) throw new Error(`Tailwind build failed (${exitCode})\n${stderr || stdout}`);
    return { input, output, bytes: Bun.file(output).size };
}
