# NOV.17 — 13 months of us

Y2K 友情回顧 prototype。以冰藍、粉紅、金屬星芒、拍立得與復古播放器，呈現 **2025/11～2026/11，共 13 張月份卡片**。

## 啟動

```bash
cd /home/jay/code/Nov_17
bash scripts/dev.sh
```

在瀏覽器開啟 **http://localhost:3000**。啟動腳本會優先使用 `.tools/node/` 中附帶的 Linux Node.js，不影響其他專案的 Node 設定。若搬到 Windows 或 macOS，請先安裝 Node.js 22，再執行 `npm ci` 與 `npm run dev`。

## 功能

- 封面與 13 張月份卡片；封面不計入月份數量。
- 支援前後按鈕、方向鍵、手機水平滑動、月份時間軸與月份目錄。
- 2026/01、2026/05、2026/08 為互動選擇題，作答後揭曉答案；返回同一張卡片會保留當次作答。
- 所有卡片共用一個持續存在的 audio 元素，因此切換月份不會重新播放歌曲。
- 點擊「開始我們的回顧」後播放背景音樂，可暫停、播放、靜音與調整音量。
- 最後一張可以重播整段回顧，並清除當次作答。
- 支援 prefers-reduced-motion，降低動態效果。
- 照片、文字、人物、事件與數字全部是示範內容。無須登入、資料庫或 API key。

## 編輯內容

**`data/memories.ts`** 包含所有月份內容、配色、版型及選擇題。

版型有 `collage`、`number`、`postcard`、`quiz`、`finale`。選擇題的 `answer` 從 0 開始計算。

示意照片是九張一組的 AI 圖集，儲存在 `public/photos/friendship-atlas.png`；`tile: 0～8` 決定顯示哪張照片。程式以 CSS 裁切顯示，不改動原始圖檔。

換成自己的照片時，把檔案放進 `public/photos/`，並將對應物件改成：

```ts
{
  src: "/photos/your-photo.jpg",
  alt: "照片的內容描述",
  caption: "照片旁的小字"
  // 使用獨立照片時不設定 tile。
}
```

**背景音樂**：`public/audio/our-little-orbit.wav`。若要換歌，修改 `components/memory-player.tsx` 中的 `<audio src>`，以及播放器顯示的歌曲名稱。

目前音樂〈Our Little Orbit〉是以 `scripts/generate-audio.mjs` 產生的原創器樂示範：112 BPM，約 69 秒，電子鼓、電鋼琴、低音與合成器。沒有使用第三方歌曲或音樂取樣。

圖像生成工具與提示詞記錄於 `public/photos/ASSETS.md`。

## 技術與檢查

Next.js App Router、React、TypeScript、Tailwind CSS、Motion、Lucide 圖示。使用 Next.js static export，`npm run build` 後產出 `out/`，可由一般靜態主機提供。

```bash
npm run typecheck
npm run build
```

若目前終端機尚未設定 Node.js 的 PATH，可以先執行：

```bash
export PATH="$PWD/.tools/node/bin:$PATH"
```

已建置好的版本也可以直接預覽：`npm start`。

瀏覽器測試（需已啟動網站，並安裝 Playwright Chromium）：

```bash
npx playwright install --with-deps chromium
npm run test:e2e
```

測試會驗證 13 個月份、三道選擇題、音樂跨頁不中斷、音量、重播、桌面／手機排版與滑動操作，並將截圖輸出到 `.qa/`。

本 prototype 僅存於本機，尚未部署上線。`robots: noindex` 只避免搜尋索引，並不是存取權限控制。
# NOV.17
