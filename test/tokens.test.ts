import { describe, it, expect } from "vitest";
import { TokenParser } from "../src/tokens/parser.js";

describe("TokenParser", () => {
  it("should extract design tokens from Stitch HTML", () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <script>
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  primary: '#1e40af',
                  accent: '#f59e0b'
                },
                fontFamily: {
                  sans: 'Geist, sans-serif'
                }
              }
            }
          };
        </script>
      </head>
      <body></body>
      </html>
    `;

    const system = TokenParser.extractFromHtml(mockHtml, "Test System");
    expect(system.name).toBe("Test System");
    expect(system.colors.primary).toBe("#1e40af");
    expect(system.colors.accent).toBe("#f59e0b");
    expect(system.typography.fontFamilies.sans).toBe("Geist, sans-serif");
  });

  it("should parse and format DESIGN.md markdown", () => {
    const markdown = `
# Design System: Acme

## Colors
| Token | Value |
| :--- | :--- |
| primary | #3b82f6 |
| background | #09090b |

## Typography
| Role | Family |
| :--- | :--- |
| sans | Inter, sans-serif |
    `;

    const parsed = TokenParser.parseDesignMarkdown(markdown);
    expect(parsed.colors.primary).toBe("#3b82f6");
    expect(parsed.colors.background).toBe("#09090b");
    expect(parsed.typography.fontFamilies.sans).toBe("Inter, sans-serif");

    const generated = TokenParser.generateDesignMarkdown(parsed);
    expect(generated).toContain("## Colors");
    expect(generated).toContain("`primary`");

    // Roundtrip verification: parse the generated markdown back
    const roundtrip = TokenParser.parseDesignMarkdown(generated);
    expect(roundtrip.name).toBe("Acme");
    expect(roundtrip.colors.primary).toBe("#3b82f6");
    expect(roundtrip.colors.background).toBe("#09090b");
  });

  it("should generate and parse Tailwind v4 @theme CSS", () => {
    const system = {
      name: "Neo Theme",
      version: "1.0.0",
      colors: {
        primary: "#6366f1",
        accent: "#ec4899",
        background: "#030712",
        foreground: "#f9fafb",
      },
      typography: {
        fontFamilies: {
          sans: "Outfit, sans-serif",
        },
        fontSizes: {},
      },
      spacing: {
        "1": "0.25rem",
        "2": "0.5rem",
      },
      borderRadius: {
        md: "0.375rem",
      },
    };

    const v4Css = TokenParser.generateTailwindV4Theme(system);
    expect(v4Css).toContain("@theme {");
    expect(v4Css).toContain("--color-primary: #6366f1;");
    expect(v4Css).toContain("--color-accent: #ec4899;");
    expect(v4Css).toContain("--font-sans: Outfit, sans-serif;");
    expect(v4Css).toContain("--spacing-1: 0.25rem;");
    expect(v4Css).toContain("--radius-md: 0.375rem;");

    // Roundtrip verification
    const parsedFromCss = TokenParser.parseTailwindV4Theme(v4Css, "Neo Theme");
    expect(parsedFromCss.colors.primary).toBe("#6366f1");
    expect(parsedFromCss.colors.accent).toBe("#ec4899");
    expect(parsedFromCss.typography.fontFamilies.sans).toBe("Outfit, sans-serif");
    expect(parsedFromCss.spacing["1"]).toBe("0.25rem");
    expect(parsedFromCss.borderRadius["md"]).toBe("0.375rem");
  });

  it("should generate standard CSS variables for modern component systems", () => {
    const system = {
      name: "Shadcn Compatible",
      version: "1.0.0",
      colors: {
        primary: "#3b82f6",
        background: "#ffffff",
        foreground: "#09090b",
      },
      typography: {
        fontFamilies: {
          sans: "Inter, sans-serif",
        },
        fontSizes: {},
      },
      spacing: {},
      borderRadius: {
        default: "0.5rem",
      },
    };

    const cssVars = TokenParser.generateCssVariables(system);
    expect(cssVars).toContain(":root {");
    expect(cssVars).toContain("--primary: #3b82f6;");
    expect(cssVars).toContain("--background: #ffffff;");
    expect(cssVars).toContain("--foreground: #09090b;");
    expect(cssVars).toContain("--radius: 0.5rem;");
  });

  it("should extract tokens from HTML containing Tailwind v4 @theme style blocks", () => {
    const htmlWithV4 = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @theme {
            --color-brand: #10b981;
            --color-surface: #111827;
            --font-display: Cal Sans, sans-serif;
          }
        </style>
      </head>
      <body></body>
      </html>
    `;

    const extracted = TokenParser.extractFromHtml(htmlWithV4, "V4 Extraction");
    expect(extracted.colors.brand).toBe("#10b981");
    expect(extracted.colors.surface).toBe("#111827");
    expect(extracted.typography.fontFamilies.display).toBe("Cal Sans, sans-serif");
  });
});
