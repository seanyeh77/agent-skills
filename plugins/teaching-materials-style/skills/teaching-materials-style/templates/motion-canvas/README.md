# Motion Canvas 動畫模板

做「會動的機制圖」用的模板：物件沿著線移動、服務閃一下、方塊長出來，按一下播一段。
裡面有三個 Slurm 場景，是可以直接改來用的範例。同一份動畫可以產出三種東西：

| 產出 | 怎麼做 |
|---|---|
| 獨立網頁 | `npm run build`，`dist/` 整個資料夾發佈成 artifact 或放到任何靜態網站 |
| 嵌進 Slidev | 把 `dist/` 複製到 deck 的 `public/motion/`，用 `../slidev/MotionCanvas.vue` 元件播放 |
| MP4 影片 | `npm run build` 後用 `../../scripts/render_motion.py` 輸出 |

| 場景 | 內容 | 難度 |
|---|---|---|
| `clusterFlow` | 完整的 cluster：job 從 Login Node 送出，經 slurmctld 排程、派到兩台 compute node 執行、寫出輸出，最後由 slurmdbd 記帳，共六步 | 綜合：投影片座標 + 縮放置中、元件工廠、卡片沿路徑移動 |
| `jobFlow` | 同一個流程的精簡版，四個角色一列排開 | 基本：JSX 畫面、`yield*`、`step()` |
| `backfill` | 大 job 等資源時，小 job 插進空檔，利用率從 50 % 升到 83 % | 進階：訊號驅動版面、反應式文字、交錯動畫、時間游標 |

三個場景寫在同一個專案裡，播放時會依序接著播。

## 執行

```bash
npm install
npm start        # 開啟 Motion Canvas 編輯器，預設在 http://localhost:9000
npm run build    # 建置成一頁可以直接開的網頁，輸出在 dist/
npm run preview  # 在 http://localhost:4174/ 開啟建置結果
```

建置後先檢查，再發佈或輸出影片（需要 Python 的 Playwright 與 Chromium，影片另外需要 ffmpeg）：

```bash
python3 ../../scripts/check_motion.py http://localhost:4174/ --scene jobFlow --shots shots/
python3 ../../scripts/render_motion.py http://localhost:4174/render.html jobFlow.mp4 --scene jobFlow
```

`check_motion.py` 一段一段播到底，每段截一張圖，並檢查文字有沒有超出畫布、超出方塊、
互相重疊或小於 24 px，以及 console 有沒有錯誤；有問題就以 1 結束。
`render_motion.py` 輸出 1920 x 1080、60 fps 的 H.264 影片，結尾多停 2 秒。

## 網址參數

| 參數 | 作用 |
|---|---|
| `scene=jobFlow` | 只播這個場景；不給就依序播全部場景 |
| `embed=1` | 嵌入模式：沒有按鈕列、不畫圖下方的字幕，由外層用 postMessage 控制 |

嵌入模式的訊息：外層送 `{type: 'motion:goto', index: k}`，頁面回 `{type: 'motion:info', stage, count}`。
第 0 段是開場畫完、停在第一個 `step()`；第 k 段是第 k 個 `step()` 之後那段動畫播完。
往下一段會播動畫，往回或跳段則直接顯示那一段的結果。

編輯器適合製作，可以拖時間軸、即時看到修改結果。`npm run build` 出來的 `dist/`
沒有編輯器介面，只有播放用的畫面與按鈕，適合上課或交付。

## 檔案

| 檔案 | 內容 |
|---|---|
| `src/theme.ts` | 顏色、字級、機器尺寸與座標計算。要改外觀先改這裡 |
| `src/components/parts.tsx` | 可重複使用的零件：文字、方塊、一台機器 |
| `src/components/motion.tsx` | 動作語彙：沿路徑移動、trail、彈出、閃一下。見下面「怎麼讓動畫絲滑」 |
| `src/scenes/clusterFlow.tsx` | 完整版流程圖：六個步驟，照投影片的座標寫 |
| `src/scenes/jobFlow.tsx` | 精簡版流程：版面、畫面、每一段的動作 |
| `src/scenes/backfill.tsx` | 排程與 backfill |
| `src/components/schedule.tsx` | 排程圖的零件：時間軸、node 列、用訊號定位的 job 方塊 |
| `src/project.ts` | 把場景組成一個專案，編輯器與建置都從這裡進入 |
| `src/embed.ts` | 建置版的播放控制：鍵盤、按鈕、段落計數、嵌入模式 |
| `src/render.ts`、`render.html` | 匯出影片用的頁面，給 `render_motion.py` 打開 |
| `src/audit.ts` | 版面檢查，給 `check_motion.py` 呼叫 |
| | 注意 `embed.ts` 匯入的是 `./project?project`：這個後綴會讓外掛用 `bootstrap()` 把專案補成完整的形狀。直接匯入 `./project` 會少掉 `logger` 等東西，動畫播到一半按下一步就會整個停住 |
| `vite.config.ts` | 編輯器用的設定 |
| `vite.standalone.config.ts` | 建置單頁網頁用的設定 |

## Motion Canvas 的三個重點

1. 畫面用 JSX 組出來，`view.add()` 之後就在畫布上。要播動畫的節點先用
   `createRef()` 建立參考，之後用 `ref()` 取得節點。
2. 動畫用 `yield*` 一步一步播。`all()` 讓多個動作同時進行，`chain()` 讓它們依序進行。
   `ref().opacity(1, 0.4)` 的意思是「把透明度在 0.4 秒內變成 1」。
3. `step('name')`（`motion.tsx`，包著 `beginSlide`）會在播放時停下來等按鍵，
   一個 `step` 就是一個段落，一段只放一件事。影片裡不會停，所以 `step()` 在影片模式
   先停 1.5 秒再往下。場景裡一律用 `step()`，不要直接寫 `beginSlide()`。

## backfill 場景用到的寫法

1. 版面由訊號算出來。`JobBar` 的 x、y、width、height 都是函式，來源是開始時間、
   長度與佔用的 node。所以「把 job 拉長到 3 小時」就是 `yield* bar.duration(3, 1)`，
   不需要自己算 px。
2. 反應式文字。利用率那一行的 `text` 是函式，綁著 `usedNodeHours` 這個訊號，
   訊號一變文字就跟著變，不用手動改字串。
3. 交錯動畫。`all()` 裡面用 `delay(0.2, ...)` 讓某個動作晚一點開始，
   比一個個 `yield*` 更好控制節奏。
4. 時間游標。一條線的 `points` 綁在 `cursorHour` 上，再用 `linear` 掃過整段時間。

## 三個踩過的坑

1. `embed.ts` 匯入的是 `./project?project`。少了這個後綴，專案不會經過 `bootstrap()`，
   `logger` 之類的東西是空的，動畫播到一半按下一步就會整個停住。
2. 自訂元件裡 `{...rest}` 要寫在 `ref` 前面。Motion Canvas 的 JSX 會把 `ref` 一起
   放進 props，所以 `rest` 裡有一個值是 `undefined` 的 `ref`，寫在後面會把真正的 ref 蓋掉。
3. `map()` 的每一項用 `<Node>` 包起來，不要用 `<>`。fragment 在陣列裡會變成巢狀陣列，
   有時候不會被加進畫面（時間軸的刻度就是這樣整排消失的）。

另外 `embed.ts` 有一行把 Motion Canvas 的 logger 接到 console。
場景出錯時預設只有編輯器看得到，接上去之後在瀏覽器的 console 就能看到原因。

## 操作

| 按鍵 | 動作 |
|---|---|
| 方向鍵右、空白鍵、Enter | 下一段；動畫還在播就先播完 |
| 方向鍵左、Backspace | 上一段 |
| R | 重播這一段 |
| F | 全螢幕 |

## 改成別的動畫

- 換內容：改 `src/scenes/jobFlow.tsx` 裡 `NodeBox` 的 `title` 與 `services`；
  `clusterFlow` 則是改最上面那幾個 `machine(...)` 與 `computeNodes` 的座標。
- 換機器數量：改 `COLUMN_X`，間距保持 500 px 左右，箭頭的標籤才不會壓到機器。
- 換顏色或字級：改 `src/theme.ts`，場景裡沒有寫死的色碼。
- 加一段動畫：在場景最後加一個 `yield* step('名稱')`，後面接要播的動作。
- 加一個場景：在 `src/scenes/` 新增 `名稱.tsx`，再加進 `src/project.ts` 的 `scenes`。

## 版面規則

- 圖上的文字一律英文；中文說明只放在圖下方的字幕（嵌進 Slidev 時不畫，改放 note 欄）。
- 直角方塊、2 px 外框、線條 `#333333`。
- 線不會從文字後面穿過去：機器之間留 200 px，箭頭標籤放在通道上方。
- 四台機器高度相同，最下面一排留給移動中的 job，服務方塊不會被蓋住。

## 怎麼讓動畫「絲滑」

這四條是整份專案的動作規則，`src/components/motion.tsx` 就是它們的實作：

1. **移動由一個訊號驅動**。卡片的位置寫成 `position(() => pointOnPath(path, progress()))`，
   整段只有 `progress` 從 0 補到 1 這一個補間（easeInOutCubic），轉角不會停。
   不要把一段路拆成好幾個 `position.x()` 接力。
2. **移動時留 trail**。同一條路徑畫一條深綠的線，`end` 也綁在 `progress` 上，
   線頭永遠跟著卡片，到站再淡掉。視線會被帶著走。
3. **抵達要 flash**。`fill(亮色, 0.25).to(原色, 0.35)`，亮的短、回色的長，
   看起來是一個脈衝，動作才有收尾。
4. **一個 step 只寫一個 `all()`**。段落裡的每件事用 `delay()` 錯開起點，
   而不是一個 `yield*` 接一個 —— 後者每句之間都會停半秒，看起來就是一格一格的。
   字幕也一樣：淡出時往下移、換字後再往回淡入，中間不留靜止的空檔。

| 函式 | 用途 |
| --- | --- |
| `addToken(layer, text, at)` | 生一張移動用的卡片（scale 先是 0） |
| `travel(token, path, 秒, {layer})` | 沿折線走一趟，可帶 trail |
| `popIn` / `vanish` | 彈出 / 收掉並移除節點 |
| `flash(rect, 回到的顏色)` | 閃一下再回色 |
| `step(name, hold)` | 段落分界；播放頁停下來等按鍵，影片停 hold 秒 |
| `pointOnPath(points, t)` | 折線上走了 t 成的位置（按長度分配，速度才均勻） |

卡片要畫在 trail 之上，所以場景裡放兩個空的 `<Node>`：先 `trailLayer`、後 `tokenLayer`。
