Build a release version of Promptlight and install it to /Applications.

1. Kill any running Promptlight processes:
```bash
pkill -9 -f "Promptlight" 2>/dev/null || true
pkill -9 -f "promptlight" 2>/dev/null || true
sleep 1
```

2. Build the release bundle:
```bash
cd /Users/mmaher/code/1hb/promptlight && npm run tauri build
```

3. Remove old installation and copy new build:
```bash
rm -rf /Applications/Promptlight.app 2>/dev/null
cp -R /Users/mmaher/code/1hb/promptlight/src-tauri/target/release/bundle/macos/Promptlight.app /Applications/
```

4. Verify installation:
```bash
ls -la /Applications/Promptlight.app
```

5. Tell the user: "Promptlight has been built and installed to /Applications/Promptlight.app. You can launch it from Spotlight or Finder."
