// Spare ports, so the servers Playwright starts don't clash with `pnpm dev`
const API_PORT = 3100;
const UI_PORT = 5174;

export const API_URL = `http://localhost:${API_PORT}`;
export const UI_URL = `http://localhost:${UI_PORT}`;
export const PORTS = { api: API_PORT, ui: UI_PORT };
