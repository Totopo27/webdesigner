/**
 * pi-sdd-design - Spec-Driven Development of Design & Frontend for Pi Coding Agent
 */

import { SddDesignEngine } from "./src/workflow/engine.js";

export { SddDesignEngine } from "./src/workflow/engine.js";
export { TrajectoryManager } from "./src/trajectory/manager.js";
export { TokenParser } from "./src/tokens/parser.js";
export { ComponentValidator } from "./src/ast/validator.js";
export { StitchDesignProvider } from "./src/mcp/stitch-client.js";
export { OllamaDesignProvider } from "./src/providers/ollama-provider.js";
export { VisualDiffer } from "./src/visual/differ.js";
export * from "./src/types/index.js";

export default function sddDesignExtension(pi: any): void {
  const getEngine = (ctx?: any) => {
    const cwd = ctx?.cwd ?? process.cwd();
    return new SddDesignEngine({ baseDir: cwd });
  };

  // 1. Session start: register status indicator
  pi.on?.("session_start", async (_event: any, ctx: any) => {
    if (ctx?.hasUI && typeof ctx?.ui?.setStatus === "function") {
      ctx.ui.setStatus("sdd-design", "🎨 Design SDD");
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
        `✨ **Design System Initialized: ${system.name}**`,
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
        const help = "⚠️ Please specify a prompt. Example: `/design:generate Modern dashboard for cloud monitoring with dark mode`";
        if (ctx?.ui?.notify) ctx.ui.notify(help);
        else console.log(help);
        return;
      }

      const engine = getEngine(ctx);
      if (ctx?.ui?.notify) ctx.ui.notify("🎨 Calling Stitch MCP to generate screen...");

      try {
        const { artifact, iterationNumber } = await engine.generateScreen(prompt);
        const msg = [
          `✅ **Screen Generated! (Iteration #${iterationNumber})**`,
          `- **Screen ID:** \`${artifact.screenId}\``,
          `- **HTML:** \`.stitch/designs/${artifact.screenId.replace(/[^a-zA-Z0-9_-]/g, "_")}.html\``,
          `- **Screenshot:** \`.stitch/designs/${artifact.screenId.replace(/[^a-zA-Z0-9_-]/g, "_")}.png\``,
          "",
          `Next step: Run \`/design:judge\` to conduct an adversarial taste and accessibility review.`,
        ].join("\n");

        if (ctx?.ui?.notify) ctx.ui.notify(msg);
        else console.log(msg);
      } catch (err: any) {
        const errMsg = `❌ Error generating screen: ${err.message}`;
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
          `⚖️ **Judgment Day: Visual & Taste Review**`,
          `- **Verdict:** ${verdict.status === "APPROVED" ? "✅ APPROVED" : "⚠️ NEEDS REVISION"} (${verdict.overallScore}/100)`,
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
        const errMsg = `⚠️ Review check: ${err.message}`;
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
          `🚀 **Componentization Complete!**`,
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
        const errMsg = `❌ Error in componentization: ${err.message}`;
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
          const warn = "⚠️ At least two design iterations are required to compute a visual diff.";
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
        const icon = diffResult.hasDifference ? "📊" : "🎯";
        const msg = [
          `🎨 **Visual Regression Diff: Iteration #${iterA} ➔ #${iterB}**`,
          `- **Status:** ${icon} ${diffResult.diffPercentage}% pixel shift`,
          `- **Changed Pixels:** ${diffResult.diffPixelCount.toLocaleString()} / ${diffResult.totalPixels.toLocaleString()}`,
          `- **Diff Artifact:** \`${diffResult.diffImagePath}\``,
          "",
          diffResult.hasDifference
            ? `*Visual differences are highlighted in neon magenta on \`${diffResult.diffImagePath}\`.*`
            : `*Both iterations are pixel-identical!*`,
        ].join("\n");

        if (ctx?.ui?.notify) ctx.ui.notify(msg);
        else console.log(msg);
      } catch (err: any) {
        const errMsg = `❌ Error computing visual diff: ${err.message}`;
        if (ctx?.ui?.notify) ctx.ui.notify(errMsg);
        else console.error(errMsg);
      }
    },
  });
}
