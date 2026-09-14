/**
 * Core types for pi-sdd-design: Design-driven SDD engine for Pi Coding Agent
 */

export interface DesignToken {
  name: string;
  value: string;
  category: "color" | "typography" | "spacing" | "radius" | "shadow";
  description?: string;
}

export interface DesignSystem {
  name: string;
  version: string;
  colors: Record<string, string>;
  typography: {
    fontFamilies: Record<string, string>;
    fontSizes: Record<string, string>;
  };
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  rawTailwindConfig?: Record<string, any>;
}

export interface ScreenArtifact {
  screenId: string;
  projectId: string;
  title: string;
  htmlContent: string;
  screenshotUrl: string;
  width?: number;
  height?: number;
  downloadUrls?: {
    html?: string;
    screenshot?: string;
  };
}

export interface ScreenSummary {
  screenId: string;
  title: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Pluggable Design Provider (Stitch, Figma, Penpot, Local)
 * Inspired by DeepSeek Harness microkernel architecture
 */
export interface DesignProvider {
  readonly name: string;
  createProject(title: string): Promise<string>;
  generateScreen(
    projectId: string,
    prompt: string,
    options?: { deviceType?: "DESKTOP" | "MOBILE" | "TABLET" }
  ): Promise<ScreenArtifact>;
  getScreen(screenId: string): Promise<ScreenArtifact>;
  listScreens(projectId: string): Promise<ScreenSummary[]>;
  syncDesignSystem?(projectId: string): Promise<DesignSystem>;
}

/**
 * Pluggable Code Target (React, React Native, Vue, Svelte)
 */
export interface CodeTarget {
  readonly name: string;
  readonly targetFramework: "react" | "react-native" | "vue" | "svelte";
  transform(
    artifact: ScreenArtifact,
    designSystem: DesignSystem
  ): Promise<TransformResult>;
}

export interface ComponentFile {
  relativePath: string;
  content: string;
  type: "atom" | "molecule" | "organism" | "page" | "hook" | "mock-data";
}

export interface TransformResult {
  files: ComponentFile[];
  entryPointSnippet?: string;
  summary: string;
}

/**
 * Taste and Visual Review Verdict (Judgment Day for Design)
 */
export interface TasteReviewVerdict {
  status: "APPROVED" | "REJECTED" | "NEEDS_REVISION";
  overallScore: number; // 0 to 100
  wcagContrast: {
    passes: boolean;
    contrastRatioMin: number;
    notes: string;
  };
  grid8pt: {
    passes: boolean;
    violationsCount: number;
    notes: string;
  };
  hierarchy: {
    passes: boolean;
    notes: string;
  };
  critiqueNotes: string[];
  recommendations: string[];
}

/**
 * Visual Regression and Diff Result
 */
export interface VisualDiffResult {
  hasDifference: boolean;
  diffPixelCount: number;
  totalPixels: number;
  diffPercentage: number;
  diffImagePath: string;
  baselineIteration: number;
  currentIteration: number;
}

/**
 * Design Trajectory Entry (Immutable version history)
 * Inspired by deepseek-harness trajectory event logs
 */
export interface DesignTrajectoryEntry {
  id: string;
  timestamp: string;
  iteration: number;
  prompt: string;
  screenId: string;
  screenshotUrl: string;
  localHtmlPath: string;
  localScreenshotPath: string;
  tasteReview?: TasteReviewVerdict;
  visualDiff?: VisualDiffResult;
  componentChanges?: string[];
}

export interface DesignTrajectory {
  projectId: string;
  projectName: string;
  createdAt: string;
  updatedAt: string;
  activeIteration: number;
  history: DesignTrajectoryEntry[];
}

/**
 * AST Validation Rules and Report
 */
export type AstValidationRule =
  | "no-hardcoded-hex"
  | "require-props-interface"
  | "decouple-mock-data"
  | "require-readonly-props"
  | "no-monolithic-page";

export interface AstViolation {
  file: string;
  line?: number;
  column?: number;
  rule: AstValidationRule;
  message: string;
  snippet?: string;
}

export interface AstValidationReport {
  isValid: boolean;
  violations: AstViolation[];
  scannedFilesCount: number;
}
