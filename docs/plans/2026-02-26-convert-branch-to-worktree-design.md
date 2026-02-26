# Design: Convert Branch to Worktree Action

## Overview

Add a "Convert to Worktree" action to the branch list (`BranchListItem`) that converts an existing local branch into a git worktree using gwt's directory convention.

## Background

`gwt create <branch>` creates a new branch as a worktree, but there is no gwt command to convert an existing branch. The combination of `gwt path <branch>` + `git worktree add <path> <branch>` achieves the equivalent result with gwt-compatible paths.

## Design

### Target Component

`BranchListItem` in `src/branch-list.tsx`, inside the second `ActionPanel.Section`.

### Visibility

Show only when `branch.type === "branch"` (hide for branches already converted to worktrees).

### Execution Flow

1. User selects "Convert to Worktree" action
2. Run `gwt path <branch>` to get the target worktree path
3. Show confirmation dialog:
   - Title: `Convert to Worktree`
   - Message: `"<branch-name>" will be added as a worktree at: <path>`
   - Primary button: `Convert`
4. On confirm: run `git worktree add <path> <branch>` (executed in `repo.fullPath` context)
5. Show success toast and call `revalidate()` to refresh the list

### Keyboard Shortcut

`{ modifiers: ["cmd", "shift"], key: "t" }`

### Error Handling

On failure, show a failure toast: `"Failed to convert to worktree"` with the error message.

## Implementation Location

`src/branch-list.tsx` — add an `<Action>` element inside the existing `ActionPanel.Section` alongside "Create Branch", "Create Worktree", and "Delete Branch".
