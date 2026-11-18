import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

const cargoBin = join(homedir(), ".cargo", "bin");
const env = {
  ...process.env,
  PATH: [cargoBin, process.env.PATH ?? ""].join(":"),
};

function run(command, args, extraEnv = {}) {
  execFileSync(command, args, { cwd: resolve("."), env: { ...env, ...extraEnv }, stdio: "inherit" });
}

if (!existsSync(join(cargoBin, "rustup"))) {
  execFileSync("sh", ["-c", "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal"], { env, stdio: "inherit" });
}
run("rustup", ["toolchain", "install", "1.88.0", "--profile", "minimal", "--target", "wasm32-unknown-unknown"], { RUSTUP_TOOLCHAIN: "stable" });
if (!existsSync(join(cargoBin, "wasm-pack"))) {
  execFileSync("sh", ["-c", "curl --proto '=https' --tlsv1.2 -sSf https://rustwasm.github.io/wasm-pack/installer/init.sh | sh"], { env, stdio: "inherit" });
}
run("wasm-pack", ["build", "wasm", "--target", "web", "--release", "--out-dir", "pkg", "--out-name", "img2bez_wasm"], { RUSTUP_TOOLCHAIN: "1.88.0" });

const output = resolve("public/img2bez");
mkdirSync(output, { recursive: true });
cpSync(resolve("wasm/pkg"), output, { recursive: true });
