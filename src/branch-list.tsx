import { Action, ActionPanel, Color, getPreferenceValues, List, open, showToast, Toast } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { promisify } from "util";
import { exec } from "child_process";
import { BranchItem, getBranchesAndWorktrees, GitRepo, Preferences } from "./utils";

const execp = promisify(exec);

export function BranchList(props: { repo: GitRepo }) {
  const { repo } = props;
  const preferences = getPreferenceValues<Preferences>();
  const { data: branches, isLoading } = useCachedPromise(getBranchesAndWorktrees, [repo.fullPath]);

  return (
    <List isLoading={isLoading} navigationTitle={`Branches: ${repo.name}`}>
      {branches?.map((branch) => (
        <BranchListItem key={branch.name} branch={branch} repo={repo} preferences={preferences} />
      ))}
    </List>
  );
}

function BranchListItem(props: { branch: BranchItem; repo: GitRepo; preferences: Preferences }) {
  const { branch, repo, preferences } = props;

  const accessories: List.Item.Accessory[] = [];
  if (branch.isCurrent) {
    accessories.push({ tag: { value: "current", color: Color.Green } });
  }
  if (branch.type === "worktree") {
    accessories.push({ tag: { value: "worktree", color: Color.Blue } });
  }

  return (
    <List.Item
      title={branch.name}
      icon={branch.type === "worktree" ? "git-worktree-icon.png" : "git-icon.png"}
      accessories={accessories}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            {branch.type === "worktree" ? (
              <Action.Open
                title={`Open in ${preferences.openWith1.name}`}
                icon={{ fileIcon: preferences.openWith1.path }}
                target={branch.worktreePath ?? repo.fullPath}
                application={preferences.openWith1.bundleId}
              />
            ) : (
              <Action
                title={branch.isCurrent ? `Open in ${preferences.openWith1.name}` : `Checkout & Open in ${preferences.openWith1.name}`}
                icon={{ fileIcon: preferences.openWith1.path }}
                onAction={async () => {
                  try {
                    if (!branch.isCurrent) {
                      await execp(`git -C "${repo.fullPath}" checkout "${branch.name}"`);
                      await showToast(Toast.Style.Success, `Switched to ${branch.name}`);
                    }
                    await open(repo.fullPath, preferences.openWith1.bundleId);
                  } catch (e) {
                    await showToast(Toast.Style.Failure, "Checkout Failed", String(e));
                  }
                }}
              />
            )}
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}
