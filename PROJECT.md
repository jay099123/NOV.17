# NOV.17 專案架構與設計決策

本文件只記錄現行架構、長期技術決策、元件責任與設計限制。進度及問題見 [HANDOFF.md](HANDOFF.md)，啟動與編輯操作見 [README.md](README.md)，協作規範以 [AGENTS.md](AGENTS.md) 為準；程式碼優先於文件。

## 技術與執行模式

- 使用 Next.js App Router、React、TypeScript、Tailwind CSS、Motion、Lucide 與本機字型套件 Noto Sans TC Variable。Node.js 要求 22 以上，確切套件版本以 `package.json`、`package-lock.json` 為準。
- `next.config.ts` 設定 `output: "export"`、`images.unoptimized: true`。`npm run build` 使用 Webpack 產生 `out/`，執行網站不依賴 Next.js 伺服器、資料庫或後端 API。
- `npm start` 執行 `scripts/serve.mjs`，預設監聽 `127.0.0.1:3000`；支援無副檔名網址、媒體 MIME 與 HTTP Range，可由 `PORT`、`NOV17_HOSTNAME` 調整。
- JSON 在建置時匯入。正式站的程式、設定或素材變更都需要重新建置；單純新增檔案不會自動取代 JSON 指定的素材。

## 路由與共享生命週期

```text
/ → /home → /prelude → /intro → /stats → 轉場動畫 → /memo-1 … /memo-10
/memo → /memo-1（舊入口相容導向）
```

- `app/page.tsx` 在客戶端以 `router.replace` 導向 `/home`，另保留可點擊的連結。`app/(experience)/memo/page.tsx` 則將舊 `/memo` 導向第一個事件。
- `app/(experience)/[event]/page.tsx` 由 `events` 配合 `generateStaticParams` 匯出十個事件，`dynamicParams = false`。事件使用獨立網址，支援直接開啟、重新整理及瀏覽器上一頁／下一頁。
- 所有體驗路由共用 `app/(experience)/layout.tsx`，持續掛載 `MemoryPlayer`。畫面由 `usePathname()` 選擇，各事件及進場頁的 `page.tsx` 不另外渲染內容。
- 事件索引由網址比對 `events` 得出；不再以單一 `/memo` 網址下的月份 React 索引表示目前頁面。
- 主頁第一次操作播放音樂，第二次進入序章；載入中的第二次操作會排隊，播放失敗則留在主頁並允許重試。
- 序章與歡迎頁共用 `Intro`，按鈕依序前往歡迎頁、統計頁。統計頁按下繼續後播放約 2.4 秒的轉場，完成才前往第一個事件；轉場不是獨立路由。離開統計頁時會取消尚未完成的轉場計時器。
- 返回使用明確目的地：序章回主頁、歡迎頁回序章、統計頁回歡迎頁；一般事件的關閉按鈕回統計頁，不以 `router.back()` 推測目的地。

## 主要元件與檔案責任

| 位置 | 職責 |
| --- | --- |
| `app/layout.tsx` | 全域 CSS、`zh-Hant`、metadata、robots noindex／nofollow |
| `app/(experience)/layout.tsx` | 保留共用播放器與音訊的生命週期 |
| `components/memory-player.tsx`：`MemoryPlayer` | 路由判斷、事件導覽、空白版型分支、單一 audio、播放／進度／音量狀態、鍵盤與觸控、開發靜音 |
| 同檔：`Cover`、`Intro`、`HomepageStar` | 主頁兩次操作流程、序章／歡迎頁、共用星星圖樣 |
| `components/relationship-stats.tsx` | 即時統計數字、三行文字彈入、繼續按鈕與事件回顧前的轉場 |
| `components/event-player.tsx` | 左側封面與歌曲資訊、進度／音量滑桿、播放與事件切換按鈕、右側逐行文字；透過 props 與回呼操作共用 audio |
| `components/rewind-years.tsx` | 序章與歡迎頁共用的 2025–2026 SVG 圖樣 |
| `app/globals.css` | 進場頁、統計、事件版型、字級、色彩、動畫與減少動態樣式 |
| `data/memories.ts` | 主頁與事件 JSON 載入器，匯出 `project`、`events`；配色、統計與事件資料驗證 |
| `data/memory-types.ts` | `Homepage`、`StatsContent`、`EventMemory`、照片與歌曲等共用型別 |
| `data/events.example.ts` | 公開的虛構事件範本，不是正式資料入口 |
| `scripts/load-memory-data.mjs` | 讓 Node 驗證共用網站的 TS／JSON 入口 |
| `scripts/dev.sh`、`scripts/serve.mjs` | Linux Node 開發啟動與正式靜態預覽 |

## 音訊與狀態

- 全站只有一個持續掛載的原生 `<audio>`，以 `loop` 循環播放。`EventPlayer` 不建立自己的 audio，也不自動切換至下一事件。
- 主頁、序章、歡迎頁、統計頁及轉場共用主頁歌曲，這些頁面間不重新載入同一音源。進入事件後改用該事件的 `song.src`。
- 音源 effect 依賴 `song.src` 與 `eventId`，換事件一定重設播放進度及時長狀態並執行 `audio.load()`；即使兩個事件使用相同音檔網址，也會從頭開始。重新整理或返回某個事件不續播先前位置。
- 總長度由 `loadedmetadata`／`durationchange` 的實際 `audio.duration` 取得，播放位置由 `timeupdate` 更新；沒有在 JSON 寫死時長。介面顯示經過及剩餘時間，進度滑桿可尋位。
- metadata 未就緒或音訊無效時，時長為 0、進度滑桿停用。一般事件頁可顯示錯誤訊息並用播放鍵重試，亦可切換事件。
- 直接進入事件會嘗試播放，但仍受瀏覽器自動播放政策限制；未能播放時可使用播放鍵啟動。返回主頁會暫停並歸零音樂。
- 網站音量初始為 `0.35`；滑桿操作 `audio.volume`，靜音操作 `audio.muted`，由原生 `volumechange` 回寫 UI。音量與靜音跨體驗路由保留在當前播放器內，正式版不跨重新整理儲存。
- 音量條不代表系統音量。一般網頁沒有可讀寫作業系統音量的標準 API；不宣稱可取得系統音量百分比，也不為此要求額外權限。
- `NODE_ENV === "development"` 時，一般事件頁另有開發靜音按鈕；開發靜音使用 `nov17:dev-audio-muted` 儲存偏好，初始化在播放前恢復。正式版不讀取此偏好；儲存不可用時仍可在當前播放器切換靜音。
- 問答、收藏與生日信不屬於現行事件播放器；不要將舊月份的互動狀態描述為目前功能。

## 資料入口與約束

- 進場與統計設定為 `public/homepage/content.json`：`name`、`greeting`、`photo`、`song`、`prelude`、`intro`、`stats`、配色。序章／歡迎文字未設定時有元件預設值；舊 `startText`、`startIcon`、`musicHint`、`musicPlayingText` 不控制目前畫面。
- `stats.since` 必須是含明確時區的可解析 ISO 日期，`stats.lines` 恰有三段字串，並提供非空白 `playLabel`。元件在瀏覽器以目前時間減去起點計算秒數，每秒更新，以 `{seconds}` 代入文字。
- 統計數字每三位分組，逗號後保留一個半形空格；數字／符號與相鄰文字以單一空格分隔。即時數字更新不重播文字動畫；初始 SSR 使用佔位符避免時間差造成 hydration 不一致。
- 事件設定為 `public/memories/memo-N/content.json`，素材位於各事件的 `photos/`、`audio/`。`src` 使用網站路徑，不含 `public/`，副檔名須符合檔案格式。

| 事件欄位 | 畫面用途 |
| --- | --- |
| `id` | 對應網址與資料夾 `memo-N` |
| `cover.src`、`cover.alt` | 左側獨立封面圖片與替代文字，不從音檔自動擷取封面 |
| `song.src` | 該事件背景音樂 |
| `song.title`、`song.artist` | 封面下方的兩行文字 |
| `lines` | 右側逐行呈現的字串陣列 |

- 載入器明確匯入十份事件 JSON，檢查順序對應的 `id`、封面／歌曲欄位及文字陣列；不自動掃描新資料夾，也不是所有素材格式的完整驗證器。擴充事件數量須同步修改匯入與陣列；回顧入口目前明確指向 `/memo-1`。
- 執行期 `lines` 可有不同數量，動畫延遲依陣列位置計算。空白版型由 `MemoryPlayer` 的 `isBlank` 索引判斷，目前沒有 JSON 的 `layout`／`blank` 欄位。
- 舊月份資料夾、`data/memories.example.ts`、部分舊型別與 CSS 仍保留，但不作為現行事件畫面或資料載入入口。不要根據這些保留檔案恢復月份票根、月份列或問答版型。

## 視覺與導覽限制

- 事件採 Apple Music 全螢幕播放器的左右分欄：左側方形封面與控制、右側回憶文字。背景統一沿用主頁配色；右側文字彈入後保持完整不透明，不做歌詞淡化或依歌曲時間高亮。
- 一般事件的前後按鈕切換事件；第一頁上一事件停用，最後一頁可從第一個事件重播。方向鍵／Page Up／Page Down 也可切換；焦點位於滑桿或輸入元件時，不攔截方向鍵切換事件。保留觸控滑動處理，測試範圍仍依 AGENTS.md。
- 空白版型保留背景及該事件音樂，不顯示播放器、文字、關閉鍵或開發控制。全頁透明按鈕供點擊或聚焦後 Enter 前進，鍵盤仍可往返事件。
- 主頁去背照片使用 `contain`；事件封面使用 `cover` 填滿方形。字級、尺寸及間距由 CSS 控制，保留使用者已個人化的首頁縮放與位移。
- 主頁、序章、歡迎頁與統計頁保留星星裝飾；年份圖樣只出現在序章、歡迎頁，事件頁及統計頁不顯示年份圖樣。
- 序章、歡迎、統計與事件文字共用 `intro-pop-in` 動畫，每段間隔 0.8 秒、單段約 0.48 秒。統計與進場頁的繼續按鈕在文字之後出現；事件播放控制不必等十行文字播完才可操作。
- 全站以 `100dvh` 呈現，不自動呼叫 Fullscreen API；長事件文字可在右側區域內捲動。減少動態偏好會直接顯示文字並略過統計離場轉場。
- `colors` 若有提供，載入器仍要求 `background`、`photoBackground`、`text`，`bodyText` 選填；部分欄位不參與新事件版型。色值接受 Tailwind 名稱及 3／4／6／8 位 HEX，經 CSS 變數傳遞；相容原有五種 `palette` 預設。

## 私人內容與驗證邊界

- 真實內容保留在被 Git 忽略的主頁／事件內容目錄，不寫入公開元件、載入器、範本或測試。新環境須另外還原 JSON 與素材，僅 Git checkout 不足以建置完整網站。
- 私人目錄、環境檔、`HANDOFF.md`、`.qa/`、`.tools/`、`.next/`、`out/` 等依 `.gitignore` 排除。`public/` 與建置展示內容仍可被訪客取得，Git 忽略及 noindex 不提供存取控制；目前沒有登入、上傳或管理後台。
- `npm run typecheck` 檢查型別；`npm run build` 驗證建置及靜態匯出；`npm run test:e2e` 驗證進場流程、路由、播放器與文字動畫；`npm run test:dev-audio` 驗證開發靜音及選填的正式版隔離行為。
- 瀏覽器腳本不啟動網站；網址／環境變數與操作見 README。所有 Playwright 頁面、context 與截圖只使用 **1440 × 1080 CSS 像素**，一般及減少動態偏好均相同，不推論其他尺寸或實體裝置已驗證。
- 最新通過／失敗狀態及 QA 證據只記錄在 HANDOFF.md，不在本文件累積開發紀錄。
