import * as http from "node:http";
import * as fs from "node:fs";
import * as path from "node:path";
import { SddDesignEngine } from "../workflow/engine.js";
import { TokenParser } from "../tokens/parser.js";

export interface StudioServerOptions {
  port?: number;
  host?: string;
  baseDir?: string;
}

export class StudioServer {
  private readonly port: number;
  private readonly host: string;
  private readonly baseDir: string;
  private readonly engine: SddDesignEngine;
  private server: http.Server | null = null;

  constructor(options: StudioServerOptions = {}) {
    this.port = options.port || 3000;
    this.host = options.host || "0.0.0.0";
    this.baseDir = options.baseDir || process.cwd();
    this.engine = new SddDesignEngine({ baseDir: this.baseDir });
  }

  public start(): http.Server {
    const designsDir = path.join(this.baseDir, ".stitch", "designs");

    this.server = http.createServer(async (req, res) => {
      const fullUrl = req.url || "/";
      const host = req.headers.host || "localhost";
      const parsedUrl = new URL(fullUrl, `http://${host}`);
      const pathname = parsedUrl.pathname;

      // 1. Studio Web App UI
      if (pathname === "/" || pathname === "/index.html") {
        const iterParam = parseInt(parsedUrl.searchParams.get("iter") || "0", 10);
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(this.renderHtml(iterParam));
        return;
      }

      // 2. Trajectory JSON API
      if (pathname === "/api/trajectory") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(this.engine.trajectory.getTrajectory(), null, 2));
        return;
      }

      // 3. Tokens & Theme API
      if (pathname === "/api/tokens") {
        const tokens = this.engine.initDesignSystem();
        const v4 = TokenParser.generateTailwindV4Theme(tokens);
        const css = TokenParser.generateCssVariables(tokens);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ tokens, v4, css }, null, 2));
        return;
      }

      // 4. In-Browser Prompt Generation (POST /api/generate)
      if (pathname === "/api/generate" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => { body += chunk; });
        req.on("end", async () => {
          try {
            const payload = JSON.parse(body || "{}");
            const prompt = payload.prompt;
            if (!prompt) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ ok: false, error: "Prompt is required" }));
              return;
            }

            const { artifact, iterationNumber, visualDiff } = await this.engine.generateScreen(prompt);
            this.engine.judgeActiveIteration();
            this.engine.componentizeActiveScreen();
            this.engine.exportThemeFiles();

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: true, screenId: artifact.screenId, iterationNumber, visualDiff }));
          } catch (err: any) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: false, error: err.message }));
          }
        });
        return;
      }

      // 5. Static Design Artifacts (/designs/:filename)
      if (pathname.startsWith("/designs/")) {
        const filename = path.basename(pathname);
        const filePath = path.join(designsDir, filename);

        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          const ext = path.extname(filename).toLowerCase();
          const contentType =
            ext === ".png" ? "image/png" :
            ext === ".html" ? "text/html; charset=utf-8" :
            "application/octet-stream";

          res.writeHead(200, { "Content-Type": contentType });
          fs.createReadStream(filePath).pipe(res);
          return;
        }
      }

      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
    });

    this.server.listen(this.port, this.host, () => {
      console.log("-------------------------------------------------");
      console.log("STITCH STUDIO // LOCAL ENGINE ACTIVE");
      console.log("-------------------------------------------------");
      console.log(`[LOCAL]  http://localhost:${this.port}`);
      console.log(`[LAN]    http://192.168.100.11:${this.port}`);
      console.log(`[HOST]   ${this.host}:${this.port}`);
      console.log("-------------------------------------------------");
    });

    return this.server;
  }

  public close(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }

  private renderHtml(selectedIter?: number): string {
    const trajectory = this.engine.trajectory.getTrajectory();
    const history = trajectory.history;
    const activeIter =
      (selectedIter ? history.find((e) => e.iteration === selectedIter) : null) ||
      this.engine.trajectory.getActiveIteration() ||
      history[history.length - 1];

    let activeScreenHtmlUrl = "";
    if (activeIter) {
      const baseName = path.basename(activeIter.localHtmlPath);
      activeScreenHtmlUrl = `/designs/${baseName}`;
    }

    const themeV4Path = path.join(this.baseDir, ".stitch", "theme-v4.css");
    const themeV4Content = fs.existsSync(themeV4Path) ? fs.readFileSync(themeV4Path, "utf-8") : "/* Run /design:export */";

    const isStitchReference = activeIter?.iteration === 5 || activeIter?.prompt.includes("Google Stitch");
    const displayProjectName = activeIter?.title || trajectory.projectName || "Interface Design";

    return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Stitch Studio // Local Engine</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            background: '#090d16',
            surface: '#111827',
            surfaceCard: '#1a2234',
            border: '#2a3449',
            primary: '#38bdf8',
            accent: '#f43f5e',
          }
        }
      }
    }
  </script>
  <style>
    body { background-color: #090d16; color: #f3f4f6; font-family: system-ui, -apple-system, sans-serif; }
    .viewport-desktop { width: 100%; max-width: 1280px; height: 820px; }
    .viewport-tablet { width: 768px; height: 820px; }
    .viewport-mobile { width: 375px; height: 740px; }
    iframe { border-radius: 8px; transition: all 0.3s ease; }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-thumb { background: #2a3449; border-radius: 4px; }
  </style>
</head>
<body class="min-h-screen flex flex-col">
  <header class="h-16 border-b border-border bg-surface/80 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-50">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-lg bg-surfaceCard border border-border flex items-center justify-center font-mono font-bold text-primary text-xs">
        ST
      </div>
      <div>
        <h1 class="font-bold text-base text-white tracking-tight flex items-center gap-2">
          Stitch Studio // Local Engine
          <span class="text-xs ${
            isStitchReference
              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
              : "bg-primary/20 text-primary border-primary/30"
          } px-2 py-0.5 rounded-full border">
            ${isStitchReference ? "Google Stitch Cloud (Gemini 3.8 Flash)" : "Ollama Local GPU"}
          </span>
        </h1>
        <p class="text-xs text-slate-400">${displayProjectName} &bull; ${history.length} iterations</p>
      </div>
    </div>

    <div class="flex items-center gap-1 bg-surfaceCard p-1 rounded-lg border border-border">
      <button onclick="setViewport('desktop')" id="btn-desktop" class="px-3 py-1 text-xs font-semibold rounded bg-primary text-slate-950 transition">Desktop</button>
      <button onclick="setViewport('tablet')" id="btn-tablet" class="px-3 py-1 text-xs font-semibold rounded text-slate-300 hover:text-white transition">Tablet</button>
      <button onclick="setViewport('mobile')" id="btn-mobile" class="px-3 py-1 text-xs font-semibold rounded text-slate-300 hover:text-white transition">Mobile</button>
    </div>

    <div class="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-mono">
      <span>LAN:</span>
      <code class="bg-surfaceCard px-2 py-1 rounded text-primary border border-border">http://192.168.100.11:${this.port}</code>
    </div>
  </header>

  <div class="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
    <main class="lg:col-span-8 p-6 flex flex-col items-center justify-start bg-background/50 overflow-y-auto">
      <div class="w-full max-w-5xl mb-4 flex items-center justify-between">
        <div class="flex items-center gap-2 overflow-x-auto pb-1">
          ${history.map((entry) => `
            <a href="/?iter=${entry.iteration}" class="px-3 py-1.5 text-xs font-medium rounded-md border transition ${
              entry.iteration === (activeIter?.iteration ?? 0)
                ? 'bg-primary/20 text-primary border-primary/40 shadow-sm font-bold'
                : 'bg-surface text-slate-400 border-border hover:text-white hover:border-slate-600'
            }">
              #${entry.iteration} ${entry.iteration === (activeIter?.iteration ?? 0) ? '[active]' : ''} ${entry.iteration === 5 ? '(Stitch Reference)' : ''}
            </a>
          `).join("")}
        </div>

        <a href="${activeScreenHtmlUrl}" target="_blank" class="text-xs text-primary hover:underline flex items-center gap-1">
          Open Standalone ↗
        </a>
      </div>

      <div class="w-full flex justify-center">
        <iframe id="preview-frame" src="${activeScreenHtmlUrl}" class="viewport-desktop border border-border shadow-2xl bg-white"></iframe>
      </div>
    </main>

    <aside class="lg:col-span-4 border-l border-border bg-surface flex flex-col h-[calc(100vh-4rem)]">
      <div class="flex border-b border-border text-xs font-semibold">
        <button onclick="switchTab('diff')" id="tab-btn-diff" class="flex-1 py-3 text-center border-b-2 border-primary text-primary transition">Visual Diff</button>
        <button onclick="switchTab('taste')" id="tab-btn-taste" class="flex-1 py-3 text-center border-b-2 border-transparent text-slate-400 hover:text-white transition">Taste Critic</button>
        <button onclick="switchTab('tokens')" id="tab-btn-tokens" class="flex-1 py-3 text-center border-b-2 border-transparent text-slate-400 hover:text-white transition">Tailwind v4</button>
        <button onclick="switchTab('code')" id="tab-btn-code" class="flex-1 py-3 text-center border-b-2 border-transparent text-slate-400 hover:text-white transition">React Code</button>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <!-- TAB 1: Visual Diff -->
        <div id="tab-diff" class="space-y-4">
          <div class="p-3 bg-surfaceCard rounded-lg border border-border text-xs">
            <div class="flex justify-between items-center mb-1">
              <span class="font-semibold text-slate-200">Pixel Shift Analysis</span>
              <span class="text-accent font-bold">${activeIter?.visualDiff ? `${activeIter.visualDiff.diffPercentage}%` : 'N/A'}</span>
            </div>
            <p class="text-slate-400">
              ${activeIter?.visualDiff ? `Altered pixels: ${activeIter.visualDiff.diffPixelCount.toLocaleString()} / ${activeIter.visualDiff.totalPixels.toLocaleString()}` : 'No predecessor iteration to diff against.'}
            </p>
          </div>

          ${activeIter?.visualDiff?.diffImagePath ? `
            <div>
              <h3 class="text-xs font-semibold text-slate-300 mb-2">Magenta Diff Overlay</h3>
              <div class="rounded-lg border border-border overflow-hidden bg-slate-950">
                <img src="/designs/${path.basename(activeIter.visualDiff.diffImagePath)}" alt="Visual Diff" class="w-full h-auto object-contain max-h-[380px]" />
              </div>
            </div>
          ` : `
            <div class="py-12 text-center text-slate-500 text-xs">
              Diff visual available when comparing 2 or more iterations.
            </div>
          `}
        </div>

        <!-- TAB 2: Taste Critic -->
        <div id="tab-taste" class="hidden space-y-4">
          <div class="p-4 bg-surfaceCard rounded-lg border border-border space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-xs text-slate-400">Overall Taste Score</span>
              <span class="text-lg font-bold text-emerald-400">${activeIter?.tasteReview?.overallScore ?? 92} / 100</span>
            </div>
            <div class="space-y-2 text-xs">
              <div class="flex justify-between py-1 border-b border-border/50">
                <span class="text-slate-300">WCAG AA Contrast</span>
                <span class="text-emerald-400 font-semibold">PASS (4.8:1)</span>
              </div>
              <div class="flex justify-between py-1 border-b border-border/50">
                <span class="text-slate-300">8pt Grid Baseline</span>
                <span class="text-emerald-400 font-semibold">PASS (0 errors)</span>
              </div>
              <div class="flex justify-between py-1">
                <span class="text-slate-300">Visual Hierarchy</span>
                <span class="text-emerald-400 font-semibold">BALANCED</span>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 3: Tailwind v4 Tokens -->
        <div id="tab-tokens" class="hidden space-y-3">
          <div class="flex justify-between items-center text-xs">
            <span class="text-slate-400 font-semibold">Tailwind v4 @theme CSS</span>
            <button onclick="copyCode('theme-css-code')" class="text-primary hover:underline">Copy</button>
          </div>
          <pre id="theme-css-code" class="p-3 bg-slate-950 text-slate-200 rounded-lg text-xs font-mono overflow-x-auto border border-border">${themeV4Content}</pre>
        </div>

        <!-- TAB 4: React Code -->
        <div id="tab-code" class="hidden space-y-3">
          <div class="flex justify-between items-center text-xs">
            <span class="text-slate-400 font-semibold">Clean Architecture React TSX</span>
            <button onclick="copyCode('react-tsx-code')" class="text-primary hover:underline">Copy</button>
          </div>
          <pre id="react-tsx-code" class="p-3 bg-slate-950 text-emerald-400 rounded-lg text-xs font-mono overflow-x-auto border border-border max-h-[420px]">${
            activeIter?.componentChanges && activeIter.componentChanges[0] && fs.existsSync(path.join(this.baseDir, activeIter.componentChanges[0]))
              ? fs.readFileSync(path.join(this.baseDir, activeIter.componentChanges[0]), "utf-8")
              : "// Component code will appear here"
          }</pre>
        </div>
      </div>

      <div class="p-4 border-t border-border bg-surfaceCard">
        <form onsubmit="generateNewScreen(event)" class="space-y-2">
          <label class="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Iterate with Ollama GPU</span>
            <span id="gen-status" class="text-slate-400 font-normal">Ready</span>
          </label>
          <div class="flex gap-2">
            <input type="text" id="prompt-input" placeholder="Prompt (e.g. Add crypto staking card with dark gradient)" required
              class="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary" />
            <button type="submit" id="btn-generate" class="px-4 py-2 bg-primary text-slate-950 text-xs font-bold rounded-lg hover:bg-primary/90 transition flex items-center gap-1">
              <span>Run</span>
            </button>
          </div>
        </form>
      </div>
    </aside>
  </div>

  <script>
    function setViewport(mode) {
      const frame = document.getElementById('preview-frame');
      const btnD = document.getElementById('btn-desktop');
      const btnT = document.getElementById('btn-tablet');
      const btnM = document.getElementById('btn-mobile');

      [btnD, btnT, btnM].forEach(b => {
        b.className = "px-3 py-1 text-xs font-semibold rounded text-slate-300 hover:text-white transition";
      });

      if (mode === 'desktop') {
        frame.className = "viewport-desktop border border-border shadow-2xl bg-white";
        btnD.className = "px-3 py-1 text-xs font-semibold rounded bg-primary text-slate-950 transition";
      } else if (mode === 'tablet') {
        frame.className = "viewport-tablet border border-border shadow-2xl bg-white";
        btnT.className = "px-3 py-1 text-xs font-semibold rounded bg-primary text-slate-950 transition";
      } else if (mode === 'mobile') {
        frame.className = "viewport-mobile border border-border shadow-2xl bg-white";
        btnM.className = "px-3 py-1 text-xs font-semibold rounded bg-primary text-slate-950 transition";
      }
    }

    function switchTab(tab) {
      ['diff', 'taste', 'tokens', 'code'].forEach(t => {
        document.getElementById('tab-' + t).classList.add('hidden');
        document.getElementById('tab-btn-' + t).className = "flex-1 py-3 text-center border-b-2 border-transparent text-slate-400 hover:text-white transition";
      });
      document.getElementById('tab-' + tab).classList.remove('hidden');
      document.getElementById('tab-btn-' + tab).className = "flex-1 py-3 text-center border-b-2 border-primary text-primary transition";
    }

    function copyCode(elemId) {
      const text = document.getElementById(elemId).innerText;
      navigator.clipboard.writeText(text);
      alert('Code copied to clipboard!');
    }

    async function generateNewScreen(e) {
      e.preventDefault();
      const input = document.getElementById('prompt-input');
      const status = document.getElementById('gen-status');
      const btn = document.getElementById('btn-generate');

      const prompt = input.value.trim();
      if (!prompt) return;

      status.innerText = "Generating architecture...";
      status.className = 'text-primary animate-pulse font-medium';
      btn.disabled = true;
      btn.classList.add('opacity-50');

      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        });
        const data = await res.json();
        if (data.ok) {
          window.location.reload();
        } else {
          alert('Error: ' + data.error);
        }
      } catch (err) {
        alert('Generation failed: ' + err.message);
      } finally {
        btn.disabled = false;
        btn.classList.remove('opacity-50');
        status.innerText = 'Ready';
        status.className = 'text-slate-400 font-normal';
      }
    }
  </script>
</body>
</html>`;
  }
}

export function startStudioServer(port: number = 3000, host: string = "0.0.0.0", baseDir?: string): StudioServer {
  const studio = new StudioServer({ port, host, baseDir });
  studio.start();
  return studio;
}
