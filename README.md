# pi-sdd-design 🎨

> **Design-Driven Spec-Driven Development (SDD) for Pi Coding Agent**  
> Integrated with Google Stitch MCP, Visual Trajectory tracking, and Clean Architecture componentization.

[![Pi Extension](https://img.shields.io/badge/Pi-Extension-blue.svg)](https://github.com/Gentleman-Programming/gentle-pi)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 💡 Philosophy: Concepts > Code

In traditional AI coding workflows, asking an AI model to "design a screen" results in monolithic, copy-pasted HTML with hardcoded hex colors, zero separation of concerns, and immediate technical debt.

**`pi-sdd-design`** bridges product intent with production-grade engineering by implementing a 6-phase Design SDD DAG inside **Pi Coding Agent**:

```
[1. Explore] ──► [2. Spec / DESIGN.md] ──► [3. Generate (Stitch MCP)] ──► [4. Judge (Taste & A11y)] ──► [5. Apply (React AST)] ──► [6. Trajectory]
```

Inspired by **DeepSeek Harness** (`dsh`), every design iteration is tracked in an immutable, inspectable **Design Trajectory** (`.stitch/trajectory.json`) so you can review why decisions were made, audit screenshots, and roll back when needed.

---

## 🚀 Quick Start

### 1. Install into Pi Coding Agent

```bash
# Global installation for all Pi sessions
pi install git:github.com/Gentleman-Programming/pi-sdd-design

# Or install locally in current project:
pi install -l .
```

### 2. Configure Stitch API Key

Ensure `STITCH_API_KEY` is present in your `.env` or Pi settings:

```env
STITCH_API_KEY=AQ.Ab8RN6...
```

### 3. Open Pi and Use Design Commands

```text
/design:new [name]          # Initialize or scaffold .stitch/DESIGN.md
/design:generate <prompt>   # Call Stitch MCP to generate screens & record trajectory
/design:judge               # Conduct adversarial WCAG AA & 8pt grid audit
/design:apply               # Transform HTML into modular React + TypeScript components
/design:trajectory          # View the visual iteration history and review scores
```

---

## 🤖 Profiles for `pi-sdd-profiles`

Integrated out of the box with [pi-sdd-profiles](https://github.com/CinloDev/pi-sdd-profiles). Press `Alt + M` in Pi to toggle:

- **`design-balanced`**:
  - `design-architect`: Claude 3.7 Sonnet (High reasoning)
  - `stitch-builder`: Gemini 2.5 Flash (Fast MCP execution)
  - `taste-critic`: Gemini 2.5 Pro (Multimodal screenshot review)
  - `component-crafter`: Claude 3.7 Sonnet (Strict TypeScript & Clean Architecture)

- **`design-visionary`**:
  - Full multimodal reasoning with Gemini 2.5 Pro + Claude 3.7 Sonnet.

- **`design-local-ollama`** (100% Offline / Local GPU):
  - Local code and design generation using Ollama (`richardyoung/qwen2.5-coder-14b-instruct-abliterated` or compatible) with zero cloud vendor lock-in.

---

## ⚡ Dual-Engine: Google Stitch MCP + Local Ollama

`pi-sdd-design` supports both cloud-based **Google Stitch MCP** and **local offline LLMs via Ollama**:

```env
# Cloud Stitch
STITCH_API_KEY=AQ.Ab8RN6...

# Local / Private Ollama (optional)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=richardyoung/qwen2.5-coder-14b-instruct-abliterated
OLLAMA_API_KEY=your_key_here  # If using an authenticated proxy/gateway
```

Run the end-to-end product generation test on your local GPU:
```bash
npm run test:e2e
```

---

## 🛡️ Architectural Gates (AST Enforcement)

Generated components are statically validated before being accepted:
- ❌ **Zero Unmapped Hex**: Arbitrary hex colors (`#1a2b3c`) are rejected; only theme tokens allowed.
- ❌ **Mandatory Types**: Every component must declare a `Readonly<Props>` interface.
- ❌ **Decoupled Data**: Large inline mock arrays are moved to `src/data/mockData.ts`.
- ❌ **Modular Structure**: Monolithic files (>400 lines) must be split into atomic subcomponents.

---

## 📂 Project Structure

```
pi-sdd-design/
├── index.ts                   # Pi Extension entry point
├── package.json
├── tsconfig.json
├── profiles/                  # Model profiles for pi-sdd-profiles
│   ├── design-balanced.json
│   ├── design-visionary.json
│   └── design-local-ollama.json
├── subagents/                 # Specialized Pi subagents
│   ├── design-architect.json
│   ├── stitch-builder.json
│   ├── taste-critic.json
│   └── component-crafter.json
├── scripts/
│   └── test-product-generation.ts # E2E generation & AST audit with Ollama
├── src/
│   ├── types/                 # Pluggable Provider & CodeTarget interfaces
│   ├── trajectory/            # Immutable version history (.stitch/trajectory.json)
│   ├── tokens/                # DESIGN.md & Tailwind parser
│   ├── ast/                   # Architectural rule validator
│   ├── mcp/                   # Google Stitch JSON-RPC client
│   ├── providers/             # Ollama & Stitch providers
│   ├── workflow/              # SDD Design DAG engine
│   └── components/            # Generated Clean Architecture React components
└── test/                      # Vitest unit tests
```

---

## ⚖️ License

MIT License. Designed with ❤️ for the Gentleman Programming and Pi Coding Agent community.
