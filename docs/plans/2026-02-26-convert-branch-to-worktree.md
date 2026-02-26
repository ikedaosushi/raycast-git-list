# Convert Branch to Worktree Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "Convert to Worktree" action to the branch list that converts an existing local branch into a gwt-managed worktree.

**Architecture:** Add an `<Action>` inside the existing `ActionPanel.Section` in `BranchListItem`. The action calls `gwt path <branch>` to determine the target path, shows a confirmation dialog with that path, then runs `git worktree add <path> <branch>` to create the worktree.

**Tech Stack:** React/TSX, Raycast API (`Action`, `confirmAlert`, `Alert`, `showToast`, `Toast`), `execAsync` utility already used in the file.

---

### Task 1: Add "Convert to Worktree" Action to BranchListItem

**Files:**
- Modify: `src/branch-list.tsx:52-95` (the second `ActionPanel.Section`)

**Step 1: Add the action inside the second `ActionPanel.Section`**

Open `src/branch-list.tsx`. In `BranchListItem`, find the second `<ActionPanel.Section>` (the one containing "Create Branch", "Create Worktree", "Delete Branch"). Add the following block **after** the "Create Worktree" `<Action>` and **before** the "Delete Branch" conditional:

```tsx
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
```

**Step 2: Verify `execAsync` accepts a `cwd` argument**

Read `src/utils/exec.ts` (or wherever `execAsync` is defined) to confirm its signature. The existing `CreateWorktreeForm` calls it as `execAsync(\`gwt create ...\`, repo.fullPath)`, so the second argument is `cwd`. Use the same pattern.

**Step 3: Check for lint errors**

Run:
```bash
npm run lint
```
Expected: no errors. Fix any if present.

**Step 4: Build to verify TypeScript compiles**

Run:
```bash
npm run build
```
Expected: exits with code 0, no TypeScript errors.

**Step 5: Manual verification**

Run:
```bash
npm run dev
```
Open Raycast, navigate to a repo's branch list, select a branch that is **not** a worktree, and confirm:
- "Convert to Worktree" action appears with `cmd+shift+t`
- Action does **not** appear on branches that are already worktrees
- Confirmation dialog shows the correct path
- After confirming, the branch appears as a worktree in the list (blue "worktree" tag)
- Cancelling the dialog does nothing

**Step 6: Commit**

```bash
git add src/branch-list.tsx
git commit -m "feat: add Convert to Worktree action in branch list"
```
