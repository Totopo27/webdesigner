/**
 * pi-sdd-design - Spec-Driven Development of Design & Frontend for Pi Coding Agent
 */

import * as path from "node:path";
import { SddDesignEngine } from "./src/workflow/engine.js";
import { startStudioServer } from "./src/server/studio.js";

export { SddDesignEngine } from "./src/workflow/engine.js";
export { TrajectoryManager } from "./src/trajectory/manager.js";
export { TokenParser } from "./src/tokens/parser.js";
export { ComponentValidator } from "./src/ast/validator.js";
export { StitchDesignProvider } from "./src/mcp/stitch-client.js";
export { OllamaDesignProvider } from "./src/providers/ollama-provider.js";
export { VisualDiffer } from "./src/visual/differ.js";
export { StudioServer, startStudioServer } from "./src/server/studio.js";
export * from "./src/types/index.js";

export default function sddDesignExtension(pi: any): void {
  const getEngine = (ctx?: any) => {
    const cwd = ctx?.cwd ?? process.cwd();
    return new SddDesignEngine({ baseDir: cwd });
  };

  // 1. Session start: register status indicator
  pi.on?.("session_start", async (_event: any, ctx: any) => {
    if (ctx?.hasUI && typeof ctx?.ui?.setStatus === "function") {
      ctx.ui.setStatus("sdd-design", "Design SDD");
    }
  });

  // 2. Command: /design:new [name]
  pi.registerCommand?.("design:new", {
    description: "Initialize or scaffold a new Design System specification (.stitch/DESIGN.md)",
    handler: async (args: string[], ctx: any) => {
      const engine = getEngine(ctx);
      const systemName = args.join(" ").trim() || "Brand Design System";
      const system = engine.initDesignSystem(systemName);

      const msg = [
        `[OK] **Design System Initialized: ${system.name}**`,
        `- **Location:** \`.stitch/DESIGN.md\``,
        `- **Primary Color:** \`${system.colors.primary}\``,
        `- **Typography:** \`${system.typography.fontFamilies.sans}\``,
        `- **8pt Grid Spacing:** Ready`,
        "",
        `Next step: Run \`/design:generate <prompt>\` to generate your first screen with Stitch.`,
      ].join("\n");

      if (ctx?.ui?.notify) ctx.ui.notify(msg);
      else console.log(msg);
    },
  });

  // 3. Command: /design:generate <prompt>
  pi.registerCommand?.("design:generate", {
    description: "Generate a UI screen using Google Stitch MCP and record in Trajectory",
    handler: async (args: string[], ctx: any) => {
      const prompt = args.join(" ").trim();
      if (!prompt) {
        const help = "[WARN] Please specify a prompt. Example: `/design:generate Modern dashboard for cloud monitoring with dark mode`";
        if (ctx?.ui?.notify) ctx.ui.notify(help);
        else console.log(help);
        return;
      }

      const engine = getEngine(ctx);
      if (ctx?.ui?.notify) ctx.ui.notify("[INFO] Generating screen with Stitch architecture...");

      try {
        const { artifact, iterationNumber } = await engine.generateScreen(prompt);
        const msg = [
          `[OK] **Screen Generated (Iteration #${iterationNumber})**`,
          `- **Screen ID:** \`${artifact.screenId}\``,
          `- **HTML:** \`.stitch/designs/${artifact.screenId.replace(/[^a-zA-Z0-9_-]/g, "_")}.html\``,
          `- **Screenshot:** \`.stitch/designs/${artifact.screenId.replace(/[^a-zA-Z0-9_-]/g, "_")}.png\``,
          "",
          `Next step: Run \`/design:judge\` to conduct an adversarial taste and accessibility review.`,
        ].join("\n");

        if (ctx?.ui?.notify) ctx.ui.notify(msg);
        else console.log(msg);
      } catch (err: any) {
        const errMsg = `[ERROR] Error generating screen: ${err.message}`;
        if (ctx?.ui?.notify) ctx.ui.notify(errMsg);
        else console.error(errMsg);
      }
    },
  });

  // 4. Command: /design:judge
  pi.registerCommand?.("design:judge", {
    description: "Adversarial visual audit: WCAG AA contrast, 8pt grid, and visual hierarchy",
    handler: async (_args: string[], ctx: any) => {
      const engine = getEngine(ctx);
      try {
        const verdict = engine.judgeActiveIteration();
        const msg = [
          `[AUDIT] **Judgment Day: Visual & Taste Review**`,
          `- **Verdict:** ${verdict.status === "APPROVED" ? "[PASSED] APPROVED" : "[WARN] NEEDS REVISION"} (${verdict.overallScore}/100)`,
          `- **WCAG AA Contrast:** ${verdict.wcagContrast.passes ? "PASSED" : "FAILED"} (${verdict.wcagContrast.notes})`,
          `- **8pt Grid Baseline:** ${verdict.grid8pt.passes ? "PASSED" : "FAILED"} (${verdict.grid8pt.violationsCount} violations)`,
          `- **Visual Hierarchy:** ${verdict.hierarchy.passes ? "PASSED" : "FAILED"}`,
          "",
          verdict.recommendations.length > 0 ? `**Recommendations:** ${verdict.recommendations.join("; ")}` : "",
          "",
          `Next step: Run \`/design:apply\` to componentize into clean React code.`,
        ].join("\n");

        if (ctx?.ui?.notify) ctx.ui.notify(msg);
        else console.log(msg);
      } catch (err: any) {
        const errMsg = `[WARN] Review check: ${err.message}`;
        if (ctx?.ui?.notify) ctx.ui.notify(errMsg);
        else console.error(errMsg);
      }
    },
  });

  // 5. Command: /design:apply
  pi.registerCommand?.("design:apply", {
    description: "Componentize active Stitch screen into modular React components with AST validation",
    handler: async (_args: string[], ctx: any) => {
      const engine = getEngine(ctx);
      try {
        const result = engine.componentizeActiveScreen();
        const fileList = result.files.map((f) => `  - \`${f.relativePath}\` (${f.type})`).join("\n");
        const msg = [
          `[OK] **Componentization Complete**`,
          result.summary,
          "",
          `**Generated Files:**`,
          fileList,
          "",
          `All components verified: TypeScript Props interfaces enforced, decoupled mockData, zero unmapped hex colors.`,
        ].join("\n");

        if (ctx?.ui?.notify) ctx.ui.notify(msg);
        else console.log(msg);
      } catch (err: any) {
        const errMsg = `[ERROR] Error in componentization: ${err.message}`;
        if (ctx?.ui?.notify) ctx.ui.notify(errMsg);
        else console.error(errMsg);
      }
    },
  });

  // 6. Command: /design:trajectory
  pi.registerCommand?.("design:trajectory", {
    description: "Display the design iteration history and audit log",
    handler: async (_args: string[], ctx: any) => {
      const engine = getEngine(ctx);
      const report = engine.getTrajectoryReport();
      if (ctx?.ui?.notify) ctx.ui.notify(report);
      else console.log(report);
    },
  });

  // 7. Command: /design:diff [iterA] [iterB]
  pi.registerCommand?.("design:diff", {
    description: "Compare visual diff between iterations and show pixel shift metrics",
    handler: async (args: string[], ctx: any) => {
      const engine = getEngine(ctx);
      try {
        const history = engine.trajectory.getTrajectory().history;
        if (history.length < 2) {
          const warn = "[WARN] At least two design iterations are required to compute a visual diff.";
          if (ctx?.ui?.notify) ctx.ui.notify(warn);
          else console.log(warn);
          return;
        }

        let iterA = parseInt(args[0], 10);
        let iterB = parseInt(args[1], 10);

        if (isNaN(iterA) || isNaN(iterB)) {
          // Default: compare active against immediate predecessor
          const active = engine.trajectory.getActiveIteration();
          iterB = active ? active.iteration : history[history.length - 1].iteration;
          iterA = iterB > 1 ? iterB - 1 : 1;
        }

        const diffResult = engine.diffIterations(iterA, iterB);
        const statusTag = diffResult.hasDifference ? "[DIFF]" : "[MATCH]";
        const msg = [
          `[DIFF] **Visual Regression Diff: Iteration #${iterA} -> #${iterB}**`,
          `- **Status:** ${statusTag} ${diffResult.diffPercentage}% pixel shift`,
          `- **Changed Pixels:** ${diffResult.diffPixelCount.toLocaleString()} / ${diffResult.totalPixels.toLocaleString()}`,
          `- **Diff Artifact:** \`${diffResult.diffImagePath}\``,
          "",
          diffResult.hasDifference
            ? `*Visual differences are highlighted in neon magenta on \`${diffResult.diffImagePath}\`.*`
            : `*Both iterations are pixel-identical.*`,
        ].join("\n");

        if (ctx?.ui?.notify) ctx.ui.notify(msg);
        else console.log(msg);
      } catch (err: any) {
        const errMsg = `[ERROR] Error computing visual diff: ${err.message}`;
        if (ctx?.ui?.notify) ctx.ui.notify(errMsg);
        else console.error(errMsg);
      }
    },
  });

  // 8. Command: /design:export
  pi.registerCommand?.("design:export", {
    description: "Export design tokens to Tailwind v4 @theme, standard CSS variables, and legacy config",
    handler: async (_args: string[], ctx: any) => {
      const engine = getEngine(ctx);
      try {
        const paths = engine.exportThemeFiles();
        const msg = [
          `[OK] **Design System Tokens Exported**`,
          `- **Tailwind v4 (@theme):** \`${path.relative(process.cwd(), paths.v4ThemePath)}\``,
          `- **CSS Variables (:root):** \`${path.relative(process.cwd(), paths.cssVariablesPath)}\``,
          `- **Tailwind v3 Config:** \`${path.relative(process.cwd(), paths.v3ConfigPath)}\``,
          "",
          `Use \`@import "./.stitch/theme-v4.css";\` in your main CSS file for instant Tailwind v4 compatibility.`,
        ].join("\n");

        if (ctx?.ui?.notify) ctx.ui.notify(msg);
        else console.log(msg);
      } catch (err: any) {
        const errMsg = `[ERROR] Error exporting theme files: ${err.message}`;
        if (ctx?.ui?.notify) ctx.ui.notify(errMsg);
        else console.error(errMsg);
      }
    },
  });

  // 9. Command: /design:studio [port]
  pi.registerCommand?.("design:studio", {
    description: "Launch the interactive Design Studio & Trajectory Web Viewer",
    handler: async (args: string[], ctx: any) => {
      const port = parseInt(args[0], 10) || 3000;
      const cwd = ctx?.cwd ?? process.cwd();
      try {
        startStudioServer(port, "0.0.0.0", cwd);
        const msg = [
          `[OK] **Stitch Studio Launched**`,
          `- **Local PC:** [\`http://localhost:${port}\`](http://localhost:${port})`,
          `- **Mobile (LAN):** \`http://192.168.100.11:${port}\``,
          "",
          `Open in your browser to inspect visual diffs, device viewports, and generate screens interactively.`,
        ].join("\n");

        if (ctx?.ui?.notify) ctx.ui.notify(msg);
        else console.log(msg);
      } catch (err: any) {
        const errMsg = `[ERROR] Error starting Design Studio: ${err.message}`;
        if (ctx?.ui?.notify) ctx.ui.notify(errMsg);
        else console.error(errMsg);
      }
    },
  });
}
