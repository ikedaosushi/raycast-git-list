import { execSync } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";

const PATH_ADDITIONS = [
  join(homedir(), ".local/bin"),
  "/opt/homebrew/bin",
  "/opt/homebrew/sbin",
  "/usr/local/bin",
  "/usr/bin",
  "/bin",
];

const env: Record<string, string> = {
  ...Object.fromEntries(Object.entries(process.env).filter((e): e is [string, string] => e[1] != null)),
  HOME: homedir(),
  PATH: [...PATH_ADDITIONS, process.env.PATH].filter(Boolean).join(":"),
};

/**
 * Execute a shell command and return trimmed stdout.
 * Throws on non-zero exit code.
 */
export function exec(command: string, cwd?: string): string {
  return execSync(command, {
    shell: "/bin/zsh",
    env,
    cwd,
    timeout: 15_000,
    encoding: "utf-8",
  }).trim();
}
