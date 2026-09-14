# Design System: Obsidian Lumina (Google Stitch Reference)
*Version 2.0.0 - Institutional Web3 Glassmorphism Architecture*

---

## Brand & Style
This design system embodies the precision, security, and computational elegance of an institutional-grade decentralized terminal.
Visual direction merges **refined glassmorphism** with **cybernetic minimalism**:
- Translucent obsidian sheets float atop deep void canvases with hardware-accelerated backdrop blur (`backdrop-filter: blur(16px)`).
- Luminescent, sub-pixel hairline edges demarcate boundaries without heavy visual weight.
- Controlled cold-spectrum neon flares (`#00F2FE` Electric Cyan, `#10B981` Emerald Neon, `#8B5CF6` Luminescent Amethyst).
- Tabular data typography aligned to an 8pt base grid.

---

## Colors
| Token | Value | Role |
| :--- | :--- | :--- |
| `background` | `#0b0e14` | Pure obsidian void canvas |
| `surface` | `#10131a` | Base surface foundation |
| `surface-container-low` | `#191c22` | Secondary panel container |
| `surface-container` | `#1d2026` | Card and modal container |
| `surface-container-high` | `#272a31` | Elevated controls and pills |
| `primary` | `#00f2fe` | Electric Cyan - Primary CTA & active telemetry |
| `secondary` | `#10b981` | Emerald Neon - Positive yield, APY, success |
| `tertiary` | `#8b5cf6` | Luminescent Amethyst - Staking, governance |
| `error` | `#f43f5e` | Rose Neon - Liquidation alerts, downward delta |
| `warning` | `#f59e0b` | Amber - Slippage warning, gas spikes |
| `border` | `rgba(255, 255, 255, 0.08)` | Sub-pixel hairline border |

---

## Typography
| Role | Family |
| :--- | :--- |
| `sans` | Plus Jakarta Sans, system-ui, sans-serif |
| `heading` | Plus Jakarta Sans, sans-serif |
| `mono` | JetBrains Mono, monospace |

---

## Spacing (8pt Grid)
| Token | Size |
| :--- | :--- |
| `1` | `0.25rem` |
| `2` | `0.5rem` |
| `3` | `0.75rem` |
| `4` | `1rem` |
| `6` | `1.5rem` |
| `8` | `2rem` |

---

## Border Radius
| Token | Radius |
| :--- | :--- |
| `sm` | `0.25rem` |
| `DEFAULT` | `0.5rem` |
| `lg` | `0.75rem` |
| `xl` | `1rem` |
| `full` | `9999px` |

---

## Elevation & Depth (Glass Tiers)
- **Tier 1 (Structural Rail / Panels):** `background: rgba(18, 24, 36, 0.85); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.05);`
- **Tier 2 (Analytical Cards / Data Modules):** `background: rgba(24, 32, 48, 0.70); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08);`
- **Tier 3 (Floating Modals / Popovers):** `background: rgba(24, 32, 48, 0.95); backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.15); box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.7);`

---

## Responsive Grid
- **Desktop (1280px+):** 12-column dynamic grid (`gap: 1.25rem`, `margin: 2rem`)
- **Tablet (768px - 1279px):** 8-column layout
- **Mobile (< 768px):** 4-column single/dual stack (`gap: 0.75rem`, `margin: 1rem`), zero horizontal overflow.