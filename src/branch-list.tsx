import {
  Action,
  ActionPanel,
  Alert,
  Color,
  confirmAlert,
  Form,
  getPreferenceValues,
  Icon,
  Keyboard,
  List,
  open,
  showToast,
  Toast,
  useNavigation,
} from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { BranchItem, getBranchesAndWorktrees, GitRepo, OpenWith, Preferences } from "./utils";
import { execAsync } from "./utils/exec";

export function BranchList(props: { repo: GitRepo }) {
  const { repo } = props;
  const preferences = getPreferenceValues<Preferences>();
  const { data: branches, isLoading, revalidate } = useCachedPromise(getBranchesAndWorktrees, [repo.fullPath]);

  return (
    <List isLoading={isLoading} navigationTitle={`Branches: ${repo.name}`}>
      {branches?.map((branch) => (
        <BranchListItem
          key={branch.name}
          branch={branch}
          repo={repo}
          preferences={preferences}
          revalidate={revalidate}
        />
      ))}
    </List>
  );
}

function BranchListItem(props: {
  branch: BranchItem;
  repo: GitRepo;
  preferences: Preferences;
  revalidate: () => void;
}) {
  const { branch, repo, preferences, revalidate } = props;
  const { push } = useNavigation();

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
            <BranchOpenAction openWith={preferences.openWith1} branch={branch} repo={repo} />
            <BranchOpenAction openWith={preferences.openWith2} branch={branch} repo={repo} />
            {preferences.openWith3 && (
              <BranchOpenAction
                openWith={preferences.openWith3}
                branch={branch}
                repo={repo}
                shortcut={{ modifiers: ["opt"], key: "return" }}
              />
            )}
            {preferences.openWith4 && (
              <BranchOpenAction
                openWith={preferences.openWith4}
                branch={branch}
                repo={repo}
                shortcut={{ modifiers: ["ctrl"], key: "return" }}
              />
            )}
            {preferences.openWith5 && (
              <BranchOpenAction
                openWith={preferences.openWith5}
                branch={branch}
                repo={repo}
                shortcut={{ modifiers: ["shift"], key: "return" }}
              />
            )}
          </ActionPanel.Section>
          <ActionPanel.Section>
            <Action
              title="Create Branch"
              icon={Icon.Plus}
              shortcut={{ modifiers: ["cmd"], key: "n" }}
              onAction={() => push(<CreateBranchForm repo={repo} fromBranch={branch.name} revalidate={revalidate} />)}
            />
            <Action
              title="Create Worktree"
              icon={Icon.NewFolder}
              shortcut={{ modifiers: ["cmd", "shift"], key: "w" }}
              onAction={() => push(<CreateWorktreeForm repo={repo} fromBranch={branch.name} revalidate={revalidate} />)}
            />
            {branch.type === "branch" && (
              <Action
                title="Convert to Worktree"
                icon={Icon.ArrowRight}
                shortcut={{ modifiers: ["cmd", "shift"], key: "t" }}
                onAction={async () => {
                  try {
                    const { stdout } = await execAsync(`gwt path "${branch.name}"`, repo.fullPath);
                    const worktreePath = stdout.trim();

                    const confirmed = await confirmAlert({
                      title: "Convert to Worktree",
                      message: `"${branch.name}" will be added as a worktree at:\n${worktreePath}`,
                      primaryAction: {
                        title: "Convert",
                      },
                    });
                    if (!confirmed) return;

                    await showToast(Toast.Style.Animated, "Converting to worktree…");
                    await execAsync(`git worktree add "${worktreePath}" "${branch.name}"`, repo.fullPath);
                    await showToast(Toast.Style.Success, `Converted ${branch.name} to worktree`);
                    revalidate();
                  } catch (e) {
                    await showToast(Toast.Style.Failure, "Failed to convert to worktree", String(e));
                  }
                }}
              />
            )}
            {!branch.isCurrent && (
              <Action
                title="Delete Branch"
                icon={Icon.Trash}
                style={Action.Style.Destructive}
                shortcut={{ modifiers: ["ctrl"], key: "x" }}
                onAction={async () => {
                  const confirmed = await confirmAlert({
                    title: "Delete Branch",
                    message: `Are you sure you want to delete "${branch.name}"?`,
                    primaryAction: {
                      title: "Delete",
                      style: Alert.ActionStyle.Destructive,
                    },
                  });
                  if (!confirmed) return;

                  try {
                    await showToast(Toast.Style.Animated, "Deleting branch…");
                    if (branch.type === "worktree" && branch.worktreePath) {
                      await execAsync(`git -C "${repo.fullPath}" worktree remove "${branch.worktreePath}"`);
                    }
                    await execAsync(`git -C "${repo.fullPath}" branch -d "${branch.name}"`);
                    await showToast(Toast.Style.Success, `Deleted ${branch.name}`);
                    revalidate();
                  } catch (e) {
                    await showToast(Toast.Style.Failure, "Failed to delete branch", String(e));
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

function BranchOpenAction(props: {
  openWith: OpenWith;
  branch: BranchItem;
  repo: GitRepo;
  shortcut?: Keyboard.Shortcut;
}): JSX.Element {
  const { openWith, branch, repo, shortcut } = props;

  if (branch.type === "worktree") {
    return (
      <Action.Open
        title={`Open in ${openWith.name}`}
        icon={{ fileIcon: openWith.path }}
        target={branch.worktreePath ?? repo.fullPath}
        application={openWith.bundleId}
        shortcut={shortcut}
      />
    );
  }

  return (
    <Action
      title={branch.isCurrent ? `Open in ${openWith.name}` : `Checkout & Open in ${openWith.name}`}
      icon={{ fileIcon: openWith.path }}
      shortcut={shortcut}
      onAction={async () => {
        try {
          if (!branch.isCurrent) {
            await execAsync(`git -C "${repo.fullPath}" checkout "${branch.name}"`);
            await showToast(Toast.Style.Success, `Switched to ${branch.name}`);
          }
          await open(repo.fullPath, openWith.bundleId);
        } catch (e) {
          await showToast(Toast.Style.Failure, "Checkout Failed", String(e));
        }
      }}
    />
  );
}

function CreateBranchForm(props: { repo: GitRepo; fromBranch: string; revalidate: () => void }) {
  const { repo, fromBranch, revalidate } = props;
  const { pop } = useNavigation();

  async function handleSubmit(values: { branchName: string }) {
    const { branchName } = values;
    if (!branchName.trim()) {
      await showToast(Toast.Style.Failure, "Branch name is required");
      return;
    }

    try {
      await showToast(Toast.Style.Animated, "Creating branch…");
      await execAsync(`git -C "${repo.fullPath}" checkout -b "${branchName}" "${fromBranch}"`);
      await showToast(Toast.Style.Success, `Created & switched to ${branchName}`);
      revalidate();
      pop();
    } catch (e) {
      await showToast(Toast.Style.Failure, "Failed to create branch", String(e));
    }
  }

  return (
    <Form
      navigationTitle={`Create Branch from ${fromBranch}`}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Branch" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="branchName" title="Branch Name" placeholder="feature/my-new-branch" />
      <Form.Description title="From" text={fromBranch} />
    </Form>
  );
}

function CreateWorktreeForm(props: { repo: GitRepo; fromBranch: string; revalidate: () => void }) {
  const { repo, fromBranch, revalidate } = props;
  const { pop } = useNavigation();

  async function handleSubmit(values: { branchName: string }) {
    const { branchName } = values;
    if (!branchName.trim()) {
      await showToast(Toast.Style.Failure, "Branch name is required");
      return;
    }

    try {
      await showToast(Toast.Style.Animated, "Creating worktree…");
      const { stdout } = await execAsync(`gwt create "${branchName}" --from "${fromBranch}"`, repo.fullPath);
      const worktreePath = stdout.trim().split("\n").pop() ?? "";
      await showToast(Toast.Style.Success, `Created worktree for ${branchName}`);
      revalidate();
      pop();
    } catch (e) {
      await showToast(Toast.Style.Failure, "Failed to create worktree", String(e));
    }
  }

  return (
    <Form
      navigationTitle={`Create Worktree from ${fromBranch}`}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Worktree" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="branchName" title="Branch Name" placeholder="feature/my-new-branch" />
      <Form.Description title="From" text={fromBranch} />
    </Form>
  );
}
