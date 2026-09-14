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
    const result: DesignSystem = {
      name: "Imported Design System",
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
      const listMatch = trimmed.match(/^[-*]\s+\*\*?([a-zA-Z0-9_-]+)\*\*?:\s*([^\s]+)/);
      if (listMatch) {
        const [, key, val] = listMatch;
        if (currentCategory === "colors") result.colors[key] = val;
        else if (currentCategory === "typography") result.typography.fontFamilies[key] = val;
        else if (currentCategory === "spacing") result.spacing[key] = val;
        else if (currentCategory === "radius") result.borderRadius[key] = val;
        continue;
      }

      const tableMatch = trimmed.match(/^\|\s*([a-zA-Z0-9_-]+)\s*\|\s*([^|]+)\s*\|/);
      if (tableMatch && !trimmed.includes("---") && !/token|name/i.test(tableMatch[1])) {
        const [, key, val] = tableMatch;
        const cleanVal = val.trim();
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
}
