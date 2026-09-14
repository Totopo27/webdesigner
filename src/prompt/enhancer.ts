/**
 * StitchPromptEnhancer
 * SOTA prompt expansion pipeline inspired by Google Stitch (dalmaer/stitch-prompt and stitch-skills).
 * Transforms raw one-line user ideas into comprehensive, high-density architectural specifications.
 */

export interface EnhancedPromptResult {
  rawPrompt: string;
  enhancedPrompt: string;
  category: "travel" | "social" | "defi" | "ecommerce" | "saas" | "dashboard" | "general";
  title: string;
}

export class StitchPromptEnhancer {
  /**
   * Detects the dominant domain from the user's prompt
   */
  public static detectCategory(prompt: string): EnhancedPromptResult["category"] {
    const lower = prompt.toLowerCase();
    if (/travel|california|flight|hotel|trip|destination|getaway|tour|vacation/i.test(lower)) {
      return "travel";
    }
    if (/dog|pet|social|feed|chat|community|park|walk/i.test(lower)) {
      return "social";
    }
    if (/defi|crypto|token|vault|wallet|swap|blockchain|staking|yield|web3/i.test(lower)) {
      return "defi";
    }
    if (/shop|store|cart|ecommerce|product|checkout|fashion|buy|sale/i.test(lower)) {
      return "ecommerce";
    }
    if (/dashboard|metric|analytics|stat|chart|kpi|admin/i.test(lower)) {
      return "dashboard";
    }
    if (/saas|crm|b2b|tool|project|task|workflow/i.test(lower)) {
      return "saas";
    }
    return "general";
  }

  /**
   * Generates a clean, professional product title
   */
  public static inferTitle(prompt: string, category: EnhancedPromptResult["category"]): string {
    const words = prompt.split(/\s+/).slice(0, 5).join(" ");
    if (category === "travel") return "Aura // Travel & Expeditions";
    if (category === "social") return "BarkSpot // Neighborhood Network";
    if (category === "defi") return "Aether // Web3 Liquidity Matrix";
    if (category === "ecommerce") return "Lumina // Curated Commerce";
    if (category === "dashboard") return "Apex // Systems Telemetry";
    return words.replace(/[^a-zA-Z0-9\s]/g, "").trim() || "Interface Matrix";
  }

  /**
   * Expands a vague prompt into a full architectural specification
   */
  public static enhance(prompt: string): EnhancedPromptResult {
    const category = this.detectCategory(prompt);
    const title = this.inferTitle(prompt, category);

    let specificDirectives = "";

    switch (category) {
      case "travel":
        specificDirectives = `
DOMAIN ARCHITECTURE & DATA SPECIFICATION:
1. Header & Navigation:
   - Minimalist dark navigation bar with '${title}' logo, search input with '⌘K' shortcut badge, destination category tabs (Coastal, Wine Country, Alpine, Urban), and 'Book Expeditions' CTA button.
2. Striking Asymmetric Hero:
   - Split layout: Left column with bold headline, quick trip planner filter bar (Dates, Region, Budget slider, Vibe tags). Right column with high-resolution featured destination spotlight (e.g., Big Sur Cliffside Sanctuary) with live weather badge (68F Sunset), review score (4.96 / 5.0), and direct reservation pill.
3. Curated Destinations & Experiences (NEVER USE 3 IDENTICAL EQUAL CARDS):
   - Asymmetric 2-column or 4-tile grid:
     * Card 1 (Wide): Napa Valley Vineyard Reserve - includes tasting notes tag, vintage badge, booking price ($320/person), and reservation button.
     * Card 2 (Standard): Yosemite High Sierra Trek - elevation indicator, trail difficulty badge (Moderate), permit status.
     * Card 3 (Vertical Spotlight): Big Sur Coastal Highway Retreat - panoramic photo banner, private cabin access.
4. Upcoming Live Events & Culture Section:
   - Interactive calendar listing with ticket availability badges, artist line-ups, venue tags, and price indicators (e.g., Monterey Jazz Festival, San Francisco Symphony Gala).
5. Footer:
   - Environmental preservation commitment badge, local guide network accreditation, currency selector (USD/EUR), and copyright text.
`;
        break;

      case "social":
        specificDirectives = `
DOMAIN ARCHITECTURE & DATA SPECIFICATION:
1. Header & Navigation:
   - Clean top bar with '${title}', neighborhood selector dropdown (e.g. 'Pacific Heights, SF'), active walkers counter ('148 nearby'), and new post modal trigger.
2. Community Feed & Interactive Park Ratings (NEVER USE 3 IDENTICAL EQUAL CARDS):
   - Two-column asymmetric layout:
     * Left Column (7 cols): Dynamic community photo stream with dog profile avatars, breed pills (Golden Retriever, French Bulldog), verified park check-in badges, timestamp, and interactive reactions (Paw, Heart, Comment).
     * Right Column (5 cols): Top-Rated Neighborhood Parks leaderboard with rating badges (4.9 / 5.0), off-leash hours indicator, agility equipment amenities tags, and 'Rate Park' interactive review button.
3. Interactive Map & Group Walk Schedule:
   - Upcoming weekend pack walk cards with attendee count, route distance (2.4 miles), and 'Join Walk' action.
4. Footer:
   - Pet safety guidelines link, community moderation standards, and neighborhood directory.
`;
        break;

      case "defi":
      case "dashboard":
        specificDirectives = `
DOMAIN ARCHITECTURE & DATA SPECIFICATION:
1. Top Navigation:
   - Glassmorphism top bar with '${title}' monogram, network latency pill (18ms), wallet balance badge (2.45 ETH), and address pill.
2. Metrics Overview Grid:
   - 4-tile responsive metrics row with tabular monospace numbers, positive/negative delta badges (+14.2% in emerald neon), and micro-sparkline indicators.
3. Analytical Ledger & Action Panel:
   - 8-column data table with alternate row highlighting, asset pairs, APY rates, and status tags.
   - 4-column execution module with token selector, slippage tolerance toggles, and high-contrast execution button.
`;
        break;

      default:
        specificDirectives = `
DOMAIN ARCHITECTURE & DATA SPECIFICATION:
1. Top Navigation:
   - Clean structural header with brand identifier, search bar with keyboard shortcut, navigation links, and primary action.
2. Hero & Value Proposition:
   - Asymmetrical layout with strong visual hierarchy, clear secondary metadata, and zero generic filler copy.
3. Content Architecture (NEVER USE 3 IDENTICAL EQUAL CARDS):
   - Multi-tier layout with mixed card dimensions, data badges, interactive controls, and visual variety.
`;
        break;
    }

    const enhancedPrompt = `
PRODUCT SPECIFICATION: ${title}
USER INTENT: ${prompt}

PLATFORM & LAYOUT:
- Web, Desktop-first with seamless Mobile-first collapse (< 768px).
- Maximum layout width: 1400px centered with responsive gutters.

DESIGN PRINCIPLES (STRICT ANTI-SLOP):
- NEVER output a generic row of 3 identical cards. Provide visual variance, asymmetric grids, or mixed card weights.
- NEVER use toy/clown colors (no bright saturated green, red, or yellow cards).
- Use Obsidian Lumina palette: deep obsidian background (#0b0e14), subtle slate surfaces (#10131a to #1d2026), sub-pixel borders (rgba(255,255,255,0.08)), and at most ONE primary accent (Electric Cyan #00f2fe or Emerald Neon #10b981).
- Typography: Plus Jakarta Sans for UI and JetBrains Mono with tabular numerals for all metrics, dates, and prices.
- Glass tiers: .tier-1-glass (85% opacity, blur 12px), .tier-2-glass (70% opacity, blur 16px), .tier-3-glass (95% opacity, blur 24px).
- All numbers, prices, ratings, and stats must use realistic domain values (no fake 99.99% or lorem ipsum).

${specificDirectives}
`.trim();

    return {
      rawPrompt: prompt,
      enhancedPrompt,
      category,
      title,
    };
  }
}
