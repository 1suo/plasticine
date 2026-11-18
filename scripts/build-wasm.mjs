import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

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

const wasmEntry = pathToFileURL(resolve("wasm/pkg/img2bez_wasm.js")).href;
const wasm = await import(wasmEntry);
const wasmBytes = new Uint8Array(readFileSync(resolve("wasm/pkg/img2bez_wasm_bg.wasm")));
await wasm.default(wasmBytes);
const smokePng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAa0lEQVR42u3QwQkAQAgDwfTftNeDCHI4C/nmManjBQAAAAAAAADQP0hWBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACYB/g9AAAAAAAA4HAPzWnUpP0odv0AAAAASUVORK5CYII=", "base64");
const smokeGlyph = JSON.parse(wasm.traceToJson(new Uint8Array(smokePng), JSON.stringify({
  glyph: "A", unicode: "0041", profile: "wild", style: "basic",
  targetHeight: 500, yOffset: -100, grid: 2, threshold: 180,
  refine: true, siteHead: true, cornerHead: false,
})));
if (!smokeGlyph.outline?.contours?.length || !(smokeGlyph.advance?.width > 0)) {
  throw new Error("img2bez WASM smoke trace returned no usable glyph outline");
}

const output = resolve("public/img2bez");
mkdirSync(output, { recursive: true });
cpSync(resolve("wasm/pkg"), output, { recursive: true });
