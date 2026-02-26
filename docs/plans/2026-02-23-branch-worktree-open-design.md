# Branch/Worktree Open Action Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** list repoのActionPanelから「Open Branch」アクションでブランチ/worktree一覧に遷移し、選択したブランチをcheckout+エディタで開く、またはworktreeを直接エディタで開く機能を追加する。

**Architecture:** 新規ファイル `src/branch-list.tsx` にBranchListコンポーネントを作成。list.tsxからuseNavigation().push()で遷移する。git branch / git worktree listコマンドでデータ取得し、マージして表示。

**Tech Stack:** React, @raycast/api (List, Action, useNavigation, showToast), child_process (exec)

---

### Task 1: BranchItem型とgitコマンドユーティリティをutils.tsxに追加

**Files:**
- Modify: `src/utils.tsx` (末尾に追加)

**Step 1: BranchItem interfaceをexportする**

`src/utils.tsx` の末尾に以下を追加:

```typescript
export interface BranchItem {
  name: string;
  type: "branch" | "worktree";
  isCurrent: boolean;
  worktreePath?: string;
}
```

**Step 2: ブランチ一覧取得関数を追加**

```typescript
export async function getLocalBranches(repoPath: string): Promise<BranchItem[]> {
  const { stdout } = await execp(`git -C "${repoPath}" branch --format="%(refname:short)|%(HEAD)"`);
  return stdout
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => {
      const [name, head] = line.split("|");
      return {
        name: name.trim(),
        type: "branch" as const,
        isCurrent: head.trim() === "*",
      };
    });
}
```

**Step 3: worktree一覧取得関数を追加**

```typescript
export async function getWorktrees(repoPath: string): Promise<{ branch: string; path: string }[]> {
  const { stdout } = await execp(`git -C "${repoPath}" worktree list --porcelain`);
  const worktrees: { branch: string; path: string }[] = [];
  let current: { branch: string; path: string } = { branch: "", path: "" };

  for (const line of stdout.split("\n")) {
    if (line.startsWith("worktree ")) {
      current = { branch: "", path: line.replace("worktree ", "") };
    } else if (line.startsWith("branch ")) {
      current.branch = line.replace("branch refs/heads/", "");
      worktrees.push(current);
    }
  }

  return worktrees;
}
```

**Step 4: ブランチとworktreeをマージする関数を追加**

```typescript
export async function getBranchesAndWorktrees(repoPath: string): Promise<BranchItem[]> {
  const [branches, worktrees] = await Promise.all([
    getLocalBranches(repoPath),
    getWorktrees(repoPath),
  ]);

  const worktreeMap = new Map(worktrees.map((wt) => [wt.branch, wt.path]));

  return branches.map((branch) => {
    const wtPath = worktreeMap.get(branch.name);
    if (wtPath && wtPath !== repoPath) {
      return { ...branch, type: "worktree" as const, worktreePath: wtPath };
    }
    return branch;
  });
}
```

**Step 5: 動作確認**

Run: `cd /Users/yutaro/ghq/ikedaosushi-github.com/ikedaosushi/raycast-git-list && npm run build`
Expected: ビルド成功（型エラーなし）

**Step 6: Commit**

```bash
git add src/utils.tsx
git commit -m "feat: add branch/worktree data fetching utilities"
```

---

### Task 2: BranchListコンポーネントの作成

**Files:**
- Create: `src/branch-list.tsx`

**Step 1: BranchListコンポーネントを作成**

```typescript
import { Action, ActionPanel, Color, getPreferenceValues, Icon, List, open, showToast, Toast } from "@raycast/api";
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
                target={branch.worktreePath!}
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
```

**Step 2: 動作確認**

Run: `cd /Users/yutaro/ghq/ikedaosushi-github.com/ikedaosushi/raycast-git-list && npm run build`
Expected: ビルド成功

**Step 3: Commit**

```bash
git add src/branch-list.tsx
git commit -m "feat: add BranchList component for branch/worktree selection"
```

---

### Task 3: list.tsxにOpen Branchアクションを追加

**Files:**
- Modify: `src/list.tsx`

**Step 1: importにuseNavigationとBranchListを追加**

`src/list.tsx` の1行目のimportに `useNavigation` を追加:

```typescript
import {
  Action,
  ActionPanel,
  Application,
  Color,
  getPreferenceValues,
  Icon,
  Image,
  Keyboard,
  List,
  open,
  useNavigation,
} from "@raycast/api";
```

BranchListのimportを追加（既存のimportの後）:

```typescript
import { BranchList } from "./branch-list";
```

**Step 2: GitRepoListItemにOpen Branchアクションを追加**

`GitRepoListItem` 関数内で、`Action.OpenWith` の直前（168行目付近）に以下を追加:

```typescript
<Action
  title="Open Branch"
  icon={Icon.Branch}
  shortcut={{ modifiers: ["cmd"], key: "b" }}
  onAction={() => {
    push(<BranchList repo={repo} />);
  }}
/>
```

`GitRepoListItem` 関数の先頭で `useNavigation` を呼び出す:

```typescript
const { push } = useNavigation();
```

**Step 3: 動作確認**

Run: `cd /Users/yutaro/ghq/ikedaosushi-github.com/ikedaosushi/raycast-git-list && npm run build`
Expected: ビルド成功

**Step 4: 手動テスト**

Run: `cd /Users/yutaro/ghq/ikedaosushi-github.com/ikedaosushi/raycast-git-list && npm run dev`

手動確認項目:
1. リポジトリ一覧が表示される
2. リポジトリを選んで Cmd+B で ブランチ一覧画面に遷移する
3. ブランチ一覧にローカルブランチが表示される
4. currentブランチに「current」タグが表示される
5. worktreeには「worktree」タグとworktreeアイコンが表示される
6. ブランチを選択するとcheckout+エディタで開く
7. worktreeを選択するとworktreeパスでエディタが開く
8. checkout失敗時にtoastでエラーが表示される

**Step 5: Commit**

```bash
git add src/list.tsx
git commit -m "feat: add Open Branch action to repo list"
```
