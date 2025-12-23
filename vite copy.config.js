import path from "path";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";

const SRC_DIR = path.resolve(__dirname, "./src");
const PUBLIC_DIR = path.resolve(__dirname, "./public");
const BUILD_DIR = path.resolve(__dirname, "./www");

const CDN = "https://ids.ezs.vn/AppCoreV2/";
const CDN_ASSETS_JS = `${CDN}assets/js/`;

const isProd = process.env.NODE_ENV === "production";

const plugins = [
  react(),
  {
    name: "absolute-chunk-imports",
    apply: "build",
    renderChunk(code, chunk) {
      if (!isProd || chunk.fileName !== "assets/js/index.js") {
        return null;
      }
      const importCall = /import\((["'])\.\/([A-Za-z0-9_.-]+\.js)\1\)/g;
      const importFrom = /from\s+(["'])\.\/([A-Za-z0-9_.-]+\.js)\1/g;
      let nextCode = code.replace(
        importCall,
        (_match, _quote, file) => `import("${CDN_ASSETS_JS}${file}")`
      );
      nextCode = nextCode.replace(
        importFrom,
        (_match, _quote, file) => `from "${CDN_ASSETS_JS}${file}"`
      );
      return nextCode === code ? null : { code: nextCode, map: null };
    },
  },
];
if (process.env.ANALYZE) {
  plugins.push(
    visualizer({
      filename: "stats.html",
      template: "treemap", // hoặc sunburst/network
      gzipSize: true,
      brotliSize: true,
    })
  );
}

export default {
  plugins,
  root: SRC_DIR,
  base: isProd ? CDN : "",
  publicDir: PUBLIC_DIR,
  build: {
    outDir: BUILD_DIR,
    emptyOutDir: true,
    target: "es2015", // để chạy trên iOS 10+
    cssCodeSplit: false, // gom css thành 1 file
    chunkSizeWarningLimit: 5000,
    rollupOptions: {
      output: {
        format: "es",
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return "vendor";
          }
          if (id.includes("/pages/") || id.includes("\\pages\\")) {
            return "pages";
          }
        },
        entryFileNames: "assets/js/index.js",
        chunkFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          if (/\.css$/.test(assetInfo.name)) {
            return "assets/css/index.css";
          }
          return "assets/[name][extname]";
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": SRC_DIR,
    },
  },
  server: {
    host: true,
    port: 5001,
  },
};
