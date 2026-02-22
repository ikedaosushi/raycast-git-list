import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { exec } from "./exec";

export interface InitRepoOptions {
  repoDir: string;
  repoName: string;
  initialCommit: boolean;
}

export interface InitRepoResult {
  repoDir: string;
  commitFailed: boolean;
  commitError?: string;
}

const GITIGNORE_CONTENT = `.DS_Store
.idea/
.vscode/
`;

/**
 * Create a new Git repository with README.md and .gitignore.
 *
 * Throws if the directory already exists or git init fails.
 * If initialCommit is true but commit fails (e.g. missing user.name),
 * the repo is still created — the result indicates the commit failure.
 */
export function initRepo({ repoDir, repoName, initialCommit }: InitRepoOptions): InitRepoResult {
  if (existsSync(repoDir)) {
    throw new Error(`Directory already exists: ${repoDir}`);
  }

  // Create directory
  mkdirSync(repoDir, { recursive: true });

  // Git init + set default branch
  exec("git init", repoDir);
  exec("git branch -M main", repoDir);

  // Generate files
  writeFileSync(join(repoDir, "README.md"), `# ${repoName}\n`);
  writeFileSync(join(repoDir, ".gitignore"), GITIGNORE_CONTENT);

  // Initial commit (optional, allowed to fail gracefully)
  if (initialCommit) {
    try {
      exec("git add -A", repoDir);
      exec('git commit -m "Initial commit"', repoDir);
    } catch (error) {
      return {
        repoDir,
        commitFailed: true,
        commitError: error instanceof Error ? error.message : String(error),
      };
    }
  }

  return { repoDir, commitFailed: false };
}
