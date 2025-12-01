# Release

Create a new release by tagging and pushing to GitHub.

## Usage

Ask the user for the version number if not provided (e.g., "1.0.0", "1.1.0", "2.0.0").

## Steps

1. Verify we're on the main branch and it's clean:
   ```bash
   git status
   ```

2. Pull latest changes:
   ```bash
   git pull
   ```

3. Create and push the tag:
   ```bash
   git tag v<VERSION>
   git push origin v<VERSION>
   ```

4. Tell the user:
   - "Release v<VERSION> triggered!"
   - "Monitor the build at: https://github.com/bladnman/promptlight/actions"
   - "Once complete, the release will be at: https://github.com/bladnman/promptlight/releases/tag/v<VERSION>"

## Notes

- The release workflow automatically updates version numbers in config files based on the tag
- Builds are created for macOS (universal, aarch64, x64) and Linux
- If a tag already exists, ask the user if they want to delete it and recreate
