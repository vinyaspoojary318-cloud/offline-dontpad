#!/usr/bin/env node
/**
 * Offline Dontpad - fully local path-based notepad
 * Notes are stored as plain .txt files under ./notes (or a custom dir)
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const DEFAULT_PORT = 8765;

function getNotesDir(customDir) {
  const dir = customDir || path.join(process.cwd(), "notes");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function safeNotePath(notesDir, notePath) {
  // Prevent path traversal
  const parts = notePath
    .split("/")
    .filter((p) => p && p !== "." && p !== "..");
  if (parts.length === 0) parts.push("home");
  const filePath = path.join(notesDir, ...parts) + ".txt";
  // Ensure parent dirs exist
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  return filePath;
}

function loadNote(notesDir, notePath) {
  const file = safeNotePath(notesDir, notePath);
  if (fs.existsSync(file)) {
    return fs.readFileSync(file, "utf8");
  }
  return "";
}

function saveNote(notesDir, notePath, content) {
  const file = safeNotePath(notesDir, notePath);
  fs.writeFileSync(file, content, "utf8");
}

function listNotes(notesDir) {
  const notes = [];
  function walk(dir, prefix = "") {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name), rel);
      } else if (entry.name.endsWith(".txt")) {
        notes.push(rel.replace(/\.txt$/, ""));
      }
    }
  }
  walk(notesDir);
  return notes.sort();
}

const EDITOR_HTML = (notePath) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline Dontpad – /${notePath}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: #1a1a1a;
      color: #e0e0e0;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      background: #252525;
      padding: 10px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid #333;
      flex-shrink: 0;
    }
    .logo { font-weight: 700; font-size: 1.1rem; color: #4ade80; letter-spacing: -0.5px; }
    .path {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.9rem;
      color: #a0a0a0;
      background: #1a1a1a;
      padding: 4px 10px;
      border-radius: 4px;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .status { font-size: 0.8rem; color: #666; min-width: 90px; text-align: right; }
    .status.saving { color: #fbbf24; }
    .status.saved { color: #4ade80; }
    .status.error { color: #f87171; }
    #editor {
      flex: 1;
      width: 100%;
      border: none;
      outline: none;
      resize: none;
      background: #1a1a1a;
      color: #e0e0e0;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 15px;
      line-height: 1.5;
      padding: 20px;
      tab-size: 2;
    }
    #editor::placeholder { color: #555; }
    .hint {
      position: fixed;
      bottom: 12px;
      right: 16px;
      font-size: 0.75rem;
      color: #555;
      pointer-events: none;
    }
  </style>
</head>
<body>
  <header>
    <div class="logo">Offline Dontpad</div>
    <div class="path">/${notePath}</div>
    <div class="status" id="status">ready</div>
  </header>
  <textarea id="editor" placeholder="Start typing... notes auto-save" spellcheck="false"></textarea>
  <div class="hint">Ctrl+S to force save · works completely offline</div>

  <script>
    const path = ${JSON.stringify(notePath)};
    const editor = document.getElementById("editor");
    const statusEl = document.getElementById("status");
    let saveTimeout = null;
    let lastSaved = "";

    function setStatus(text, cls = "") {
      statusEl.textContent = text;
      statusEl.className = "status " + cls;
    }

    async function load() {
      try {
        const res = await fetch("/api/load?path=" + encodeURIComponent(path));
        if (res.ok) {
          const data = await res.json();
          editor.value = data.content || "";
          lastSaved = editor.value;
          setStatus("loaded", "saved");
        } else {
          setStatus("new note", "saved");
        }
      } catch (e) {
        setStatus("error", "error");
      }
    }

    async function save(force = false) {
      const content = editor.value;
      if (!force && content === lastSaved) return;
      setStatus("saving...", "saving");
      try {
        const res = await fetch("/api/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path, content })
        });
        if (res.ok) {
          lastSaved = content;
          setStatus("saved", "saved");
        } else {
          setStatus("save failed", "error");
        }
      } catch (e) {
        setStatus("save error", "error");
      }
    }

    editor.addEventListener("input", () => {
      setStatus("editing...", "");
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => save(), 800);
    });

    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        save(true);
      }
    });

    load();
  </script>
</body>
</html>`;

const LANDING_HTML = (notes) => {
  const notesList =
    notes.length > 0
      ? `<h3>Existing notes</h3><ul>${notes
          .map((n) => `<li><a href="/${n}">${n}</a></li>`)
          .join("")}</ul>`
      : `<p style="color:#666">No notes yet. Create one by visiting any path.</p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline Dontpad</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #1a1a1a;
      color: #e0e0e0;
      max-width: 640px;
      margin: 60px auto;
      padding: 0 20px;
      line-height: 1.6;
    }
    h1 { color: #4ade80; margin-bottom: 8px; }
    .subtitle { color: #888; margin-bottom: 32px; }
    input {
      width: 100%;
      padding: 12px 16px;
      font-size: 1rem;
      background: #252525;
      border: 1px solid #333;
      border-radius: 6px;
      color: #e0e0e0;
      margin-bottom: 12px;
    }
    button {
      padding: 10px 20px;
      background: #4ade80;
      color: #111;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
    }
    button:hover { background: #22c55e; }
    ul { list-style: none; padding: 0; margin-top: 12px; }
    li { margin: 6px 0; }
    a { color: #4ade80; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .hint { margin-top: 40px; font-size: 0.9rem; color: #666; }
  </style>
</head>
<body>
  <h1>Offline Dontpad</h1>
  <p class="subtitle">Simple local notes · no internet required · auto-saves</p>

  <form id="goForm">
    <input type="text" id="pathInput" placeholder="meeting/notes or any/path/you/want" autofocus>
    <button type="submit">Open / Create</button>
  </form>

  ${notesList}

  <div class="hint">
    <p>Just like the original Dontpad, but 100% offline.</p>
    <p>Notes are stored as plain .txt files in the <code>notes/</code> folder.</p>
  </div>

  <script>
    document.getElementById("goForm").addEventListener("submit", (e) => {
      e.preventDefault();
      let p = document.getElementById("pathInput").value.trim().replace(/^\\/+/, "");
      if (p) window.location.href = "/" + p;
    });
  </script>
</body>
</html>`;
};

function createServer(options = {}) {
  const port = options.port || DEFAULT_PORT;
  const notesDir = getNotesDir(options.notesDir);

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${port}`);
    const pathname = url.pathname;

    // API load
    if (pathname === "/api/load" && req.method === "GET") {
      const notePath = url.searchParams.get("path") || "";
      const content = loadNote(notesDir, notePath);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ content }));
      return;
    }

    // API save
    if (pathname === "/api/save" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        try {
          const data = JSON.parse(body);
          saveNote(notesDir, data.path || "", data.content || "");
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: true }));
        } catch (e) {
          res.writeHead(500);
          res.end(String(e));
        }
      });
      return;
    }

    // Landing page
    if (pathname === "/" || pathname === "") {
      const notes = listNotes(notesDir);
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(LANDING_HTML(notes));
      return;
    }

    // Editor for any other path
    const notePath = pathname.replace(/^\/+/, "");
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(EDITOR_HTML(notePath));
  });

  return { server, port, notesDir };
}

module.exports = { createServer, DEFAULT_PORT };
