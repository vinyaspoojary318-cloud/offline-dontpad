# Dontpad (Cloudflare version)

Permanent path-based notes that work from **any computer**.

Same experience as the original Dontpad, but you own it.

## Features

- Unique paths (`/meeting/notes`, `/college/code`, etc.)
- Auto-save
- Permanent storage (Cloudflare KV)
- Works from laptop, college PC, phone — anywhere
- Free tier is more than enough for personal use

## How to deploy (5 minutes)

### 1. Install Wrangler (Cloudflare CLI)

```bash
npm install -g wrangler
```

### 2. Login to Cloudflare

```bash
wrangler login
```

### 3. Create a KV namespace

```bash
wrangler kv namespace create NOTES
```

Copy the `id` that appears.

### 4. Edit `wrangler.toml`

Replace `YOUR_KV_NAMESPACE_ID` with the real ID:

```toml
[[kv_namespaces]]
binding = "NOTES"
id = "abc123..."          # ← paste your real ID here
preview_id = "abc123..."
```

### 5. Deploy

```bash
wrangler deploy
```

You will get a URL like:

```
https://offline-dontpad.your-username.workers.dev
```

Open that URL → you now have your own permanent Dontpad!

## Usage

- Go to `https://your-worker.workers.dev/any/path`
- Type anything → it auto-saves to the cloud
- Open the same path from another computer → same text appears

## Custom domain (optional)

In the Cloudflare dashboard you can add a custom domain (example: `pad.yourdomain.com`).

## License

MIT
