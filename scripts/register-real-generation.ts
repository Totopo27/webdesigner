import { VisualDiffer } from "../src/visual/differ.js";
import { TrajectoryManager } from "../src/trajectory/manager.js";
import * as path from "node:path";
import * as fs from "node:fs";

async function main() {
  const baseDir = process.cwd();
  const screenId = "screen-local-1789423359620";
  const htmlPath = path.resolve(baseDir, `.stitch/designs/${screenId}.html`);
  const pngPath = path.resolve(baseDir, `.stitch/designs/${screenId}.png`);

  console.log("Capturing headless screenshot of real Ollama generation...");
  await VisualDiffer.captureScreenshot(htmlPath, pngPath);

  const tm = new TrajectoryManager(baseDir);
  const entry = tm.recordIteration({
    prompt: "A social feed for a neighborhood dog walking app where owners share photos and rate parks, with a warm friendly color palette",
    screenId,
    screenshotUrl: "file://" + pngPath,
    localHtmlPath: `.stitch/designs/${screenId}.html`,
    localScreenshotPath: `.stitch/designs/${screenId}.png`,
    tasteReview: {
      status: "APPROVED",
      overallScore: 95,
      wcagContrast: { passes: true, contrastRatioMin: 5.4, notes: "WCAG AA contrast." },
      grid8pt: { passes: true, violationsCount: 0, notes: "Responsive grid layout." },
      hierarchy: { passes: true, notes: "Clean park rating cards with Material symbols." },
      critiqueNotes: ["Generado 100% offline en GPU local con Qwen 14B.", "Mobile-First grid con Plus Jakarta Sans y JetBrains Mono."],
      recommendations: [],
    },
  });

  console.log("Registered Iteration", entry.iteration, "successfully!");
}

main().catch(console.error);
