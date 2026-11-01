#!/usr/bin/env node

const { createServer, DEFAULT_PORT } = require("../lib/server");
const { exec } = require("child_process");
const os = require("os");

const args = process.argv.slice(2);
let port = DEFAULT_PORT;
let openBrowser = true;
let notesDir = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--port" || args[i] === "-p") {
    port = parseInt(args[++i], 10) || DEFAULT_PORT;
  } else if (args[i] === "--no-open") {
    openBrowser = false;
  } else if (args[i] === "--dir" || args[i] === "-d") {
    notesDir = args[++i];
  } else if (args[i] === "--help" || args[i] === "-h") {
    console.log(`
Offline Dontpad - fully local path-based notepad

Usage:
  dontpad [options]

Options:
  -p, --port <number>   Port to run on (default: 8765)
  -d, --dir <path>      Custom notes directory (default: ./notes)
  --no-open             Don't open the browser automatically
  -h, --help            Show this help

Examples:
  dontpad
  dontpad --port 3000
  dontpad --dir ~/my-notes --no-open
`);
    process.exit(0);
  }
}

const { server, notesDir: usedDir } = createServer({ port, notesDir });

server.listen(port, () => {
  const url = `http://localhost:${port}`;
  console.log(`\n  Offline Dontpad is running!`);
  console.log(`  → ${url}`);
  console.log(`  Notes folder: ${usedDir}`);
  console.log(`\n  Press Ctrl+C to stop\n`);

  if (openBrowser) {
    const platform = os.platform();
    let cmd;
    if (platform === "win32") {
      cmd = `start "" "${url}"`;
    } else if (platform === "darwin") {
      cmd = `open "${url}"`;
    } else {
      // Linux / Ubuntu etc.
      cmd = `xdg-open "${url}" || sensible-browser "${url}" || x-www-browser "${url}"`;
    }
    exec(cmd, (err) => {
      if (err) {
        // Silently ignore if browser can't be opened
      }
    });
  }
});

process.on("SIGINT", () => {
  console.log("\n  Stopped. Your notes are safe.");
  process.exit(0);
});
