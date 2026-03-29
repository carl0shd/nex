import { resolve } from 'path';
import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  main: {
    build: {
      watch: {
        include: ['src/native/main/**', 'src/native/ipc/**']
      },
      rollupOptions: {
        input: resolve('src/native/main/index.ts')
      }
    }
  },
  preload: {
    build: {
      watch: {
        include: ['src/native/preload/**']
      },
      rollupOptions: {
        input: resolve('src/native/preload/index.ts')
      }
    }
  },
  renderer: {
    root: resolve('src/web'),
    build: {
      rollupOptions: {
        input: resolve('src/web/index.html')
      }
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, './src/web')
      }
    },
    plugins: [react(), tailwindcss()]
  }
});
