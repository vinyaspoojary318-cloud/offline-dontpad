# Offline Dontpad

**The first fully offline path-based Dontpad.**

No internet. No accounts. Just notes.

```bash
npm install -g offline-dontpad
dontpad
```

That's it. Your browser opens and you can start writing at any path:

- `http://localhost:8765/meeting/notes`
- `http://localhost:8765/code/helpers`
- `http://localhost:8765/anything/you/want`

## Features

- 100% offline
- Path-based notes (exactly like the original Dontpad)
- Auto-save while typing
- Notes stored as plain `.txt` files
- Works on Windows, Ubuntu, macOS
- Zero configuration

## Install

```bash
npm install -g offline-dontpad
```

Or run without installing:

```bash
npx offline-dontpad
```

## Usage

```bash
dontpad                  # start on port 8765 and open browser
dontpad --port 3000      # custom port
dontpad --dir ~/notes    # custom notes folder
dontpad --no-open        # don't open browser
```

## How it works

When you run `dontpad`, a tiny local server starts.  
Every path becomes a note file under a `notes/` folder (or the directory you choose).

Example:
- Visiting `/project/ideas` creates `notes/project/ideas.txt`
- Everything is plain text on your disk

## License

MIT
