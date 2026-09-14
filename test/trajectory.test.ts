import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { TrajectoryManager } from "../src/trajectory/manager.js";

describe("TrajectoryManager", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "traj-test-"));
  });

  afterEach(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("should record design iterations and maintain history", () => {
    const manager = new TrajectoryManager(tmpDir, "proj-1", "Dashboard App");

    expect(manager.getTrajectory().history.length).toBe(0);

    const iter1 = manager.recordIteration({
      prompt: "Create dark dashboard",
      screenId: "screen-101",
      screenshotUrl: "https://example.com/1.png",
      localHtmlPath: ".stitch/designs/screen_101.html",
      localScreenshotPath: ".stitch/designs/screen_101.png",
    });

    expect(iter1.iteration).toBe(1);
    expect(manager.getTrajectory().history.length).toBe(1);
    expect(manager.getActiveIteration()?.screenId).toBe("screen-101");

    manager.updateTasteReview(1, {
      status: "APPROVED",
      overallScore: 95,
      wcagContrast: { passes: true, contrastRatioMin: 7, notes: "AAA pass" },
      grid8pt: { passes: true, violationsCount: 0, notes: "Clean" },
      hierarchy: { passes: true, notes: "Well structured" },
      critiqueNotes: ["Awesome design"],
      recommendations: [],
    });

    expect(manager.getActiveIteration()?.tasteReview?.overallScore).toBe(95);

    const md = manager.toMarkdownSummary();
    expect(md).toContain("# Design Trajectory: Dashboard App");
    expect(md).toContain("Iteration #1");
    expect(md).toContain("APPROVED");
  });
});
