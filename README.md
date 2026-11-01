# Offline Dontpad

**Path-based notes like the original Dontpad — with two powerful versions.**

| Version | Best for | Notes location |
|---------|----------|----------------|
| **Offline** | No internet needed | Your computer only |
| **Cloudflare** | Use from any computer | Permanent cloud storage |

---

## 1. Offline Version (Local)

100% offline. No internet required.

### Install & Run

```bash
npm install -g offline-dontpad
dontpad
```

Or without installing:

```bash
npx offline-dontpad
```

Your browser opens automatically. Start writing at any path:

- `http://localhost:8765/meeting/notes`
- `http://localhost:8765/college/code`
- `http://localhost:8765/anything/you/want`

### Features
- Fully offline
- Auto-save
- Notes saved as plain `.txt` files
- Works on Windows, Ubuntu, macOS

### Options

```bash
dontpad                  # start on port 8765 + open browser
dontpad --port 3000      # custom port
dontpad --dir ~/notes    # custom notes folder
dontpad --no-open        # don't open browser
```

---

## 2. Cloudflare Version (Permanent + Multi-device)

Notes are stored permanently in the cloud.  
Write on your laptop → open the same path on college computer → same text appears.

### How to deploy

Full instructions are inside the [`cloudflare/`](./cloudflare) folder.

Quick steps:

1. `cd cloudflare`
2. `npm install -g wrangler`
3. `wrangler login`
4. `wrangler kv namespace create NOTES`
5. Put the KV id into `wrangler.toml`
6. `wrangler deploy`

You get a permanent URL like:

```
https://offline-dontpad.your-name.workers.dev
```

Now the same path works from **any computer**.

---

## Which one should I use?

- Only one computer / want zero internet → **Offline version**
- Want notes on laptop + college + phone → **Cloudflare version**

You can use both.

---

## License

MIT
