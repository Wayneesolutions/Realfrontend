import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// NOTE: proxy target corrected to port 3001 — that's what src/server.js
// actually listens on (PORT env var, defaulting to 3001 since Phase 0).
// The version Gemini generated assumed port 5000, which doesn't match
// this project and would have made every /api call fail with a connection
// refused error.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
