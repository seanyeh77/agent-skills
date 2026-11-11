import {defineConfig, type Plugin} from 'vite';
import motionCanvasPlugin from '@motion-canvas/vite-plugin';

// @motion-canvas/vite-plugin 還是 CommonJS 套件，在 ESM 的設定檔裡
// 取到的可能是模組本身而不是函式，所以這裡兩種都接。
const motionCanvas = (motionCanvasPlugin as any).default ?? motionCanvasPlugin;

/**
 * 建置「可以直接開的一頁網頁」用的設定。
 *
 * 官方外掛 motionCanvas() 負責三件事：處理 `?scene` 與 `?project` 這兩種匯入、
 * 產生場景的 .meta 檔，以及把專案包成 Motion Canvas 需要的完整形狀
 * （logger、plugins、settings 都是在這一步補上的，少了它播放會出錯）。
 *
 * 但它同時會把建置的進入點設成 src/project.ts，不會打包我們自己的 index.html，
 * 所以後面再接一個小外掛把進入點改回來。外掛的設定依序合併，後面的會蓋過前面的。
 */
function useOwnIndexHtml(): Plugin {
  return {
    name: 'standalone:index-html',
    config: () => ({
      build: {
        outDir: 'dist',
        emptyOutDir: true,
        assetsDir: 'assets',
        // index.html 是播放頁，render.html 是匯出影片用的頁面
        rollupOptions: {
          input: {index: 'index.html', render: 'render.html'},
          preserveEntrySignatures: false,
        },
      },
    }),
  };
}

export default defineConfig({
  base: './',
  plugins: [motionCanvas(), useOwnIndexHtml()],
});
