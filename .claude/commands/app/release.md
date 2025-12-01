# Release

Create a new release by tagging and pushing to GitHub.

Run the release script:
```bash
./scripts/release.sh
```

The script will:
- Show the current version and offer patch/minor/major bump options
- Let you pick or enter a custom version
- Create and push the tag to trigger the GitHub release workflow

You can also pass arguments directly:
- `./scripts/release.sh patch` - Bump patch version (1.0.0 → 1.0.1)
- `./scripts/release.sh minor` - Bump minor version (1.0.0 → 1.1.0)
- `./scripts/release.sh major` - Bump major version (1.0.0 → 2.0.0)
- `./scripts/release.sh 2.0.0` - Set specific version
