import { resolve } from "node:path";
import projectRoot from "./projectRoot";

export type Root = { name: string; dir: string; namespace: string };

export default function (ctx: Context, session: Session | null, _opts?: {}): Root[] {
    return [{ name: "app", dir: resolve(projectRoot(ctx, session, {}), "src"), namespace: "" }];
}
