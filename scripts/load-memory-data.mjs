// Read the same TypeScript/JSON entry as the app for Node-based verification.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

export function loadMemoryData() {
  const entry = new URL("../data/memories.ts", import.meta.url);
  const { outputText } = ts.transpileModule(readFileSync(entry, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  });
  const exports = {};
  // Only the project's own loader is executed; personal JSON is parsed by Node.
  new Function("require", "exports", outputText)(createRequire(entry), exports);
  return exports;
}
