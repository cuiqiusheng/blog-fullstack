import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
    federation({
      name: 'blog',
      filename: 'remoteEntry.js',
      exposes: {
        './App': './src/BlogRemoteApp.tsx',
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
        'react-router-dom': { singleton: true },
        antd: { singleton: true },
      },
      dts: false,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        // Disable manualChunks in CI to use Rollup's default chunk splitting, reducing memory usage during build
        ...(process.env.CI
          ? {}
          : {
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
              },
            }),
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
