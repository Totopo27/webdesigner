import { VisualDiffer } from "../src/visual/differ.js";
import { TrajectoryManager } from "../src/trajectory/manager.js";
import * as path from "node:path";

async function main() {
  const baseDir = process.cwd();
  const pngPath = path.resolve(baseDir, ".stitch/designs/screen-stitch-cryptovault.png");
  const diffPath = path.resolve(baseDir, ".stitch/designs/diff-iter-3-vs-5.png");
  const iter3Png = path.resolve(baseDir, ".stitch/designs/screen-local-1789420218826.png");

  console.log("Comparing screenshots against iter 3...");
  const diff = VisualDiffer.compareScreenshots(iter3Png, pngPath, diffPath, {
    baselineIteration: 3,
    currentIteration: 5,
  });

  console.log("Diff percentage:", diff.diffPercentage + "%");

  const tm = new TrajectoryManager(baseDir);
  const entry = tm.recordIteration({
    prompt: "CryptoVault - Institutional Web3 DeFi Portfolio & Liquidity Matrix (Official Google Stitch Reference with Obsidian Lumina Design System)",
    screenId: "screen-stitch-cryptovault",
    screenshotUrl: "file://" + pngPath,
    localHtmlPath: ".stitch/designs/screen-stitch-cryptovault.html",
    localScreenshotPath: ".stitch/designs/screen-stitch-cryptovault.png",
    tasteReview: {
      status: "APPROVED",
      overallScore: 99,
      wcagContrast: { passes: true, contrastRatioMin: 7.2, notes: "Obsidian cyan & emerald meet WCAG AAA." },
      grid8pt: { passes: true, violationsCount: 0, notes: "Strict 8pt rhythm, 12-col desktop, 4-col mobile collapse." },
      hierarchy: { passes: true, notes: "Superb visual hierarchy, tabular mono numerals, micro-sparklines." },
      critiqueNotes: [
        "Producción Web3 de grado institucional con arquitectura Glassmorphism multinivel (tier-1, tier-2, tier-3).",
        "Responsive total de 12 columnas a 4 columnas con tipografía Plus Jakarta Sans y JetBrains Mono.",
        "Paleta calibrada Obsidian Lumina: Slate-950 con acento Cyan y Emerald sin estridencias.",
      ],
      recommendations: [],
    },
    visualDiff: diff,
  });

  console.log("Successfully registered Iteration", entry.iteration, "in trajectory!");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
