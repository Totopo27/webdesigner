import * as fs from "node:fs";
import * as path from "node:path";
import type {
  DesignProvider,
  ScreenArtifact,
  ScreenSummary,
  DesignSystem,
} from "../types/index.js";
import { TokenParser } from "../tokens/parser.js";
import { OllamaDesignProvider } from "../providers/ollama-provider.js";

export interface StitchClientOptions {
  apiKey?: string;
  endpointUrl?: string;
  baseDir?: string;
}

export class StitchDesignProvider implements DesignProvider {
  public readonly name = "google-stitch";
  private readonly apiKey: string;
  private readonly endpointUrl: string;
  private readonly baseDir: string;
  private requestId = 1;

  constructor(options: StitchClientOptions = {}) {
    this.apiKey =
      options.apiKey ||
      process.env.STITCH_API_KEY ||
      this.readApiKeyFromEnvFile(options.baseDir ?? process.cwd()) ||
      "";
    this.endpointUrl = options.endpointUrl || "https://stitch.googleapis.com/mcp";
    this.baseDir = options.baseDir || process.cwd();
  }

  private readApiKeyFromEnvFile(dir: string): string {
    const envPath = path.join(dir, ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      const match = content.match(/STITCH_API_KEY\s*=\s*([^\r\n]+)/);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return "";
  }

  private async callJsonRpc(method: string, params: Record<string, any>): Promise<any> {
    const body = {
      jsonrpc: "2.0",
      id: this.requestId++,
      method,
      params,
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.apiKey) {
      headers["X-Goog-Api-Key"] = this.apiKey;
    }

    const response = await fetch(this.endpointUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Stitch MCP HTTP ${response.status}: ${errText}`);
    }

    const json = (await response.json()) as any;
    if (json.error) {
      throw new Error(`Stitch MCP Error [${json.error.code}]: ${json.error.message}`);
    }

    return json.result;
  }

  public async createProject(title: string): Promise<string> {
    try {
      const result = await this.callJsonRpc("tools/call", {
        name: "create_project",
        arguments: { title },
      });
      // Extract project resource ID from result
      const text = result?.content?.[0]?.text;
      if (text) {
        try {
          const parsed = JSON.parse(text);
          return parsed.name || parsed.id || `projects/${Date.now()}`;
        } catch {
          return `projects/${Date.now()}`;
        }
      }
      return `projects/${Date.now()}`;
    } catch (err: any) {
      console.warn(`[StitchClient] createProject warning: ${err.message}. Using fallback ID.`);
      return `projects/${Date.now()}`;
    }
  }

  public async generateScreen(
    projectId: string,
    prompt: string,
    options: { deviceType?: "DESKTOP" | "MOBILE" | "TABLET" } = {}
  ): Promise<ScreenArtifact> {
    const result = await this.callJsonRpc("tools/call", {
      name: "generate_screen_from_text",
      arguments: {
        projectId,
        prompt,
        deviceType: options.deviceType || "DESKTOP",
      },
    });

    const text = result?.content?.[0]?.text || "{}";
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {}

    const screenId = data.name || data.id || `screen-${Date.now()}`;
    const screenTitle = data.title || "Generated Screen";
    const htmlUrl = data.htmlCode?.downloadUrl || "";
    const screenshotUrl = data.screenshot?.downloadUrl || "";

    // Download or prepare HTML
    let htmlContent = "";
    if (htmlUrl) {
      try {
        const resp = await fetch(htmlUrl);
        htmlContent = await resp.text();
      } catch (e) {
        console.warn(`[StitchClient] Could not fetch htmlCode downloadUrl: ${e}`);
      }
    }

    if (!htmlContent) {
      console.warn("[StitchClient] No direct HTML received, delegating to Ollama local GPU provider...");
      const ollama = new OllamaDesignProvider({ baseDir: this.baseDir });
      return ollama.generateScreen(projectId, prompt, options);
    }

    // Save locally into .stitch/designs
    const designsDir = path.join(this.baseDir, ".stitch", "designs");
    if (!fs.existsSync(designsDir)) {
      fs.mkdirSync(designsDir, { recursive: true });
    }

    const localHtmlPath = path.join(designsDir, `${screenId.replace(/[^a-zA-Z0-9_-]/g, "_")}.html`);
    fs.writeFileSync(localHtmlPath, htmlContent, "utf-8");

    const localScreenshotPath = path.join(designsDir, `${screenId.replace(/[^a-zA-Z0-9_-]/g, "_")}.png`);
    if (screenshotUrl) {
      try {
        const imgResp = await fetch(screenshotUrl);
        const arrayBuf = await imgResp.arrayBuffer();
        fs.writeFileSync(localScreenshotPath, Buffer.from(arrayBuf));
      } catch {}
    }

    return {
      screenId,
      projectId,
      title: screenTitle,
      htmlContent,
      screenshotUrl,
      downloadUrls: {
        html: htmlUrl,
        screenshot: screenshotUrl,
      },
    };
  }

  public async getScreen(screenId: string): Promise<ScreenArtifact> {
    const result = await this.callJsonRpc("tools/call", {
      name: "get_screen",
      arguments: { name: screenId },
    });

    const text = result?.content?.[0]?.text || "{}";
    const data = JSON.parse(text);

    return {
      screenId: data.name || screenId,
      projectId: data.projectId || "",
      title: data.title || "Screen",
      htmlContent: "",
      screenshotUrl: data.screenshot?.downloadUrl || "",
    };
  }

  public async listScreens(projectId: string): Promise<ScreenSummary[]> {
    const result = await this.callJsonRpc("tools/call", {
      name: "list_screens",
      arguments: { projectId },
    });

    const text = result?.content?.[0]?.text || "{}";
    const data = JSON.parse(text);
    const screens = data.screens || [];

    return screens.map((s: any) => ({
      screenId: s.name || s.id,
      title: s.title || "Untitled",
      createdAt: s.createTime || new Date().toISOString(),
    }));
  }

  public async syncDesignSystem(projectId: string): Promise<DesignSystem> {
    const screens = await this.listScreens(projectId);
    if (screens.length > 0) {
      const first = await this.getScreen(screens[0].screenId);
      if (first.htmlContent) {
        return TokenParser.extractFromHtml(first.htmlContent, `Stitch-${projectId}`);
      }
    }
    return TokenParser.extractFromHtml("", `Stitch-${projectId}`);
  }
}
