import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    "process.env.TOKEN_API_JWT_KEY": JSON.stringify(process.env.TOKEN_API_JWT_KEY),
  },
}); 