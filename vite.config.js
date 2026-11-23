import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default {
  plugins: [react(), tailwindcss()],
  server: { port: 5173, strictPort: true, proxy: { '/api': 'http://localhost:5090' } },
  preview: { port: 5173, strictPort: true },
};
