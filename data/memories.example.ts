// Public sample: all memories, concert placements, photos and songs are fictional.
// Put personal content only in the Git-ignored public/memories/YYYY-MM/content.json.
// This is a public example; data/memories.ts is now the JSON loader, not an editing target.
import type { Homepage, Memory, Photo, Song } from "./memory-types";

export const project = {
  name: "NOV.17",
  greeting: "HAPPY BIRTHDAY!!!",
  startText: "播放我們的這一年",
  intro: { lines: ["歡迎來到 OUR REWIND", "準備好了嗎", "一起開始吧"], playLabel: "開始回顧" },
  musicHint: "點一下合照，播放生日歌",
  musicPlayingText: "生日歌播放中 · 再點一下暫停",
  colors: { background: "yellow-300", photoBackground: "violet-200", text: "gray-900", bodyText: "gray-700" },
  photo: { src: "/homepage/photos/couple-cutout.png", alt: "示意情侶的透明去背合照" },
  song: { src: "/homepage/audio/intro.wav", title: "Birthday Intro", artist: "NOV.17 · 原創示範音樂" },
  isSample: true,
} satisfies Homepage;
const photo = (index: number, caption: string): Photo => ({ src: `/photos/sample-${String(index + 1).padStart(2, "0")}.png`, caption, alt: `虛構情侶的回憶示意照片：${caption}` });
const song = (number: number, title: string): Song => ({ src: `/audio/sample/track-${String(number).padStart(2, "0")}.wav`, title, artist: "NOV.17 · 原創示範音樂" });

export const memories: Memory[] = [
  {
    id: "2025-11", year: 2025, month: "11", english: "NOV", label: "故事從你開始", title: ["第一首歌，", "想和你一起聽。"],
    body: "一杯喝不完的咖啡，一段捨不得走完的路。\n這一年的播放清單，就從這個普通的下午開始。", note: "EVERY GOOD STORY STARTS SOMEWHERE.",
    colors: { background: "lime-300", photoBackground: "violet-300", text: "gray-900", bodyText: "lime-950" }, kind: "story", photos: [photo(0, "our first track"), photo(2, "one more walk with you")], song: song(1, "The First Page"),
  },
  {
    id: "2025-12", year: 2025, month: "12", english: "DEC", label: "第一次，把喜歡唱很大聲", title: ["全場都在唱，", "我只想看著你。"],
    body: "燈暗下來的那一秒，你拉緊了我的手。\n後來每次聽見這段旋律，都會想起你發亮的眼睛。", note: "SOME NIGHTS DESERVE AN ENCORE.",
    palette: "pink", kind: "concert", concert: { number: 1, name: "THE FIRST ENCORE", venue: "示意場次 01 · 冬日演唱會" },
    photos: [photo(1, "louder together"), photo(2, "the walk home after the show")], song: song(2, "After the Encore"),
  },
  {
    id: "2026-01", year: 2026, month: "01", english: "JAN", label: "關於我們的第一題", title: ["新的一年，", "默契有幾分？"],
    body: "大事可能會忘記，小習慣倒是記得很清楚。\n這次換你選，看看我們的答案是不是同一個。", note: "A LITTLE QUIZ, A LOT OF US.",
    palette: "blue", kind: "quiz", photos: [photo(0, "your usual, please")], song: song(3, "Your Usual"),
    quiz: { prompt: "示意題：每次出門，我們最常說哪一句？", options: ["再走一下就好", "先買杯喝的吧", "下次一定早點出門"], answer: 1, reveal: "「先買杯喝的吧。」喝什麼可以想很久，跟誰出門倒是不用想。" },
  },
  {
    id: "2026-02", year: 2026, month: "02", english: "FEB", label: "第二場，心跳還是一樣快", title: ["喜歡的現場，", "喜歡的人在旁邊。"],
    body: "一起等開場、一起猜第一首歌，\n一起把捨不得結束的晚上，唱成第二段回憶。", note: "SAME HAND TO HOLD. A BRAND NEW SETLIST.",
    palette: "orange", kind: "concert", concert: { number: 2, name: "HEARTBEAT, LIVE", venue: "示意場次 02 · 心動現場" },
    photos: [photo(3, "our favorite kind of date"), photo(0, "before the lights go down")], song: song(4, "Heartbeat, Live"),
  },
  {
    id: "2026-03", year: 2026, month: "03", english: "MAR", label: "把春天過得慢一點", title: ["今天的行程，", "是和你一起。"],
    body: "沒有訂位，沒有一定要去的地方。\n只是走走、坐坐，把整個下午都浪費在喜歡的人身上。", note: "NO BIG PLANS. JUST MY FAVORITE PERSON.",
    palette: "violet", kind: "story", photos: [photo(4, "a very good ordinary day"), photo(0, "nowhere else to be")], song: song(5, "Slow Afternoon"),
  },
  {
    id: "2026-04", year: 2026, month: "04", english: "APR", label: "沒什麼大事，也很喜歡", title: ["平凡的小日子，", "也值得收藏。"],
    body: "這個月沒有大活動，卻有很多個「等一下再回家」。\n按一下，把今天的小小喜歡也放進播放清單。", note: "LITTLE THINGS. BIG FEELINGS.",
    palette: "lime", kind: "little-things", photos: [photo(4, "a little moment, on repeat")], song: song(6, "Nothing Special, Everything"),
    interaction: { action: "收藏一個小日子", reveal: "已收藏：和你一起，連發呆都很好。♡" },
  },
  {
    id: "2026-05", year: 2026, month: "05", english: "MAY", label: "今天的約會由誰決定？", title: ["有一題，", "我們總是選很久。"],
    body: "有些問題，不管問幾次都會再出現。\n例如今天吃什麼，還有明天可不可以再見面。", note: "YOU KNOW MY ANSWER ALREADY.",
    palette: "pink", kind: "quiz", photos: [photo(0, "the hardest question ever")], song: song(7, "Dinner for Two"),
    quiz: { prompt: "示意題：我們最難決定的事情是？", options: ["晚餐吃什麼", "電影看哪一部", "照片選哪一張"], answer: 0, reveal: "答案是晚餐！想了一路，最後還是選了那間我們都喜歡的小店。" },
  },
  {
    id: "2026-06", year: 2026, month: "06", english: "JUN", label: "第三場，把夏天開到最大聲", title: ["這個夏天，", "我們都在現場。"],
    body: "晚風、汗水、一起揮動的手，\n還有那首前奏一響，就忍不住轉頭看你的歌。", note: "TURN THE SUMMER UP.",
    palette: "blue", kind: "concert", concert: { number: 3, name: "SUMMER AT FULL VOLUME", venue: "示意場次 03 · 夏日演唱會" },
    photos: [photo(5, "summer sounds better with you"), photo(6, "our kind of summer")], song: song(8, "Summer at Full Volume"),
  },
  {
    id: "2026-07", year: 2026, month: "07", english: "JUL", label: "一起去看沒有盡頭的藍", title: ["把通知關掉，", "把海浪打開。"],
    body: "鞋子裡都是沙，手機裡都是你。\n好像只要牽著手，走到哪裡都算是旅行。", note: "OUT OF OFFICE. INTO THE BLUE.",
    palette: "orange", kind: "story", photos: [photo(6, "salty hair, happy hearts"), photo(4, "the best company")], song: song(9, "Sea You Again"),
  },
  {
    id: "2026-08", year: 2026, month: "08", english: "AUG", label: "這首歌，你還記得嗎？", title: ["前奏一響，", "回憶就回來了。"],
    body: "有些旋律會自動帶你回到某一天。\n不用看照片，也知道那時候旁邊站著誰。", note: "PRESS PLAY. FIND US THERE.",
    palette: "violet", kind: "quiz", photos: [photo(3, "a song that feels like us")], song: song(10, "You Know This One"),
    quiz: { prompt: "示意題：演唱會散場後，我們通常會做什麼？", options: ["一路重唱剛剛的歌", "認真研究下一場", "立刻找宵夜"], answer: 2, reveal: "先找宵夜！然後邊吃、邊重播剛剛最喜歡的那一段。" },
  },
  {
    id: "2026-09", year: 2026, month: "09", english: "SEP", label: "喜歡你這件事，持續播放中", title: ["沒有特別節日，", "也想送你一點喜歡。"],
    body: "普通的星期幾，普通的一起回家。\n但在我的年度精選裡，這種日子也一直有上榜。", note: "MY FAVORITE ROUTINE IS YOU.",
    palette: "pink", kind: "little-things", photos: [photo(2, "the long way home")], song: song(11, "The Long Way Home"),
    interaction: { action: "收下一點喜歡", reveal: "今天份的喜歡已送達，明天還有。♡" },
  },
  {
    id: "2026-10", year: 2026, month: "10", english: "OCT", label: "第四場，安可還想跟你一起", title: ["四場演唱會，", "同一個最喜歡的人。"],
    body: "今年的現場終於唱到第四場。\n喜歡的歌可能會換，下一場想約的人，還是你。", note: "FOUR SHOWS. ONE FAVORITE PERSON.",
    palette: "lime", kind: "concert", concert: { number: 4, name: "ONE MORE ENCORE", venue: "示意場次 04 · 秋日演唱會" },
    photos: [photo(7, "one more song, one more memory"), photo(1, "and all the shows to come")], song: song(12, "One More Encore"),
  },
  {
    id: "2026-11", year: 2026, month: "11", english: "NOV", label: "生日快樂，我最喜歡的你", title: ["下一年的主打歌，", "還是想和你一起。"],
    body: "十三個月，有很熱鬧的晚上，也有很安靜的日常。\n謝謝你，把它們都變成我想一直重播的回憶。", note: "HAPPY BIRTHDAY, MY FAVORITE PERSON.",
    palette: "orange", kind: "birthday", photos: [photo(8, "make a wish, my love"), photo(6, "to all our next chapters")], song: song(13, "All Our Next Chapters"),
    letter: "生日快樂。願你新的一歲，有喜歡的歌、有期待的明天，還有一直陪你去現場的我。下一年的每一首，也都想和你一起聽。♡",
  },
];
