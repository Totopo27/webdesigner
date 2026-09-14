import * as fs from "node:fs";
import * as path from "node:path";
import type {
  DesignTrajectory,
  DesignTrajectoryEntry,
  TasteReviewVerdict,
} from "../types/index.js";

export class TrajectoryManager {
  private readonly trajectoryPath: string;
  private trajectory: DesignTrajectory;

  constructor(baseDir: string = process.cwd(), projectId: string = "default", projectName: string = "Stitch Project") {
    const stitchDir = path.join(baseDir, ".stitch");
    if (!fs.existsSync(stitchDir)) {
      fs.mkdirSync(stitchDir, { recursive: true });
    }
    this.trajectoryPath = path.join(stitchDir, "trajectory.json");
    this.trajectory = this.loadOrCreate(projectId, projectName);
  }

  private loadOrCreate(projectId: string, projectName: string): DesignTrajectory {
    if (fs.existsSync(this.trajectoryPath)) {
      try {
        const raw = fs.readFileSync(this.trajectoryPath, "utf-8");
        return JSON.parse(raw);
      } catch {
        // Corrupted, fallback to fresh trajectory
      }
    }

    const initial: DesignTrajectory = {
      projectId,
      projectName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      activeIteration: 0,
      history: [],
    };
    this.save(initial);
    return initial;
  }

  private save(data: DesignTrajectory): void {
    data.updatedAt = new Date().toISOString();
    fs.writeFileSync(this.trajectoryPath, JSON.stringify(data, null, 2), "utf-8");
  }

  public getTrajectory(): Readonly<DesignTrajectory> {
    return this.trajectory;
  }

  public recordIteration(params: {
    prompt: string;
    screenId: string;
    screenshotUrl: string;
    localHtmlPath: string;
    localScreenshotPath: string;
    tasteReview?: TasteReviewVerdict;
    componentChanges?: string[];
  }): DesignTrajectoryEntry {
    const nextIteration = this.trajectory.history.length + 1;
    const entry: DesignTrajectoryEntry = {
      id: `iter-${Date.now()}-${nextIteration}`,
      timestamp: new Date().toISOString(),
      iteration: nextIteration,
      prompt: params.prompt,
      screenId: params.screenId,
      screenshotUrl: params.screenshotUrl,
      localHtmlPath: params.localHtmlPath,
      localScreenshotPath: params.localScreenshotPath,
      tasteReview: params.tasteReview,
      componentChanges: params.componentChanges ?? [],
    };

    this.trajectory.history.push(entry);
    this.trajectory.activeIteration = nextIteration;
    this.save(this.trajectory);
    return entry;
  }

  public updateTasteReview(iterationNumber: number, verdict: TasteReviewVerdict): boolean {
    const entry = this.trajectory.history.find((h) => h.iteration === iterationNumber);
    if (!entry) return false;
    entry.tasteReview = verdict;
    this.save(this.trajectory);
    return true;
  }

  public getActiveIteration(): DesignTrajectoryEntry | null {
    if (this.trajectory.history.length === 0) return null;
    return (
      this.trajectory.history.find((h) => h.iteration === this.trajectory.activeIteration) ??
      this.trajectory.history[this.trajectory.history.length - 1]
    );
  }

  public revertTo(iterationNumber: number): DesignTrajectoryEntry | null {
    const target = this.trajectory.history.find((h) => h.iteration === iterationNumber);
    if (!target) return null;
    this.trajectory.activeIteration = iterationNumber;
    this.save(this.trajectory);
    return target;
  }

  public toMarkdownSummary(): string {
    const lines: string[] = [
      `# Design Trajectory: ${this.trajectory.projectName}`,
      `**Project ID:** \`${this.trajectory.projectId}\` | **Iterations:** ${this.trajectory.history.length} | **Active:** #${this.trajectory.activeIteration}`,
      `**Last Updated:** ${this.trajectory.updatedAt}`,
      "",
      "---",
      "",
      "## Iteration Log",
      "",
    ];

    for (const entry of this.trajectory.history) {
      const isCurrent = entry.iteration === this.trajectory.activeIteration ? " (ACTIVE)" : "";
      lines.push(`### Iteration #${entry.iteration}${isCurrent}`);
      lines.push(`- **Date:** ${entry.timestamp}`);
      lines.push(`- **Prompt:** *"${entry.prompt}"*`);
      lines.push(`- **Screen ID:** \`${entry.screenId}\``);
      lines.push(`- **HTML Artifact:** \`${entry.localHtmlPath}\``);
      lines.push(`- **Screenshot:** \`${entry.localScreenshotPath}\``);

      if (entry.tasteReview) {
        const badge =
          entry.tasteReview.status === "APPROVED"
            ? "✅ APPROVED"
            : entry.tasteReview.status === "REJECTED"
            ? "❌ REJECTED"
            : "⚠️ NEEDS REVISION";
        lines.push(`- **Taste Review:** ${badge} (Score: ${entry.tasteReview.overallScore}/100)`);
        lines.push(`  - Contrast: ${entry.tasteReview.wcagContrast.passes ? "Pass" : "Fail"} (${entry.tasteReview.wcagContrast.notes})`);
        lines.push(`  - 8pt Grid: ${entry.tasteReview.grid8pt.passes ? "Pass" : "Fail"} (${entry.tasteReview.grid8pt.violationsCount} violations)`);
        if (entry.tasteReview.critiqueNotes.length > 0) {
          lines.push(`  - Notes: ${entry.tasteReview.critiqueNotes.join("; ")}`);
        }
      }

      if (entry.componentChanges && entry.componentChanges.length > 0) {
        lines.push(`- **Component Diffs:**`);
        for (const change of entry.componentChanges) {
          lines.push(`  - \`${change}\``);
        }
      }
      lines.push("");
    }

    return lines.join("\n");
  }
}
