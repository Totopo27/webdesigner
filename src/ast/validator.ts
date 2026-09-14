import * as fs from "node:fs";
import * as path from "node:path";
import type {
  AstValidationReport,
  AstViolation,
} from "../types/index.js";

export class ComponentValidator {
  /**
   * Validates a single component source code string
   */
  public static validateSource(
    sourceCode: string,
    filePath: string = "Component.tsx"
  ): AstViolation[] {
    const violations: AstViolation[] = [];
    const lines = sourceCode.split("\n");

    // 1. Check for hardcoded hex colors: #fff, #1a2b3c, etc.
    // Allowed exceptions: comments or CSS variable definitions like #00000000
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Skip comment lines
      if (/^\s*(?:\/\/|\/\*|\*)/.test(line)) continue;

      const hexMatches = line.matchAll(/(?<![a-zA-Z0-9_-])#([a-fA-F0-9]{3,8})(?![a-zA-Z0-9_-])/g);
      for (const match of hexMatches) {
        // Skip common SVG/transparent defaults like #000 or #fff if in an icon
        const hex = match[0].toLowerCase();
        if (line.includes("<path") || line.includes("<svg") || hex === "#000" || hex === "#fff") {
          continue;
        }

        violations.push({
          file: filePath,
          line: i + 1,
          column: match.index,
          rule: "no-hardcoded-hex",
          message: `Hardcoded hex color '${match[0]}' found. Use theme token classes instead.`,
          snippet: line.trim(),
        });
      }
    }

    // 2. Check for required Props interface
    const isComponentFile = /\.(?:tsx|jsx)$/.test(filePath);
    if (isComponentFile) {
      let propsDefinition = sourceCode;
      const importedPropsMatch = sourceCode.match(/import\s+(?:type\s+)?\{[^}]*([a-zA-Z0-9_]*Props)[^}]*\}\s+from\s+["'](\.[^"']+)["']/);
      if (importedPropsMatch) {
        const importRelative = importedPropsMatch[2].replace(/\.js$/, "");
        const siblingPath = path.resolve(path.dirname(filePath), `${importRelative}.ts`);
        if (fs.existsSync(siblingPath)) {
          propsDefinition = fs.readFileSync(siblingPath, "utf-8");
        }
      }

      const hasPropsInterface = /(?:interface|type)\s+[a-zA-Z0-9_]*Props\b/.test(propsDefinition);
      if (!hasPropsInterface) {
        violations.push({
          file: filePath,
          rule: "require-props-interface",
          message: `Component file is missing an explicit TypeScript Props interface (e.g. interface ${path.basename(
            filePath,
            path.extname(filePath)
          )}Props).`,
        });
      } else {
        // 3. Check for Readonly usage in Props
        const hasReadonly = /Readonly<|readonly\s+[a-zA-Z0-9_]+:/.test(propsDefinition);
        if (!hasReadonly) {
          violations.push({
            file: filePath,
            rule: "require-readonly-props",
            message: `Props interface should enforce immutability with Readonly<Props> or readonly properties.`,
          });
        }
      }

      // 4. Check for monolithic page anti-pattern (> 400 lines)
      if (lines.length > 400 && !filePath.includes("mockData")) {
        violations.push({
          file: filePath,
          rule: "no-monolithic-page",
          message: `Component is ${lines.length} lines long. Monolithic files are prohibited; extract atomic subcomponents into src/components/.`,
        });
      }

      // 5. Check for inline large mock data arrays (> 3 objects inline)
      const inlineArrayMatch = sourceCode.match(/const\s+[a-zA-Z0-9_]+\s*=\s*\[\s*\{[\s\S]*?\}\s*,\s*\{[\s\S]*?\}\s*,\s*\{[\s\S]*?\}\s*\]/);
      if (inlineArrayMatch && !filePath.includes("mockData") && !filePath.includes(".test.")) {
        violations.push({
          file: filePath,
          rule: "decouple-mock-data",
          message: `Large inline mock data detected inside component. Decouple data into src/data/mockData.ts.`,
        });
      }
    }

    return violations;
  }

  /**
   * Validates all TypeScript/TSX files within a directory
   */
  public static validateDirectory(dirPath: string): AstValidationReport {
    const allViolations: AstViolation[] = [];
    let scannedCount = 0;

    const scan = (current: string) => {
      if (!fs.existsSync(current)) return;
      const entries = fs.readdirSync(current, { withFileTypes: true });

      for (const entry of entries) {
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== "node_modules" && entry.name !== ".git" && entry.name !== "dist") {
            scan(full);
          }
        } else if (/\.(?:tsx|ts)$/.test(entry.name) && !entry.name.endsWith(".d.ts")) {
          scannedCount++;
          const code = fs.readFileSync(full, "utf-8");
          const violations = ComponentValidator.validateSource(code, full);
          allViolations.push(...violations);
        }
      }
    };

    scan(dirPath);

    return {
      isValid: allViolations.length === 0,
      violations: allViolations,
      scannedFilesCount: scannedCount,
    };
  }
}
