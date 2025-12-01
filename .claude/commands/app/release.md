# Release

Create a new release by tagging and pushing to GitHub.

## Steps

1. Verify we're on the main branch and it's clean:
   ```bash
   git status
   git branch --show-current
   ```

2. Pull latest changes:
   ```bash
   git pull
   ```

3. Get the latest version tag:
   ```bash
   git tag -l 'v*' --sort=-v:refname | head -1
   ```

4. Calculate version bump options from the current version (e.g., if current is `v1.2.3`):
   - **Patch**: `1.2.4` (bug fixes)
   - **Minor**: `1.3.0` (new features, backwards compatible)
   - **Major**: `2.0.0` (breaking changes)

5. Use AskUserQuestion to let the user choose:
   - Patch bump
   - Minor bump
   - Major bump
   - Custom version (let them type it)

6. Create and push the tag:
   ```bash
   git tag v<VERSION>
   git push origin v<VERSION>
   ```

7. Tell the user:
   - "Release v<VERSION> triggered!"
   - "Monitor the build at: https://github.com/bladnman/promptlight/actions"
   - "Once complete, the release will be at: https://github.com/bladnman/promptlight/releases/tag/v<VERSION>"

## Notes

- The release workflow automatically updates version numbers in config files based on the tag
- Builds are created for macOS (universal, aarch64, x64) and Linux
- If a tag already exists, ask the user if they want to delete it and recreate
- If no tags exist yet, suggest starting with `1.0.0`
