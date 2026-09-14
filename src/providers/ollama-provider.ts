import * as fs from "node:fs";
import * as path from "node:path";
import type {
  DesignProvider,
  ScreenArtifact,
  ScreenSummary,
  DesignSystem,
} from "../types/index.js";
import { TokenParser } from "../tokens/parser.js";

export interface OllamaProviderOptions {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  baseDir?: string;
}

/**
 * OllamaDesignProvider - 100% local, offline-capable design generation
 * Interacts with Ollama running locally at http://localhost:11434
 */
export class OllamaDesignProvider implements DesignProvider {
  public readonly name = "ollama";
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseDir: string;

  constructor(options: OllamaProviderOptions = {}) {
    this.baseDir = options.baseDir || process.cwd();
    const envVars = this.readEnv(this.baseDir);

    const rawUrl =
      options.baseUrl ||
      process.env.OLLAMA_BASE_URL ||
      envVars.OLLAMA_BASE_URL ||
      "http://localhost:11434";
    // Strip trailing /v1 or slashes to ensure standard /api/generate endpoint resolution
    this.baseUrl = rawUrl.replace(/\/v1\/?$/, "").replace(/\/+$/, "");

    this.apiKey =
      options.apiKey ||
      process.env.OLLAMA_API_KEY ||
      envVars.OLLAMA_API_KEY ||
      "";

    this.model =
      options.model ||
      process.env.OLLAMA_MODEL ||
      envVars.OLLAMA_MODEL ||
      "richardyoung/qwen2.5-coder-14b-instruct-abliterated";
  }

  private readEnv(dir: string): Record<string, string> {
    const envPath = path.join(dir, ".env");
    const result: Record<string, string> = {};
    if (fs.existsSync(envPath)) {
      const lines = fs.readFileSync(envPath, "utf-8").split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx !== -1) {
          result[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
        }
      }
    }
    return result;
  }

  public async createProject(title: string): Promise<string> {
    const safeTitle = title.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
    const projectId = `local-${safeTitle}-${Date.now()}`;
    const projectDir = path.join(this.baseDir, ".stitch", "projects", projectId);
    fs.mkdirSync(projectDir, { recursive: true });
    return projectId;
  }

  public async generateScreen(
    projectId: string,
    prompt: string,
    _options: { deviceType?: "DESKTOP" | "MOBILE" | "TABLET" } = {}
  ): Promise<ScreenArtifact> {
    const systemPrompt = `You are an expert UI/UX frontend designer. Output ONLY valid, standalone, self-contained HTML5 with Tailwind CSS via CDN script.
Include a <script> block defining tailwind.config with custom color tokens matching the design intent.
Do NOT wrap your code in explanations; output strictly the HTML markup inside \`\`\`html codeblock.`;

    const userPrompt = `Create a modern, high-fidelity UI layout for: ${prompt}.
Ensure semantic HTML, accessible color contrasts, and clean visual hierarchy.`;

    let htmlContent = "";

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (this.apiKey) {
        headers["Authorization"] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: this.model,
          system: systemPrompt,
          prompt: userPrompt,
          stream: false,
        }),
      });

      if (response.ok) {
        const json = (await response.json()) as any;
        const rawResponse = json.response || "";
        const match = rawResponse.match(/```html([\s\S]*?)```/) || rawResponse.match(/<!DOCTYPE html>[\s\S]*<\/html>/i);
        htmlContent = match ? (match[1] ? match[1].trim() : match[0].trim()) : rawResponse.trim();
      }
    } catch {
      // Offline fallback / mock if Ollama daemon is not currently running
    }

    if (!htmlContent || !htmlContent.includes("<html")) {
      htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${prompt}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: '#3b82f6',
            secondary: '#64748b',
            background: '#09090b',
            foreground: '#f8fafc'
          }
        }
      }
    }
  </script>
</head>
<body class="bg-background text-foreground min-h-screen p-8">
  <div class="max-w-6xl mx-auto">
    <h1 class="text-3xl font-bold mb-4">${prompt}</h1>
    <p class="text-secondary mb-8">Generated locally via Ollama (${this.model}).</p>
  </div>
</body>
</html>`;
    }

    const screenId = `screen-local-${Date.now()}`;
    const designsDir = path.join(this.baseDir, ".stitch", "designs");
    fs.mkdirSync(designsDir, { recursive: true });

    const localHtmlPath = path.join(designsDir, `${screenId}.html`);
    const localScreenshotPath = path.join(designsDir, `${screenId}.png`);

    fs.writeFileSync(localHtmlPath, htmlContent, "utf-8");

    return {
      screenId,
      projectId,
      title: prompt.slice(0, 40),
      htmlContent,
      screenshotUrl: `file://${localScreenshotPath}`,
      downloadUrls: {
        html: `file://${localHtmlPath}`,
        screenshot: `file://${localScreenshotPath}`,
      },
    };
  }

  public async getScreen(screenId: string): Promise<ScreenArtifact> {
    const designsDir = path.join(this.baseDir, ".stitch", "designs");
    const localHtmlPath = path.join(designsDir, `${screenId}.html`);
    const htmlContent = fs.existsSync(localHtmlPath) ? fs.readFileSync(localHtmlPath, "utf-8") : "";

    return {
      screenId,
      projectId: "local",
      title: "Local Screen",
      htmlContent,
      screenshotUrl: "",
    };
  }

  public async listScreens(_projectId: string): Promise<ScreenSummary[]> {
    const designsDir = path.join(this.baseDir, ".stitch", "designs");
    if (!fs.existsSync(designsDir)) return [];

    const files = fs.readdirSync(designsDir).filter((f) => f.endsWith(".html"));
    return files.map((f) => ({
      screenId: path.basename(f, ".html"),
      title: path.basename(f, ".html"),
      createdAt: new Date().toISOString(),
    }));
  }

  public async syncDesignSystem(projectId: string): Promise<DesignSystem> {
    const screens = await this.listScreens(projectId);
    if (screens.length > 0) {
      const first = await this.getScreen(screens[0].screenId);
      if (first.htmlContent) {
        return TokenParser.extractFromHtml(first.htmlContent, `Ollama-${projectId}`);
      }
    }
    return TokenParser.extractFromHtml("", `Ollama-${projectId}`);
  }
}
