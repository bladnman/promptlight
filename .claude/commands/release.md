# Release Command

Build and publish a new release to GitHub.

## Instructions

When the user runs `/release`, perform these steps:

1. **Get the version** - Ask the user what version to release (e.g., "1.0.1", "1.1.0"). If they don't specify, suggest incrementing the patch version from the current version in package.json.

2. **Update version files** - Update the version in:
   - `package.json`
   - `src-tauri/Cargo.toml`
   - `src-tauri/tauri.conf.json`

3. **Run checks** - Run `npm run check` to ensure lint, build, and tests pass.

4. **Build the release** - Run the build with signing:
   ```bash
   npm run tauri build
   ```
   Then sign with the PromptLight Dev certificate:
   ```bash
   codesign --force --deep --sign "PromptLight Dev" --entitlements src-tauri/entitlements.plist src-tauri/target/release/bundle/macos/Promptlight.app
   ```

5. **Install locally** - Stop any running instance and install to /Applications:
   ```bash
   pkill -9 -f "[Pp]romptlight" || true
   sleep 1
   rm -rf /Applications/Promptlight.app
   cp -R src-tauri/target/release/bundle/macos/Promptlight.app /Applications/
   ```

6. **Commit and tag** - Commit the version changes and create a git tag:
   ```bash
   git add package.json src-tauri/Cargo.toml src-tauri/tauri.conf.json
   git commit -m "chore: bump version to vX.Y.Z"
   git tag vX.Y.Z
   git push origin main --tags
   ```

7. **Create GitHub release** - Use `gh` CLI to create a release and upload the DMG:
   ```bash
   gh release create vX.Y.Z \
     --title "PromptLight vX.Y.Z" \
     --notes "## PromptLight vX.Y.Z

   ### Installation

   **macOS:**
   - Download the DMG file below
   - Open the DMG and drag PromptLight to Applications
   - On first launch, right-click and select 'Open' to bypass Gatekeeper

   **First-time setup:**
   - Grant Accessibility permission in System Settings > Privacy & Security > Accessibility
   - This enables the paste-into-app feature

   ### Changelog
   See commit history for changes." \
     src-tauri/target/release/bundle/dmg/PromptLight_X.Y.Z_aarch64.dmg
   ```

8. **Report success** - Tell the user the release URL and that it's published.

## Notes

- The build is done locally with the "PromptLight Dev" certificate for stable identity
- Users who download will have persistent accessibility permissions across updates
- Only macOS ARM64 builds are created (user's machine architecture)
