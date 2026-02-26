# Git Repos

A [Raycast](https://raycast.com) extension to quickly access your local git repositories and open them in your favorite editor or application.

## Features

- **List Repos** – Browse all local git repositories with fuzzy search
- **Create Repo** – Create a new local repository under [ghq](https://github.com/x-motemen/ghq)-managed directory structure
- **Branch Management** – View, switch, create, and delete branches and worktrees from within the extension
- **Usage-based Sorting** – Most recently used repositories appear at the top
- **Favorites** – Pin repositories to the top of the list
- **Multi-editor Support** – Open repositories in up to 5 configurable applications

## Commands

### List Repos

Browse and search your local git repositories.

| Action | Shortcut | Description |
|--------|----------|-------------|
| Open in App 1 | `↩` | Open in primary application |
| Open in App 2 | `⌘↩` | Open in secondary application |
| Open in App 3 | `⌥↩` | Open in optional application 3 |
| Open in App 4 | `⌃↩` | Open in optional application 4 |
| Open in App 5 | `⇧↩` | Open in optional application 5 |
| Open Branch | `⌘B` | Open branch/worktree list for the repository |
| Open in All Applications | — | Open in all configured applications at once |
| Open in GitHub | `⌘⇧G` | Open repository on GitHub |
| Open With | `⌘O` | Open with system app picker |
| Add / Remove Favorite | `⌘⇧F` | Toggle repository favorite status |
| Create Quicklink | `⌘⇧L` | Create a Raycast quicklink for the repository |
| Copy Path | `⌘.` | Copy repository path to clipboard |

#### Filtering

Use the dropdown in the search bar to filter by repository type:

- **All** – Show all repositories
- **Normal** – Standard git repositories only
- **Submodule** – Git submodules (requires "Include submodules" preference)
- **Worktree** – Git worktrees

### Branch List

Opened from the List Repos command (`⌘B`). Displays all branches and worktrees for the selected repository.

| Action | Shortcut | Description |
|--------|----------|-------------|
| Open in App | `↩` | Checkout branch (if needed) and open in editor |
| Create Branch | `⌘N` | Create a new branch from the selected branch |
| Create Worktree | `⌘⇧W` | Create a new git worktree from the selected branch |
| Delete Branch | `⌃X` | Delete the selected branch (destructive) |

Branches show a **current** tag for the active branch and a **worktree** tag for worktree-linked branches.

### Create Repo

Create a new local git repository under a [ghq](https://github.com/x-motemen/ghq)-managed directory.

The repository is created at `<ghq root>/<hostname>/<org>/<repo-name>`.

| Field | Description |
|-------|-------------|
| Hostname | Git host (e.g. `github.com`) — detected from existing ghq directories |
| Org / Owner | Organization or username — detected from existing ghq directories |
| Repository Name | Name for the new repository (alphanumeric, `.`, `-`, `_` allowed) |
| Create initial commit | Automatically create an initial empty commit |
| Open After Create | Open in Cursor, VS Code, Finder, or none after creation |

## Preferences

| Preference | Description | Default |
|-----------|-------------|---------|
| Path to scan for Git Repos | Colon-separated list of directories to scan. `~/` is expanded. | *(required)* |
| Max scan depth | How deep to scan for `.git` directories (2–6) | `3` |
| Include submodules | Include git submodules in scan results | `false` |
| Search by | Match search query against `Name` or `Path` | `Name` |
| Open with 1–5 | Applications to open repositories in | App 1: VS Code, App 2: Finder |

## Requirements

- [Raycast](https://raycast.com) for macOS
- [ghq](https://github.com/x-motemen/ghq) — required for the **Create Repo** command
  ```
  brew install ghq
  ```
- `gwt` CLI tool — required for the **Create Worktree** action in Branch List

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build
npm run build

# Lint
npm run lint
npm run fix-lint
```

## License

MIT
