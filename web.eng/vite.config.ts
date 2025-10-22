import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  // resolve: {  // shared constants
  //   alias: {
  //     '@shared': path.resolve(__dirname, '../shared'),
  //   },
  // },
  base: '/', // also change main.tsx
  build: {
    outDir: 'dist',
    // assetsDir: 'assets',
    // rollupOptions: {
    //   // Copy 404.html to root for GitHub Pages SPA routing
    //   input: {
    //     main: './index.html',
    //     // 404: './public/404.html'
    //   }
    // }
  },

  server: {
    host: '0.0.0.0', // N.B. needed for envoy
    port: 5173,
  },

  // server: {   // proxy API requests to backend server
  //   port: 3000, // your Vite dev server port
  //   proxy: {
  //     '/api': {
  //       target: 'http://localhost:8080', // your backend server
  //       changeOrigin: true,
  //       rewrite: (path) => path.replace(/^\/api/, ''), // optional
  //     },
  //   },
  // },

  // Note: don't alias the package root to a specific file (index.js) because
  // imports like '@reown/appkit/networks' will be resolved to
  // '<alias>/networks' (which breaks). We rely on the package's own exports
  // and avoid pre-bundling these packages via optimizeDeps.exclude below.
  // resolve: {
  //   alias: {
  //     '@reown/appkit/adapters': path.resolve(
  //       __dirname,
  //       'node_modules/@reown/appkit/dist/adapters/index.js'
  //     ),
  //   },
  // },
  // optimizeDeps: {
  //   exclude: [
  //     '@hashgraph/hedera-wallet-connect',
  //     '@reown/appkit',
  //     '@reown/appkit/*'
  //   ]
  // }
})
