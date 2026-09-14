import type { DesignSystem } from "../types/index.js";

export class TokenParser {
  /**
   * Extracts Tailwind config or design tokens from Stitch generated HTML <head>
   */
  public static extractFromHtml(html: string, systemName: string = "Stitch Design"): DesignSystem {
    const result: DesignSystem = {
      name: systemName,
      version: "1.0.0",
      colors: {},
      typography: {
        fontFamilies: {},
        fontSizes: {},
      },
      spacing: {},
      borderRadius: {},
    };

    // 0. Look for Tailwind v4 @theme style blocks in HTML
    const v4Match = html.match(/@theme\s*\{([\s\S]*?)\}/i);
    if (v4Match) {
      const v4Parsed = this.parseTailwindV4Theme(v4Match[0], systemName);
      result.colors = { ...result.colors, ...v4Parsed.colors };
      result.typography.fontFamilies = { ...result.typography.fontFamilies, ...v4Parsed.typography.fontFamilies };
      result.spacing = { ...result.spacing, ...v4Parsed.spacing };
      result.borderRadius = { ...result.borderRadius, ...v4Parsed.borderRadius };
    }

    // 1. Look for tailwind.config script block
    const twMatch = html.match(/tailwind\.config\s*=\s*(\{[\s\S]*?\});/);
    if (twMatch && twMatch[1]) {
      try {
        // Safe evaluation of JS object literal via Function constructor or regex
        const cleaned = twMatch[1]
          .replace(/([a-zA-Z0-9_-]+):/g, '"$1":')
          .replace(/'/g, '"');
        const parsed = JSON.parse(cleaned);

        if (parsed.theme?.extend?.colors) {
          result.colors = { ...result.colors, ...parsed.theme.extend.colors };
        }
        if (parsed.theme?.extend?.fontFamily) {
          result.typography.fontFamilies = {
            ...result.typography.fontFamilies,
            ...parsed.theme.extend.fontFamily,
          };
        }
        if (parsed.theme?.extend?.borderRadius) {
          result.borderRadius = {
            ...result.borderRadius,
            ...parsed.theme.extend.borderRadius,
          };
        }
        result.rawTailwindConfig = parsed;
      } catch {
        // Fallback to regex token extraction if JSON parsing fails
      }
    }

    // 2. Regex fallback for colors (hex, rgb, hsl, var)
    const colorMatches = html.matchAll(/(?:bg-|text-|border-)\[(#[a-fA-F0-9]{3,8})\]/g);
    let colorIdx = 1;
    for (const match of colorMatches) {
      const hex = match[1];
      if (!Object.values(result.colors).includes(hex)) {
        result.colors[`custom-${colorIdx++}`] = hex;
      }
    }

    // Default fallbacks if empty
    if (Object.keys(result.colors).length === 0) {
      result.colors = {
        primary: "#2563eb",
        secondary: "#64748b",
        background: "#ffffff",
        foreground: "#0f172a",
        muted: "#f1f5f9",
      };
    }

    if (Object.keys(result.typography.fontFamilies).length === 0) {
      result.typography.fontFamilies = {
        sans: "Inter, system-ui, sans-serif",
      };
    }

    return result;
  }

  /**
   * Parses a DESIGN.md markdown document into a DesignSystem object
   */
  public static parseDesignMarkdown(markdown: string): DesignSystem {
    const titleMatch = markdown.match(/^#+\s+(?:Design System:?\s*)?([^\r\n*]+)/m);
    const result: DesignSystem = {
      name: titleMatch ? titleMatch[1].trim() : "Imported Design System",
      version: "1.0.0",
      colors: {},
      typography: {
        fontFamilies: {},
        fontSizes: {},
      },
      spacing: {},
      borderRadius: {},
    };

    const lines = markdown.split("\n");
    let currentCategory: "colors" | "typography" | "spacing" | "radius" | null = null;

    for (const line of lines) {
      const trimmed = line.trim();

      // Heading detection
      if (/^#+\s+(?:Colors|Colores|Paleta)/i.test(trimmed)) {
        currentCategory = "colors";
        continue;
      } else if (/^#+\s+(?:Typography|Tipograf[ií]a|Fonts)/i.test(trimmed)) {
        currentCategory = "typography";
        continue;
      } else if (/^#+\s+(?:Spacing|Espaciado)/i.test(trimmed)) {
        currentCategory = "spacing";
        continue;
      } else if (/^#+\s+(?:Border\s*Radius|Bordes|Radio)/i.test(trimmed)) {
        currentCategory = "radius";
        continue;
      }

      // Token item detection (e.g. `- **primary**: #2563eb` or `| primary | #2563eb |`)
      const listMatch = trimmed.match(/^[-*]\s+\*\*?`?([a-zA-Z0-9_-]+)`?\*\*?:\s*`?([^\s`]+)`?/);
      if (listMatch) {
        const [, key, val] = listMatch;
        if (currentCategory === "colors") result.colors[key] = val;
        else if (currentCategory === "typography") result.typography.fontFamilies[key] = val;
        else if (currentCategory === "spacing") result.spacing[key] = val;
        else if (currentCategory === "radius") result.borderRadius[key] = val;
        continue;
      }

      const tableMatch = trimmed.match(/^\|\s*`?([a-zA-Z0-9_-]+)`?\s*\|\s*([^|]+)\s*\|/);
      if (tableMatch && !trimmed.includes("---") && !/token|role|name/i.test(tableMatch[1])) {
        const [, rawKey, rawVal] = tableMatch;
        const key = rawKey.replace(/`/g, "").trim();
        const cleanVal = rawVal.replace(/`/g, "").trim();
        if (currentCategory === "colors") result.colors[key] = cleanVal;
        else if (currentCategory === "typography") result.typography.fontFamilies[key] = cleanVal;
        else if (currentCategory === "spacing") result.spacing[key] = cleanVal;
        else if (currentCategory === "radius") result.borderRadius[key] = cleanVal;
      }
    }

    return result;
  }

  /**
   * Generates formatted DESIGN.md markdown from a DesignSystem object
   */
  public static generateDesignMarkdown(system: DesignSystem): string {
    const lines: string[] = [
      `# Design System: ${system.name}`,
      `*Version ${system.version} - Managed by pi-sdd-design*`,
      "",
      "---",
      "",
      "## Colors",
      "| Token | Value | Sample |",
      "| :--- | :--- | :--- |",
    ];

    for (const [key, val] of Object.entries(system.colors)) {
      lines.push(`| \`${key}\` | \`${val}\` | <span style="color:${val};">■</span> |`);
    }

    lines.push("");
    lines.push("## Typography");
    lines.push("| Role | Family |");
    lines.push("| :--- | :--- |");
    for (const [key, val] of Object.entries(system.typography.fontFamilies)) {
      lines.push(`| \`${key}\` | ${val} |`);
    }

    if (Object.keys(system.spacing).length > 0) {
      lines.push("");
      lines.push("## Spacing (8pt Grid)");
      lines.push("| Token | Size |");
      lines.push("| :--- | :--- |");
      for (const [key, val] of Object.entries(system.spacing)) {
        lines.push(`| \`${key}\` | \`${val}\` |`);
      }
    }

    if (Object.keys(system.borderRadius).length > 0) {
      lines.push("");
      lines.push("## Border Radius");
      lines.push("| Token | Radius |");
      lines.push("| :--- | :--- |");
      for (const [key, val] of Object.entries(system.borderRadius)) {
        lines.push(`| \`${key}\` | \`${val}\` |`);
      }
    }

    lines.push("");
    lines.push("---");
    lines.push("*Generated automatically by pi-sdd-design SDD engine.*");
    return lines.join("\n");
  }

  /**
   * Generates a tailwind.config extension snippet
   */
  public static generateTailwindConfigSnippet(system: DesignSystem): string {
    return `/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: ${JSON.stringify(system.colors, null, 8)},
      fontFamily: ${JSON.stringify(system.typography.fontFamilies, null, 8)},
      borderRadius: ${JSON.stringify(system.borderRadius, null, 8)},
    },
  },
};
`;
  }

  /**
   * Generates a modern Tailwind v4 @theme CSS block
   */
  public static generateTailwindV4Theme(system: DesignSystem): string {
    const lines: string[] = [
      `/* Tailwind v4 Theme: ${system.name} */`,
      `@theme {`,
    ];

    if (Object.keys(system.colors).length > 0) {
      lines.push(`  /* Colors */`);
      for (const [key, val] of Object.entries(system.colors)) {
        lines.push(`  --color-${key}: ${val};`);
      }
    }

    if (Object.keys(system.typography.fontFamilies).length > 0) {
      lines.push("");
      lines.push(`  /* Typography */`);
      for (const [key, val] of Object.entries(system.typography.fontFamilies)) {
        lines.push(`  --font-${key}: ${val};`);
      }
    }

    if (Object.keys(system.spacing).length > 0) {
      lines.push("");
      lines.push(`  /* Spacing */`);
      for (const [key, val] of Object.entries(system.spacing)) {
        lines.push(`  --spacing-${key}: ${val};`);
      }
    }

    if (Object.keys(system.borderRadius).length > 0) {
      lines.push("");
      lines.push(`  /* Border Radius */`);
      for (const [key, val] of Object.entries(system.borderRadius)) {
        lines.push(`  --radius-${key}: ${val};`);
      }
    }

    lines.push(`}`);
    return lines.join("\n");
  }

  /**
   * Generates standard :root CSS variables compatible with shadcn/ui and modern CSS
   */
  public static generateCssVariables(system: DesignSystem): string {
    const lines: string[] = [
      `/* Design System Variables: ${system.name} */`,
      `:root {`,
    ];

    for (const [key, val] of Object.entries(system.colors)) {
      lines.push(`  --${key}: ${val};`);
    }

    for (const [key, val] of Object.entries(system.typography.fontFamilies)) {
      lines.push(`  --font-${key}: ${val};`);
    }

    if (system.borderRadius.default) {
      lines.push(`  --radius: ${system.borderRadius.default};`);
    } else if (Object.keys(system.borderRadius).length > 0) {
      const first = Object.values(system.borderRadius)[0];
      lines.push(`  --radius: ${first};`);
    }

    lines.push(`}`);
    return lines.join("\n");
  }

  /**
   * Parses Tailwind v4 @theme or CSS custom properties into a DesignSystem object
   */
  public static parseTailwindV4Theme(css: string, systemName: string = "Tailwind v4 Theme"): DesignSystem {
    const result: DesignSystem = {
      name: systemName,
      version: "1.0.0",
      colors: {},
      typography: {
        fontFamilies: {},
        fontSizes: {},
      },
      spacing: {},
      borderRadius: {},
    };

    // 1. Color variables: --color-primary: #123; or --primary: #123;
    const colorMatches = css.matchAll(/--(?:color-)?([a-zA-Z0-9_-]+):\s*([^;]+);/g);
    for (const match of colorMatches) {
      const prop = match[1];
      const val = match[2].trim();

      if (
        prop.startsWith("font-") ||
        prop === "radius" ||
        prop.startsWith("radius-") ||
        prop.startsWith("spacing-")
      ) {
        continue;
      }

      // Check if value looks like a color (hex, rgb, hsl, oklch, var)
      if (/^#|[0-9a-fA-F]{3,8}|rgb|hsl|oklch/i.test(val)) {
        result.colors[prop] = val;
      }
    }

    // 2. Font variables: --font-sans: Inter, sans-serif;
    const fontMatches = css.matchAll(/--font-([a-zA-Z0-9_-]+):\s*([^;]+);/g);
    for (const match of fontMatches) {
      result.typography.fontFamilies[match[1]] = match[2].trim();
    }

    // 3. Spacing variables: --spacing-1: 0.25rem;
    const spacingMatches = css.matchAll(/--spacing-([a-zA-Z0-9_-]+):\s*([^;]+);/g);
    for (const match of spacingMatches) {
      result.spacing[match[1]] = match[2].trim();
    }

    // 4. Radius variables: --radius-md: 0.375rem; or --radius: 0.5rem;
    const radiusMatches = css.matchAll(/--radius(?:-([a-zA-Z0-9_-]+))?:\s*([^;]+);/g);
    for (const match of radiusMatches) {
      const key = match[1] || "default";
      result.borderRadius[key] = match[2].trim();
    }

    return result;
  }
}
