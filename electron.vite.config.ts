import { resolve } from 'path';
import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  main: {
    resolve: {
      alias: {
        '@native': resolve(__dirname, './src/native')
      }
    },
    build: {
      watch: {
        include: [
          'src/native/main/**',
          'src/native/ipc/**',
          'src/native/db/**',
          'src/native/cli/**',
          'src/native/pty/**',
          'src/native/git/**',
          'src/native/agents/**',
          'src/native/protocol/**'
        ]
      },
      rollupOptions: {
        input: resolve('src/native/main/index.ts')
      }
    }
  },
  preload: {
    resolve: {
      alias: {
        '@native': resolve(__dirname, './src/native')
      }
    },
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
        '@': resolve(__dirname, './src/web'),
        '@native': resolve(__dirname, './src/native')
      }
    },
    plugins: [react(), tailwindcss()]
  }
});
