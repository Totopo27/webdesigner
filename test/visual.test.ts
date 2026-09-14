import { describe, it, expect, afterAll } from "vitest";
import { VisualDiffer } from "../src/visual/differ.js";
import { PNG } from "pngjs";
import * as fs from "node:fs";
import * as path from "node:path";

describe("VisualDiffer", () => {
  const testDir = path.resolve("test-visual-artifacts");

  function createTestPng(filePath: string, width: number, height: number, color: [number, number, number]) {
    const png = new PNG({ width, height });
    for (let i = 0; i < png.data.length; i += 4) {
      png.data[i] = color[0];     // R
      png.data[i + 1] = color[1]; // G
      png.data[i + 2] = color[2]; // B
      png.data[i + 3] = 255;      // A
    }
    fs.writeFileSync(filePath, PNG.sync.write(png));
  }

  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it("should detect installed system browser channel", () => {
    const channel = VisualDiffer.detectBrowserChannel();
    expect(["chrome", "msedge"]).toContain(channel);
  });

  it("should return 0% difference for identical images", () => {
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });

    const img1Path = path.join(testDir, "base.png");
    const img2Path = path.join(testDir, "same.png");
    const diffPath = path.join(testDir, "diff-same.png");

    createTestPng(img1Path, 100, 100, [30, 41, 59]);
    createTestPng(img2Path, 100, 100, [30, 41, 59]);

    const result = VisualDiffer.compareScreenshots(img1Path, img2Path, diffPath, {
      baselineIteration: 1,
      currentIteration: 2,
    });

    expect(result.hasDifference).toBe(false);
    expect(result.diffPixelCount).toBe(0);
    expect(result.diffPercentage).toBe(0);
    expect(fs.existsSync(diffPath)).toBe(true);
  });

  it("should detect pixel changes and calculate diff percentage", () => {
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });

    const img1Path = path.join(testDir, "base.png");
    const img2Path = path.join(testDir, "modified.png");
    const diffPath = path.join(testDir, "diff-modified.png");

    createTestPng(img1Path, 100, 100, [30, 41, 59]);

    // Create img2 with a 20x20 modified square = 400 altered pixels
    const png2 = new PNG({ width: 100, height: 100 });
    for (let i = 0; i < png2.data.length; i += 4) {
      png2.data[i] = 30;
      png2.data[i + 1] = 41;
      png2.data[i + 2] = 59;
      png2.data[i + 3] = 255;
    }
    for (let y = 10; y < 30; y++) {
      for (let x = 10; x < 30; x++) {
        const idx = (100 * y + x) << 2;
        png2.data[idx] = 255;
        png2.data[idx + 1] = 0;
        png2.data[idx + 2] = 0;
      }
    }
    fs.writeFileSync(img2Path, PNG.sync.write(png2));

    const result = VisualDiffer.compareScreenshots(img1Path, img2Path, diffPath, {
      baselineIteration: 1,
      currentIteration: 2,
    });

    expect(result.hasDifference).toBe(true);
    expect(result.diffPixelCount).toBe(400);
    expect(result.diffPercentage).toBe(4); // 400 / 10000 = 4%
    expect(result.baselineIteration).toBe(1);
    expect(result.currentIteration).toBe(2);
  });
});
