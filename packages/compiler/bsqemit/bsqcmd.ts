import { execFileSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { transpile } from "./transpiler";
import { join } from "path";
import { ok } from "assert";

const CADL_ROOT = "xxxx";
const BSQ_ROOT = "xxxx";

const BSQ_SCRATCH_DIR = join(CADL_ROOT, "bsqit");
const BSQ_API_FILE = join(BSQ_SCRATCH_DIR, "spec.bsqapi");
const BSQ_PACKAGE_FILE = join(BSQ_SCRATCH_DIR, "package.json");

const BSQ_CMD_EXE = join(BSQ_ROOT, "impl/bin/cmd/bosque.js");

function generateBSQCode(file: string) {
  const content = readFileSync(file).toString();
  const bsqContent = transpile(content);

  writeFileSync(BSQ_API_FILE, bsqContent);
}

export function automock(file: string, opname: string, args: string) {
  try {
    generateBSQCode(file);

    const jargs = JSON.parse(args);
    ok(Array.isArray(jargs));

    const mockres = execFileSync("node", [
      BSQ_CMD_EXE,
      "symrun",
      BSQ_PACKAGE_FILE,
      "--entrypoint",
      "Main::" + opname,
      "--args",
      `"[${jargs.map((arg) => JSON.stringify(arg)).join(", ")}]"`,
    ]);

    process.stdout.write(mockres.toString() + "\n");
  } catch (ex) {
    process.stdout.write(`${ex}`);
  }
}

export function fuzz(file: string, opname: string) {
  try {
    generateBSQCode(file);

    const mockres = execFileSync("node", [
      BSQ_CMD_EXE,
      "fuzz",
      BSQ_PACKAGE_FILE,
      "--entrypoint",
      "Main::" + opname,
    ]);

    process.stdout.write(mockres.toString() + "\n");
  } catch (ex) {
    process.stdout.write(`${ex}`);
  }
}
