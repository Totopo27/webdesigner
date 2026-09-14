import * as http from "node:http";
import * as fs from "node:fs";
import * as path from "node:path";

const PORT = 3000;
const HOST = "0.0.0.0";
const DESIGNS_DIR = path.join(process.cwd(), ".stitch", "designs");

function getLatestHtmlFile(): string | null {
  if (!fs.existsSync(DESIGNS_DIR)) return null;
  const files = fs.readdirSync(DESIGNS_DIR).filter((f) => f.endsWith(".html"));
  if (files.length === 0) return null;
  files.sort((a, b) => {
    const statA = fs.statSync(path.join(DESIGNS_DIR, a));
    const statB = fs.statSync(path.join(DESIGNS_DIR, b));
    return statB.mtimeMs - statA.mtimeMs;
  });
  return path.join(DESIGNS_DIR, files[0]);
}

const server = http.createServer((req, res) => {
  const url = req.url || "/";

  if (url === "/" || url === "/index.html") {
    const latest = getLatestHtmlFile();
    if (!latest) {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      res.end("<h1>No se encontraron pantallas generadas en .stitch/designs</h1>");
      return;
    }

    let html = fs.readFileSync(latest, "utf-8");

    const banner = `
      <div style="position:fixed;bottom:12px;right:12px;background:rgba(15,23,42,0.92);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.15);color:#38bdf8;padding:8px 14px;border-radius:9999px;font-family:sans-serif;font-size:12px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,0.4);z-index:9999;display:flex;align-items:center;gap:6px;">
        <span style="width:8px;height:8px;background:#22c55e;border-radius:50%;display:inline-block;animation:pulse 2s infinite;"></span>
        Ollama GPU Local Demo
      </div>
      <style>@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}</style>
    `;

    if (html.includes("</body>")) {
      html = html.replace("</body>", `${banner}</body>`);
    } else {
      html += banner;
    }

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
    return;
  }

  const safePath = path.join(DESIGNS_DIR, path.basename(url));
  if (fs.existsSync(safePath) && fs.statSync(safePath).isFile()) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    fs.createReadStream(safePath).pipe(res);
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("404 Not Found");
});

server.listen(PORT, HOST, () => {
  console.log("=================================================");
  console.log("🚀 SERVIDOR WEB DE MUESTRA ACTIVO (Ollama Demo)");
  console.log("=================================================");
  console.log(`💻 Desde esta PC:     http://localhost:${PORT}`);
  console.log(`📱 Desde tu Android:  http://192.168.100.11:${PORT}`);
  console.log(`🌐 Interfaz:          ${HOST}:${PORT}`);
  console.log("=================================================");
});
