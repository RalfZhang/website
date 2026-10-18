import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { routeShells } from "./scripts/route-shells";

export default defineConfig({
  plugins: [react(), routeShells()],
  server: { port: 5173, host: true },
  build: { target: "es2022" },
});
