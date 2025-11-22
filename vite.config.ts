import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react()],
    base: './', // Ensures relative paths for flexible deployment
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
    },
    define: {
      // Inject VITE_API_KEY into process.env.API_KEY for the Google GenAI SDK
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || process.env.API_KEY || '')
    }
  };
});