/**
 * Offline Dontpad – Cloudflare Workers + KV version
 * Notes are stored permanently in Cloudflare KV and work from any computer.
 */

const DEFAULT_PATH = "home";

function getNoteKey(path) {
  // Clean path and prevent empty / traversal
  const clean = (path || "")
    .split("/")
    .filter((p) => p && p !== "." && p !== "..")
    .join("/") || DEFAULT_PATH;
  return `note:${clean}`;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function html(content) {
  return new Response(content, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

const EDITOR_HTML = (notePath) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dontpad – /${notePath}</title>
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
    <div class="logo">Dontpad</div>
    <div class="path">/${notePath}</div>
    <div class="status" id="status">ready</div>
  </header>
  <textarea id="editor" placeholder="Start typing... notes auto-save to the cloud" spellcheck="false"></textarea>
  <div class="hint">Ctrl+S to force save · works from any computer</div>

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

const LANDING_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dontpad – Offline + Cloud</title>
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
    .hint { margin-top: 40px; font-size: 0.9rem; color: #666; }
  </style>
</head>
<body>
  <h1>Dontpad</h1>
  <p class="subtitle">Path-based notes · permanent · works from any computer</p>

  <form id="goForm">
    <input type="text" id="pathInput" placeholder="meeting/notes or any/path/you/want" autofocus>
    <button type="submit">Open / Create</button>
  </form>

  <div class="hint">
    <p>Just like the original Dontpad.</p>
    <p>Notes are stored permanently in the cloud and sync across all your devices.</p>
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // API: Load note
    if (pathname === "/api/load" && request.method === "GET") {
      const notePath = url.searchParams.get("path") || "";
      const key = getNoteKey(notePath);
      const content = (await env.NOTES.get(key)) || "";
      return json({ content });
    }

    // API: Save note
    if (pathname === "/api/save" && request.method === "POST") {
      try {
        const data = await request.json();
        const key = getNoteKey(data.path || "");
        await env.NOTES.put(key, data.content || "");
        return json({ ok: true });
      } catch (e) {
        return json({ error: String(e) }, 500);
      }
    }

    // Landing page
    if (pathname === "/" || pathname === "") {
      return html(LANDING_HTML);
    }

    // Editor for any other path
    const notePath = pathname.replace(/^\/+/, "") || DEFAULT_PATH;
    return html(EDITOR_HTML(notePath));
  },
};
