import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from "fs";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    https: {
       key: fs.readFileSync(path.resolve(__dirname, "../server/certs/key.pem")),
      cert: fs.readFileSync(path.resolve(__dirname, "../server/certs/cert.pem")),
    },
    port: 5173,
  },
})
