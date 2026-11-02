# NOV.17 — N J Rewind

以音樂串起十個事件的回顧網站。首頁、序章、歡迎頁與統計頁共用進場音樂；統計頁按下繼續後播放轉場，再進入事件回顧。

## 啟動與預覽

使用 Node.js 22 以上版本。此工作目錄可直接執行：

```bash
bash scripts/dev.sh
```

腳本優先使用 `.tools/node/bin` 中的 Linux Node.js。新環境先執行 `npm ci`，並另外還原被 Git 忽略的私人 JSON、照片與音檔。

正式靜態預覽：

```bash
npm run build
npm start
```

`npm run build` 產生 `out/`；`npm start` 使用 `scripts/serve.mjs` 提供靜態站，預設監聽 `127.0.0.1:3000`，可透過 `PORT`、`NOV17_HOSTNAME` 調整。修改程式、JSON 或素材後，正式預覽需要重新建置。

## 頁面流程

```text
/home → /prelude → /intro → /stats → 轉場動畫 → /memo-1 … /memo-10
```

- `/` 導向 `/home`。主頁第一次操作播放音樂，第二次進入序章。
- 序章、歡迎頁與統計頁依序顯示文字；統計數字在瀏覽器即時計算。減少動態偏好會直接顯示內容。
- 十個事件使用獨立網址，可直接開啟與重新整理；舊 `/memo` 會導向 `/memo-1`。
- 除第 5、7 頁外，左側顯示封面、歌曲資訊、播放進度、播放／暫停、事件切換與網站音量，右側逐行彈入回憶文字。
- 第 5、7 頁暫時只有首頁背景色，但仍播放該頁歌曲。點擊空白處、Enter 或向右方向鍵可繼續；向左方向鍵可返回前一事件。
- 其他事件可使用播放器的前後按鈕，或方向鍵／Page Up／Page Down 切換；在進度與音量滑桿上操作方向鍵只調整滑桿。
- 每次進入事件都從 `0:00` 開始，總長度從實際音檔 metadata 取得。歌曲循環播放，最後一個事件可從頭重播。
- 共用同一個原生 audio，網站音量跨事件保留。關閉事件播放器會返回統計頁。

## 編輯事件內容

事件資料放在 `public/memories/memo-1/` 至 `memo-10/`：

```text
public/memories/memo-1/
├── content.json
├── photos/          # 封面圖片
└── audio/           # 此事件的背景音樂
```

每頁各有一份設定。以下為虛構範例，網址與副檔名請依實際素材填寫：

```json
{
  "id": "memo-1",
  "cover": {
    "src": "/memories/memo-1/photos/cover.jpg",
    "alt": "這個事件的專輯封面"
  },
  "song": {
    "title": "歌曲名稱",
    "artist": "演出者 — 專輯名稱",
    "src": "/memories/memo-1/audio/song.mp3"
  },
  "lines": [
    "第一行回憶", "第二行回憶", "第三行回憶", "第四行回憶", "第五行回憶",
    "第六行回憶", "第七行回憶", "第八行回憶", "第九行回憶", "第十行回憶"
  ]
}
```

`cover` 控制左側封面；`song.title`、`song.artist` 控制封面下方的兩行文字；`song.src` 指定音檔；`lines` 是右側依序出現的文字。範本提供十行，也可依內容調整行數。長內容會在右側區域內捲動。

第 5、7 頁也有相同設定與獨立歌曲，目前封面及文字暫不顯示。初始事件素材沿用既有檔案供預覽，請自行替換。原 `public/memories/YYYY-MM/` 月份資料保留，已不作為目前頁面入口。

主頁、序章、歡迎頁與統計頁仍由 `public/homepage/content.json` 設定。事件背景沿用主頁的 `colors.background`，封面不會自動從音檔擷取，必須指定 `cover.src`。

## 音量

音量條控制原生 `audio.volume`，初始為 35%，音量變更會跨頁保留於當前播放器。它不代表系統音量；一般網頁沒有讀寫作業系統音量的標準 API。詳見 [HTML 媒體音量規格](https://html.spec.whatwg.org/multipage/media.html#dom-media-volume)。

`next dev` 的非空白事件頁另保留開發靜音按鈕，偏好儲存於目前瀏覽器；正式版不讀取此開發偏好。空白頁不顯示開發控制，但保留當前靜音狀態。

## 技術與驗證

Next.js App Router、React、TypeScript、Tailwind CSS、Motion、Lucide。採 static export；`[event]` 路由透過 `generateStaticParams` 匯出十個事件。

```bash
npm run typecheck
npm run build
npm run test:e2e
```

瀏覽器測試需要先啟動網站並準備 Playwright Chromium。`NOV17_TEST_URL` 可指定測試站，預設為 `http://127.0.0.1:3000`。全部 Playwright 頁面與 context 固定 **1440 × 1080 CSS 像素**，不執行手機／平板或其他尺寸。

本機已有測試工具時可沿用：

```bash
LD_LIBRARY_PATH="$PWD/.tools/browser-libs/usr/lib/x86_64-linux-gnu" \
PLAYWRIGHT_BROWSERS_PATH="$PWD/.tools/browsers" \
NOV17_TEST_URL=http://127.0.0.1:4173 npm run test:e2e
```

`npm run test:dev-audio` 驗證開發靜音，透過 `NOV17_DEV_TEST_URL` 指定開發站；選填 `NOV17_TEST_URL` 可一併檢查正式版。測試腳本不會自行啟動網站，結果與必要截圖放在 `.qa/`。

## 私人內容

`public/homepage/`、`public/memories/`、其他私人素材、本機資料／環境檔、`private/`、`HANDOFF.md`、`.qa/`、`.tools/`、`.next/`、`out/` 均依 `.gitignore` 排除。`data/memories.ts` 是載入器；公開型別與 `data/events.example.ts` 不應寫入真實回憶。

Git 忽略不會阻止上線訪客讀取展示內容。部署存取控制須另外設定；目前沒有登入、資料庫、上傳或管理後台。
