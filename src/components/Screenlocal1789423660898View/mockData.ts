import type { Screenlocal1789423660898ViewItem } from "./types.js";

export const mockScreenlocal1789423660898ViewData = {
  title: "Dashboard Overview",
  items: [
    { id: "1", title: "Active Deployments", description: "All microservices running at 99.98% uptime." },
    { id: "2", title: "Design Tokens", description: "Synchronized with .stitch/DESIGN.md." },
    { id: "3", title: "Agent Harness", description: "Connected with Pi Coding Agent." },
  ] as const satisfies ReadonlyArray<Screenlocal1789423660898ViewItem>,
};
