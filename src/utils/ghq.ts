import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { exec } from "./exec";

const FALLBACK_GHQ_ROOT = join(homedir(), "ghq");

/**
 * Get the ghq root directory.
 * Tries `ghq root` command first, falls back to ~/ghq.
 */
export function getGhqRoot(): string {
  try {
    const root = exec("ghq root");
    if (root && existsSync(root)) {
      return root;
    }
  } catch {
    // ghq command not found or failed — try fallback
  }

  if (existsSync(FALLBACK_GHQ_ROOT)) {
    return FALLBACK_GHQ_ROOT;
  }

  throw new Error("ghq root not found. Install ghq or ensure ~/ghq exists.");
}

/**
 * List hostname directories under ghq root.
 */
export function listHostnames(ghqRoot: string, preferred: string[] = []): string[] {
  return sortWithPreferred(listDirectories(ghqRoot), preferred);
}

/**
 * List org/owner directories under a hostname.
 */
export function listOrgs(ghqRoot: string, hostname: string, preferred: string[] = []): string[] {
  return sortWithPreferred(listDirectories(join(ghqRoot, hostname)), preferred);
}

/**
 * List visible subdirectories (excludes hidden dirs like .git).
 */
function listDirectories(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name);
}

/**
 * Sort items with preferred ones first (in specified order),
 * then remaining items alphabetically.
 */
function sortWithPreferred(items: string[], preferred: string[]): string[] {
  const preferredSet = new Set(preferred);
  const top = preferred.filter((p) => items.includes(p));
  const rest = items.filter((i) => !preferredSet.has(i)).sort((a, b) => a.localeCompare(b));
  return [...top, ...rest];
}
