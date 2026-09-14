import type { Screen1789423065388ViewItem } from "./types.js";

export const mockScreen1789423065388ViewData = {
  title: "Dashboard Overview",
  items: [
    { id: "1", title: "Active Deployments", description: "All microservices running at 99.98% uptime." },
    { id: "2", title: "Design Tokens", description: "Synchronized with .stitch/DESIGN.md." },
    { id: "3", title: "Agent Harness", description: "Connected with Pi Coding Agent." },
  ] as const satisfies ReadonlyArray<Screen1789423065388ViewItem>,
};
