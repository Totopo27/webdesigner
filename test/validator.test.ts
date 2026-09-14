import { describe, it, expect } from "vitest";
import { ComponentValidator } from "../src/ast/validator.js";

describe("ComponentValidator", () => {
  it("should flag hardcoded hex colors", () => {
    const code = `
      import React from 'react';
      export interface HeaderProps { readonly title: string; }
      export const Header: React.FC<HeaderProps> = ({ title }) => (
        <div style={{ backgroundColor: '#ff0000' }}>
          <h1>{title}</h1>
        </div>
      );
    `;

    const violations = ComponentValidator.validateSource(code, "Header.tsx");
    const hexViolations = violations.filter((v) => v.rule === "no-hardcoded-hex");
    expect(hexViolations.length).toBeGreaterThan(0);
    expect(hexViolations[0].message).toContain("#ff0000");
  });

  it("should flag missing Props interface", () => {
    const code = `
      import React from 'react';
      export const Card = () => <div>Card</div>;
    `;

    const violations = ComponentValidator.validateSource(code, "Card.tsx");
    expect(violations.some((v) => v.rule === "require-props-interface")).toBe(true);
  });

  it("should pass when clean architecture rules are respected", () => {
    const cleanCode = `
      import React from 'react';
      export interface CleanCardProps {
        readonly title: string;
        readonly description: string;
      }
      export const CleanCard: React.FC<CleanCardProps> = ({ title, description }) => (
        <div className="bg-card text-card-foreground p-4 rounded-lg">
          <h3 className="text-lg font-bold">{title}</h3>
          <p>{description}</p>
        </div>
      );
    `;

    const violations = ComponentValidator.validateSource(cleanCode, "CleanCard.tsx");
    expect(violations.length).toBe(0);
  });
});
