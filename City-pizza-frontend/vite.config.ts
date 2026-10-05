import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

// NOTA: TanStack Start SSR (tanstackStart + file-router codegen) se activa
// cuando pegues los archivos Lovable (src/router.tsx + src/start.tsx).
// Base actual en modo SPA para tener dev/build verdes.
export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  server: { port: 5173 },
});
