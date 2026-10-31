# NOV.17 — us, on repeat.

以 Spotify Wrapped 為靈感的月份回顧 sample：滿版投影片、高對比色塊、大字海報、幾何花形、照片拼貼與演唱會票券。

尚未替換的故事、照片、演唱會月份、題目與歌曲為示意；各月可逐步改成自己的內容。私人規劃保存在 Git 忽略的 `HANDOFF.md`。

## 啟動

在 WSL 終端機執行：

```bash
cd /home/jay/code/Nov_17
bash scripts/dev.sh
```

開啟 **http://localhost:3000/home**。根網址 `/` 會自動導向 `/home`；歡迎頁使用 **http://localhost:3000/intro**，月份回顧使用 **http://localhost:3000/memo**。此腳本會使用專案的 Linux Node.js，避免誤用 Windows npm。若終端機已設定 Linux Node.js，也可以直接 `npm run dev`。

新環境請安裝 Node.js 22+、執行 `npm ci`，並還原下文列出的私人內容檔與素材。

## Sample 體驗

- `/home` 主頁僅顯示名稱、生日祝福、照片與兩顆尖角黑星。第一次點擊只播放音樂並留在主頁，第二次才進入 `/intro`；載入期間快速連點也會記住第二次操作。主頁不顯示下一頁圖片按鈕、粉色圓形、音樂提示或月份列。
- `/intro` 歡迎頁沿用主頁配色與黑色星星，三段歡迎文字依序彈入，最後才顯示播放按鈕，點擊後進入 `/memo`；左上角小箭頭可返回 `/home`。底部以紅色斜體數字、黑色描邊、波浪棋盤及弧線呈現 2025–2026，文字與播放鍵已上移以保留空間。減少動態模式直接顯示文字與按鈕。
- `/memo` 顯示月份回顧，可直接開啟或重新整理。每個月份卡片鋪滿瀏覽器視窗，左上角保留星星圖示與 NOV.17，點擊會回到 `/home`。第一個月份 2025/11 的標誌前另有小箭頭，可返回 `/intro`。
- 2025/11～2026/11 共 13 個月份，以卡片內底部的前後按鈕、月份時間軸、方向鍵／Page Up／Page Down 或手機左右滑動切換。選中的月份會高亮；窄螢幕會自動捲動時間軸到選中的月份。
- 四個演唱會示意月份（12、2、6、10 月），搭配可收藏的雙人票券視覺。
- 三道示意問答（1、5、8 月），可查看正解與回憶；允許略過，來回翻頁保留作答。
- 兩個日常互動月份（4、9 月），點擊收藏後播放愛心與花形動畫。
- 最後一個月份有生日信，點擊展開；重播時清除問答、收藏狀態與信件展開狀態。
- 三個網址共用音訊元件與互動狀態：主頁進入歡迎頁時音樂持續播放，進入回顧後切換成月份歌曲；各月份切換時換歌並從頭開始，回到 `/home` 會暫停並重設播放位置，回顧重新從第一個月開始。瀏覽器上一頁／下一頁會同步切換對應畫面。
- 畫面僅保留回顧內容、左上角識別與卡片內導覽，歌名、播放器、選單、月份目錄、頁尾與額外進度列已移除。
- 手機與桌面都固定為一個視窗高度，長題目或生日信可在內容區內捲動；支援減少動態效果偏好。

## 私人內容與 Git

| 位置 | 用途 |
| --- | --- |
| `public/homepage/` | 主頁／歡迎頁文字、透明去背合照、主頁音源及修改說明 |
| `public/memories/YYYY-MM/` | 每個月份的內容、照片與歌曲，全放在同一個月份資料夾 |
| `data/*.local.*`、`data/private/` | 其他本機資料 |
| `public/photos/`、`public/audio/` | 原本示意素材與產生器輸出，現行月份從各月資料夾載入 |
| `public/private/` | 其他供網站讀取的私人素材 |
| `private/` | 個人筆記、原檔與舊版備份 |
| `HANDOFF.md` | 私人需求與交接筆記 |

這些位置，以及 `.next/`、`out/`、`.qa/` 都已被 `.gitignore` 排除。設定時沒有私人檔案被 Git 追蹤。忽略規則不會清除既有 Git 歷史，也不會阻止網站訪客取得上線後的展示內容；部署的存取權限另行決定。

`data/memories.ts` 是可提交的載入器，讀取主頁和各月份的 JSON，裡面沒有私人回憶文字。`data/memories.example.ts` 是公開用的**虛構範本**，`data/memory-types.ts` 是共用型別。真實內容只填在被忽略的 `public/homepage/`、`public/memories/` 裡，不要寫入載入器、範本、React 元件、公開 README 或測試。

新環境先從私人備份還原 `public/homepage/` 與 `public/memories/`，再啟動或建置。Git 不會包含這些 JSON 與素材；請另外保存備份。

### 主頁要改哪裡

```text
public/homepage/
├── content.json              # 名稱、生日祝福、按鈕、圖片與音源設定
├── photos/couple-cutout.png  # 實際顯示的透明去背合照
├── audio/intro.wav           # 主頁音樂
├── README.md                 # 詳細修改範例
└── ASSETS.md                 # 示意去背圖的來源與提示詞
```

修改 `content.json` 的 `name`、`greeting` 可換主頁文字；`intro.lines` 設定歡迎頁依序出場的三段文字，`intro.playLabel` 是歡迎頁播放按鈕的無障礙名稱。舊 `startText`、`startIcon`、`musicHint`、`musicPlayingText` 欄位目前不顯示。`photo.src` 與 `song.src` 分別指定照片和歌曲。主頁與歡迎頁共用音源，各月份歌曲可獨立替換。主頁的 `colors` 同時控制歡迎頁配色，可直接填 Tailwind 名稱或 HEX，設定方法與月份相同。

主頁照片使用**已去背且有透明背景**的 PNG 或 WebP；換成自己的去背圖片後更新 `photo.src`、`photo.alt`。目前載入本機的透明去背合照，原始照片另行保留。網站不會自動替新照片去背；JPG 改副檔名也不會產生透明背景。

舊的 `public/memories/cover/` 僅保留歷史素材，已不再控制主頁。

### 每個月份要改哪裡

已建立 **2025-11 至 2026-11，共 13 個月份資料夾**，每一個的結構相同：

```text
public/memories/
├── 2025-11/
│   ├── content.json     # 主題、標題、內文、照片／歌曲資訊、題目
│   ├── photos/          # 本月照片
│   ├── audio/           # 本月歌曲
│   └── README.md        # 本月的修改範例
├── 2025-12/
├── 2026-01/
│   ...
└── 2026-11/
```

例如修改 2025 年 11 月，就編輯 `public/memories/2025-11/content.json`，將該月的照片放到同目錄的 `photos/`，歌曲放到 `audio/`。

完整索引與逐月範例在本機的 `public/memories/README.md` 及各月份的 `README.md`。

- `label`、`title`、`body`、`note` 是月份的回憶主題與文字。
- `title` 保持兩段文字；JSON 文字換行使用 `\n`。JSON 不接受註解與尾端逗號。
- `kind` 可為 `story`、`concert`、`quiz`、`little-things`、`birthday`。
- `colors` 直接填本頁的 `background`、`photoBackground`、`text`，可用 Tailwind 名稱（如 `yellow-300`、`violet-200`、`gray-900`，不加 `bg-`／`text-`）或 HEX 色碼；可另外設定 `bodyText`，省略時跟隨 `text`。舊的五組 `palette` 仍可作為預設值，`colors` 優先。完整範例見 [color_setting.md](color_setting.md)。
- `photos` 每一筆對應一張獨立照片，只設定 `src`、`alt`、`caption`。目前版型主要使用陣列的前一至兩張；照片會按原比例完整顯示，說明文字放在照片區外。
- `song` 設定歌曲的 `src`、`title`、`artist`；每月有自己的音檔，目前依前次需求不顯示歌名。
- `quiz.answer` 從 0 開始；`interaction` 設定收藏按鈕與揭曉文字，`letter` 設定生日信。

新增照片或歌曲後，也要在 `content.json` 更新對應 `src`，例如 `/memories/2025-11/photos/photo-01.jpg`、`/memories/2025-11/audio/song.mp3`。網址不含 `public/`，音檔請保留真正的副檔名。改 JSON 後開發伺服器會重新載入，替換音訊或照片後可重新整理瀏覽器。

各月份 `photos/` 裡現在都是單張照片。未替換的示意照片已由原圖集拆成獨立的 `photo-01.png`、`photo-02.png` 等檔案；改一個月份不會改到別月。網站已移除九宮格裁切功能，不再需要 `tile`。原始圖集僅保留在舊素材與私人備份中，不再由月份卡片載入。

每月音樂目前放在各自的 `audio/sample.wav`，都是程式合成原創。舊的音樂產生器仍可執行：

```bash
node scripts/generate-sample-audio.mjs
```

產生器只會寫入舊的 `public/audio/sample/track-*.wav`，不會覆寫各月份資料夾內的歌曲。

## 技術與驗證

Next.js App Router、React、TypeScript、Tailwind CSS、Motion、Lucide。使用 static export，`npm run build` 產生 `out/`，`npm start` 提供正式版靜態預覽，預設僅監聽本機 `127.0.0.1`；支援直接開啟 `/home`、`/intro`、`/memo`。

```bash
npm run typecheck
npm run build
```

瀏覽器檢查需先啟動網站並準備 Playwright Chromium：

```bash
npx playwright install --with-deps chromium
npm run test:e2e
```

依使用者偏好，後續瀏覽器測試只使用 **桌面 1440 × 1080 CSS 像素**，所有 Playwright 頁面與 context 均固定此尺寸，不執行手機／平板模擬或多尺寸矩陣。一般／減少動態偏好也沿用同一尺寸。

測試先比對 `/home`、`/intro`、`/memo` 的 SSR 與 hydration 後畫面並捕捉 hydration 警告；再檢查主頁兩次點擊、歡迎頁播放鍵、返回按鈕、13 個月份與不同歌曲、照片載入、問答、收藏、生日信、重播、鍵盤、視窗鋪滿與卡片內月份高亮。截圖與結果寫入被忽略的 `.qa/`。

功能版本已通過型別檢查與正式建置，`out/` 已更新。最新瀏覽器結果見 `.qa/browser-validation.json`；改用桌面單一尺寸前的六種尺寸報告與較早的配色驗證保留作歷史紀錄。詳細狀態請查看本機 `HANDOFF.md` 的最新紀錄。
