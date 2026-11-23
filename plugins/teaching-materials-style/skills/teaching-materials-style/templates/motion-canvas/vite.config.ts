import {defineConfig} from 'vite';
import motionCanvasPlugin from '@motion-canvas/vite-plugin';

// @motion-canvas/vite-plugin 還是 CommonJS 套件，在 ESM 的設定檔裡
// 取到的可能是模組本身而不是函式，所以這裡兩種都接。
const motionCanvas = (motionCanvasPlugin as any).default ?? motionCanvasPlugin;

/**
 * motionCanvas() 讓 `import scene from './scenes/x?scene'` 可以運作。
 * base 設成相對路徑，建置後的檔案放到任何子目錄都能開。
 */
export default defineConfig({
  base: './',
  plugins: [motionCanvas()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {input: 'index.html'},
  },
});
