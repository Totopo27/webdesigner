import * as fs from "node:fs";
import * as path from "node:path";
import { chromium } from "playwright-core";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import type { VisualDiffResult } from "../types/index.js";

export interface ScreenshotOptions {
  viewport?: { width: number; height: number };
  timeoutMs?: number;
  channel?: "chrome" | "msedge";
}

export interface DiffOptions {
  threshold?: number;
  baselineIteration?: number;
  currentIteration?: number;
}

export class VisualDiffer {
  /**
   * Detects the best available browser installed on the system
   */
  public static detectBrowserChannel(): "chrome" | "msedge" {
    const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
    if (fs.existsSync(chromePath)) return "chrome";

    const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
    if (fs.existsSync(edgePath)) return "msedge";

    return "chrome"; // Default fallback
  }

  /**
   * Captures a high-fidelity screenshot of an HTML design artifact headlessly
   */
  public static async captureScreenshot(
    htmlPath: string,
    outputPath: string,
    options: ScreenshotOptions = {}
  ): Promise<string> {
    const absoluteHtml = path.resolve(htmlPath);
    const absoluteOut = path.resolve(outputPath);

    const outDir = path.dirname(absoluteOut);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const channel = options.channel || this.detectBrowserChannel();
    const viewport = options.viewport || { width: 1280, height: 800 };

    const browser = await chromium.launch({
      channel,
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
    });

    try {
      const page = await browser.newPage({ viewport });
      await page.goto(`file://${absoluteHtml}`, { waitUntil: "load" });

      // Wait a moment for Tailwind CDN scripts and animations to settle
      await page.waitForTimeout(options.timeoutMs ?? 800);

      await page.screenshot({
        path: absoluteOut,
        fullPage: true,
      });

      return absoluteOut;
    } finally {
      await browser.close();
    }
  }

  /**
   * Compares two screenshots pixel-by-pixel and generates a visual diff PNG
   */
  public static compareScreenshots(
    baselinePngPath: string,
    currentPngPath: string,
    diffOutputPath: string,
    options: DiffOptions = {}
  ): VisualDiffResult {
    const absoluteBaseline = path.resolve(baselinePngPath);
    const absoluteCurrent = path.resolve(currentPngPath);
    const absoluteDiff = path.resolve(diffOutputPath);

    if (!fs.existsSync(absoluteBaseline)) {
      throw new Error(`Baseline screenshot not found at: ${absoluteBaseline}`);
    }
    if (!fs.existsSync(absoluteCurrent)) {
      throw new Error(`Current screenshot not found at: ${absoluteCurrent}`);
    }

    const imgBaseline = PNG.sync.read(fs.readFileSync(absoluteBaseline));
    const imgCurrent = PNG.sync.read(fs.readFileSync(absoluteCurrent));

    const width = Math.max(imgBaseline.width, imgCurrent.width);
    const height = Math.max(imgBaseline.height, imgCurrent.height);

    // Normalize buffers to matching canvas dimensions if sizes differ
    const normalizedBaseline = this.normalizeDimensions(imgBaseline, width, height);
    const normalizedCurrent = this.normalizeDimensions(imgCurrent, width, height);

    const diff = new PNG({ width, height });

    const diffPixelCount = pixelmatch(
      normalizedBaseline.data,
      normalizedCurrent.data,
      diff.data,
      width,
      height,
      {
        threshold: options.threshold ?? 0.1,
        diffColor: [255, 0, 102], // Neon magenta/pink for clear visual contrast
      }
    );

    const totalPixels = width * height;
    const diffPercentage = Number(((diffPixelCount / totalPixels) * 100).toFixed(2));
    const hasDifference = diffPixelCount > 0;

    const diffDir = path.dirname(absoluteDiff);
    if (!fs.existsSync(diffDir)) {
      fs.mkdirSync(diffDir, { recursive: true });
    }

    fs.writeFileSync(absoluteDiff, PNG.sync.write(diff));

    return {
      hasDifference,
      diffPixelCount,
      totalPixels,
      diffPercentage,
      diffImagePath: diffOutputPath,
      baselineIteration: options.baselineIteration ?? 0,
      currentIteration: options.currentIteration ?? 0,
    };
  }

  private static normalizeDimensions(img: PNG, targetWidth: number, targetHeight: number): PNG {
    if (img.width === targetWidth && img.height === targetHeight) {
      return img;
    }

    const out = new PNG({ width: targetWidth, height: targetHeight });
    // Fill with transparent or white background
    for (let i = 0; i < out.data.length; i += 4) {
      out.data[i] = 255;
      out.data[i + 1] = 255;
      out.data[i + 2] = 255;
      out.data[i + 3] = 255;
    }

    for (let y = 0; y < img.height; y++) {
      for (let x = 0; x < img.width; x++) {
        const srcIdx = (img.width * y + x) << 2;
        const destIdx = (targetWidth * y + x) << 2;
        out.data[destIdx] = img.data[srcIdx];
        out.data[destIdx + 1] = img.data[srcIdx + 1];
        out.data[destIdx + 2] = img.data[srcIdx + 2];
        out.data[destIdx + 3] = img.data[srcIdx + 3];
      }
    }

    return out;
  }
}
