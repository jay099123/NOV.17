# 網站配色修改清單

主頁與每個月份都可以在自己的 `content.json` 直接填 Tailwind 色彩名稱，例如 `yellow-300`，不需要新增全域色票。各頁的設定互相獨立，也可繼續使用 HEX 色碼。

## 直接修改每頁 JSON

在原本的 JSON 物件內編輯 `colors`，其他故事、照片與歌曲欄位保留。例如：

```json
"colors": {
  "background": "yellow-300",
  "photoBackground": "violet-200",
  "text": "gray-900"
}
```

| 欄位 | 用途 |
| --- | --- |
| `background` | 主頁背景、月份主背景與文字區背景；也會套用至使用主色的花形及部分按鈕細節 |
| `photoBackground` | 月份照片區背景；主頁保留此欄位但目前未使用 |
| `text` | 標題與一般文字，以及引用主要文字色的元素 |
| `bodyText` | 選填；內文、小字與提示文字，省略時跟隨 `text` |

`background`、`photoBackground`、`text` 必填。所有顏色欄位（包含 `bodyText`）都接受以下格式：

- Tailwind 色系與深淺，例如 `yellow-300`、`pink-200`、`slate-900`。標準深淺為 `50`、`100`、`200`、`300`、`400`、`500`、`600`、`700`、`800`、`900`、`950`。
- Tailwind 單一色彩名稱，例如 `white`、`black`、`transparent`。
- 帶 `#` 的 3、4、6、8 位 HEX 色碼，例如 `#fff`、`#ffe1ec`；同一頁可混用 Tailwind 名稱與 HEX。

JSON 填 `yellow-300` 即可，不要加 `bg-` 或 `text-` 前綴。`yellow` 缺少深淺、`yellow-350` 不在內建色票、`bg-yellow-300` 是完整 utility class，皆會顯示檔案路徑與欄位名稱的錯誤提示。

色彩名稱使用專案已安裝的 Tailwind 內建色票，與 `bg-yellow-300`、`text-gray-900` 的預設顏色相同。可對照 [Tailwind 官方色票](https://tailwindcss.com/docs/colors)。

目前主頁與 13 個月份原有的 HEX 設定仍可使用，可逐欄改成 Tailwind 名稱。為保留原本畫面，也填了 `bodyText`；若希望標題與內文同色，請刪除該頁的 `bodyText`，或把它改成與 `text` 相同。

## 每一頁的修改位置

下表色碼是本次整理時的值，以各頁 JSON 為準。

| 頁面 | 設定檔 | `background` | `photoBackground` |
| --- | --- | --- | --- |
| 主頁 | [homepage/content.json](public/homepage/content.json) | `#fde047` | `#c1afea` |
| 2025／11 | [2025-11/content.json](public/memories/2025-11/content.json) | `#d2f65a` | `#c1afea` |
| 2025／12 | [2025-12/content.json](public/memories/2025-12/content.json) | `#f6a9cd` | `#dd552e` |
| 2026／01 | [2026-01/content.json](public/memories/2026-01/content.json) | `#bbd9f7` | `#2f4ebd` |
| 2026／02 | [2026-02/content.json](public/memories/2026-02/content.json) | `#ff9b66` | `#c0ce88` |
| 2026／03 | [2026-03/content.json](public/memories/2026-03/content.json) | `#c9b6f0` | `#e4ee9c` |
| 2026／04 | [2026-04/content.json](public/memories/2026-04/content.json) | `#d2f65a` | `#c1afea` |
| 2026／05 | [2026-05/content.json](public/memories/2026-05/content.json) | `#f6a9cd` | `#dd552e` |
| 2026／06 | [2026-06/content.json](public/memories/2026-06/content.json) | `#bbd9f7` | `#2f4ebd` |
| 2026／07 | [2026-07/content.json](public/memories/2026-07/content.json) | `#ff9b66` | `#c0ce88` |
| 2026／08 | [2026-08/content.json](public/memories/2026-08/content.json) | `#c9b6f0` | `#e4ee9c` |
| 2026／09 | [2026-09/content.json](public/memories/2026-09/content.json) | `#f6a9cd` | `#dd552e` |
| 2026／10 | [2026-10/content.json](public/memories/2026-10/content.json) | `#d2f65a` | `#c1afea` |
| 2026／11 | [2026-11/content.json](public/memories/2026-11/content.json) | `#ff9b66` | `#c0ce88` |

## 舊色票與優先順序

`colors` 會覆蓋舊的 `palette`，使用 `colors` 時可移除 `palette`。只填 `colors` 就能自訂配色。

舊資料只填 `palette` 仍可使用 `lime`、`pink`、`blue`、`orange`、`violet`；兩者都省略時使用 `lime` 預設色。若保留 `palette`，它仍需填合法名稱。

[`app/globals.css`](app/globals.css) 中的 `.palette-*` 現在只負責預設色；已填 `colors` 的頁面主要配色以自己的 JSON 為準。

## 仍由 CSS 控制的顏色

所有頁面共用 [`app/globals.css`](app/globals.css)。部分元件仍有固定色碼，可搜尋下表 selector；它們不會全部跟著 `colors.text` 或背景欄位改色。

| 想修改的地方 | 搜尋 selector／變數 |
| --- | --- |
| 照片框、票券底色 | `:root` 裡的 `--paper` |
| 主頁尖角星星 | `.homepage-spark` 固定為純黑 `#000`；輪廓在 `components/memory-player.tsx` 的 `HomepageStar` |
| 歡迎頁播放按鈕 | `.intro-play`（黑色底、圖示使用主頁背景色） |
| 左上角返回按鈕 | `.page-back`、`.page-back:hover`；位置與間距在 `.slide-brand` |
| 歡迎頁年份圖樣 | `.intro-years` 的 `--years-red`、`--years-ink`；頁尾高度在 `.intro-page` 的 `--intro-years-height`，輪廓在 `components/rewind-years.tsx` |
| 底部月份按鈕與選中顏色 | `.month-button`、`.month-button.active`、`.timeline-year`、`.timeline-mark` |
| 底部前後箭頭 | `.slide-nav-arrow`、`.slide-nav-arrow.nav-next` |
| 問答選項與答對／答錯 | `.quiz-option`、`.quiz-option.is-correct`、`.quiz-option.is-wrong` |
| 問答裝飾貼紙 | `.quiz-art-sticker` |
| 收藏／生日信按鈕 | `.moment-button`、`.moment-button.collected` |
| 生日裝飾貼紙 | `.birthday-sticker` |

## 修改後預覽

```bash
bash scripts/dev.sh
```

主頁開啟 http://localhost:3000/home，月份回顧開啟 http://localhost:3000/memo。修改 JSON 後開發伺服器會重新載入；若未更新，可重新整理瀏覽器。

`out/` 是靜態建置輸出，必須成功執行 `npm run build` 後才會更新；修改時可以先使用開發模式預覽。
