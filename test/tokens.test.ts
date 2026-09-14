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
});
