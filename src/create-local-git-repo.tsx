import { Action, ActionPanel, Form, Toast, open, popToRoot, showToast } from "@raycast/api";
import { useEffect, useState } from "react";
import { join } from "node:path";
import { exec } from "./utils/exec";
import { getGhqRoot, listHostnames, listOrgs } from "./utils/ghq";
import { initRepo } from "./utils/git";
import { PREFERRED_HOSTNAMES, PREFERRED_ORGS } from "./config";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const REPO_NAME_PATTERN = /^[a-zA-Z0-9._-]+$/;

type OpenAfter = "none" | "cursor" | "vscode" | "finder";

interface FormValues {
  hostname: string;
  org: string;
  repoName: string;
  initialCommit: boolean;
  openAfter: OpenAfter;
}

// ─────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────

function validateRepoName(value: string | undefined): string | undefined {
  if (!value || value.trim().length === 0) {
    return "Repository name is required";
  }
  if (!REPO_NAME_PATTERN.test(value)) {
    return "Only alphanumeric, dot, hyphen, underscore allowed";
  }
  return undefined;
}

// ─────────────────────────────────────────────
// Open helpers
// ─────────────────────────────────────────────

const EDITOR_COMMANDS: Record<string, string> = {
  cursor: "cursor",
  vscode: "code",
};

async function openAfterCreate(repoDir: string, action: OpenAfter) {
  if (action === "none") return;

  if (action === "finder") {
    await open(repoDir);
    return;
  }

  const cli = EDITOR_COMMANDS[action];
  if (cli) {
    try {
      exec(`${cli} "${repoDir}"`);
    } catch {
      await showToast({
        style: Toast.Style.Failure,
        title: `"${cli}" command not found`,
        message: "Opening in Finder instead",
      });
      await open(repoDir);
    }
  }
}

// ─────────────────────────────────────────────
// Command
// ─────────────────────────────────────────────

export default function Command() {
  const [ghqRoot, setGhqRoot] = useState("");
  const [hostnames, setHostnames] = useState<string[]>([]);
  const [selectedHostname, setSelectedHostname] = useState("");
  const [orgs, setOrgs] = useState<string[]>([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [repoNameError, setRepoNameError] = useState<string | undefined>();

  // ── Load ghq root & hostnames ──
  useEffect(() => {
    try {
      const root = getGhqRoot();
      const hosts = listHostnames(root, PREFERRED_HOSTNAMES);

      if (hosts.length === 0) {
        showToast({ style: Toast.Style.Failure, title: "No hostname directories found under ghq root" });
        return;
      }

      setGhqRoot(root);
      setHostnames(hosts);
      setSelectedHostname(hosts[0]);
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to initialize",
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Reload orgs when hostname changes ──
  useEffect(() => {
    if (!ghqRoot || !selectedHostname) {
      setOrgs([]);
      setSelectedOrg("");
      return;
    }

    try {
      const preferred = PREFERRED_ORGS[selectedHostname] ?? [];
      const orgList = listOrgs(ghqRoot, selectedHostname, preferred);
      setOrgs(orgList);
      setSelectedOrg(orgList[0] ?? "");
    } catch {
      setOrgs([]);
      setSelectedOrg("");
    }
  }, [ghqRoot, selectedHostname]);

  // ── Submit ──
  async function handleSubmit(values: FormValues) {
    const { hostname, org, repoName, initialCommit, openAfter } = values;

    // Guard: required fields
    if (!hostname || !org || !repoName) {
      await showToast({ style: Toast.Style.Failure, title: "All fields are required" });
      return;
    }

    // Guard: repo name validation
    const nameError = validateRepoName(repoName);
    if (nameError) {
      setRepoNameError(nameError);
      return;
    }

    const repoDir = join(ghqRoot, hostname, org, repoName);

    try {
      await showToast({ style: Toast.Style.Animated, title: "Creating repository…" });

      const result = initRepo({ repoDir, repoName, initialCommit });

      if (result.commitFailed) {
        await showToast({
          style: Toast.Style.Success,
          title: "Repository created (commit failed)",
          message: result.commitError,
        });
      } else {
        await showToast({
          style: Toast.Style.Success,
          title: "Repository created",
          message: repoDir,
        });
      }

      await openAfterCreate(repoDir, openAfter);
      await popToRoot();
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to create repository",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ── Render ──
  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Repository" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Dropdown id="hostname" title="Hostname" value={selectedHostname} onChange={setSelectedHostname}>
        {hostnames.map((h) => (
          <Form.Dropdown.Item key={h} value={h} title={h} />
        ))}
      </Form.Dropdown>

      <Form.Dropdown id="org" title="Org / Owner" value={selectedOrg} onChange={setSelectedOrg}>
        {orgs.map((o) => (
          <Form.Dropdown.Item key={o} value={o} title={o} />
        ))}
      </Form.Dropdown>

      <Form.TextField
        id="repoName"
        title="Repository Name"
        placeholder="sample-repo"
        error={repoNameError}
        onChange={(value) => {
          if (repoNameError) {
            setRepoNameError(validateRepoName(value));
          }
        }}
        onBlur={(event) => {
          setRepoNameError(validateRepoName(event.target.value as string));
        }}
      />

      <Form.Checkbox id="initialCommit" label="Create initial commit" defaultValue={true} />

      <Form.Dropdown id="openAfter" title="Open After Create" defaultValue="vscode">
        <Form.Dropdown.Item value="vscode" title="VS Code" />
        <Form.Dropdown.Item value="cursor" title="Cursor" />
        <Form.Dropdown.Item value="finder" title="Finder" />
        <Form.Dropdown.Item value="none" title="None" />
      </Form.Dropdown>
    </Form>
  );
}
