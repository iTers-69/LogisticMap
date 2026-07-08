import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");

    return {
        plugins: [react()],
        base: env.VITE_BASE || "/",
        build: {
            outDir: "dist",
            sourcemap: false,
            chunkSizeWarningLimit: 800
        },
        preview: {
            port: 4173,
            strictPort: false
        },
        server: {
            proxy: {
                "/nominatim": {
                    target: "https://nominatim.openstreetmap.org",
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/nominatim/, "")
                }
            }
        }
    };
});
