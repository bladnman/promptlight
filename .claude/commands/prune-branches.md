# Prune Local Git Branches

Clean up local git branches that have been deleted on the remote (GitHub).

## Steps

1. First, fetch with prune to update remote tracking info:
   ```bash
   git fetch --prune
   ```

2. Check if current branch is orphaned (gone on remote). If so, switch to main first:
   ```bash
   git checkout main
   ```

3. List branches that are "gone" (deleted on remote):
   ```bash
   git branch -vv | grep ': gone]' | awk '{print $1}'
   ```

4. If there are branches to delete, delete them. For each branch listed above:
   ```bash
   git branch -D <branch-name>
   ```

5. Show the user what was cleaned up with a summary.

## Notes

- If on an orphaned branch, switch to main/master first before deleting
- Never delete main, master, or develop branches
- Use `-D` (force delete) since the remote is already gone
- If no branches need cleanup, tell the user their repo is already clean

## Pro Tip

Suggest the user run this to auto-prune on every fetch:
```bash
git config --global fetch.prune true
```
