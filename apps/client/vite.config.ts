import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-router')
          ) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/antd/') || id.includes('node_modules/@ant-design/')) {
            return 'vendor-antd';
          }
          if (id.includes('node_modules/@apollo/') || id.includes('node_modules/graphql/')) {
            return 'vendor-apollo';
          }
          if (
            id.includes('node_modules/mermaid/') ||
            id.includes('node_modules/d3') ||
            id.includes('node_modules/dagre')
          ) {
            return 'vendor-mermaid';
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        ws: true,
        rewrite: path => path.replace(/^\/api/, ''),
      },
    },
  },
});
