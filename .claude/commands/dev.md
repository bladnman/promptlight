Kill any running dev processes and start a fresh build for user review.

1. Kill existing dev processes:
```bash
lsof -ti:1420 | xargs kill -9 2>/dev/null || true
pkill -9 -f "target/(debug|release)/promptlight" 2>/dev/null || true
pkill -9 -f "node.*tauri" 2>/dev/null || true
sleep 2
```

2. Verify port is free:
```bash
if lsof -i:1420 >/dev/null 2>&1; then
    echo "ERROR: Port 1420 still in use"
    lsof -i:1420
fi
```

3. Start the dev server:
```bash
cd /Users/mmaher/code/1hb/promptlight && npm run tauri:dev
```

4. Wait for app to be ready (poll up to 30 seconds):
```bash
for i in {1..30}; do
    curl -s http://localhost:1420 >/dev/null 2>&1 && break
    sleep 1
done
```

5. Tell the user: "Ready to check out - the app should now be showing"
