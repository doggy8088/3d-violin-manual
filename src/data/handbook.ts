export type ChapterId =
  | "cover"
  | "history"
  | "anatomy"
  | "strings"
  | "posture"
  | "bowing"
  | "leftHand"
  | "care"
  | "repertoire"
  | "quiz";

export interface Chapter {
  id: ChapterId;
  num: string;
  title: string;
  subtitle: string;
  latin: string;
}

export const CHAPTERS: Chapter[] = [
  { id: "cover", num: "00", title: "序章", subtitle: "弓弦之間", latin: "Prologue" },
  { id: "history", num: "01", title: "源流", subtitle: "克雷莫納的黃金時代", latin: "Origines" },
  { id: "anatomy", num: "02", title: "解剖", subtitle: "認識琴身的每一寸", latin: "Anatomia" },
  { id: "strings", num: "03", title: "四弦", subtitle: "G · D · A · E", latin: "Chordae" },
  { id: "posture", num: "04", title: "持琴", subtitle: "身體與樂器的對話", latin: "Habitus" },
  { id: "bowing", num: "05", title: "運弓", subtitle: "右手的語言", latin: "Arcus" },
  { id: "leftHand", num: "06", title: "左手", subtitle: "音準、把位與揉弦", latin: "Manus" },
  { id: "care", num: "07", title: "養護", subtitle: "調音、松香與歲月", latin: "Cura" },
  { id: "repertoire", num: "08", title: "曲目", subtitle: "從巴哈到帕格尼尼", latin: "Repertorium" },
  { id: "quiz", num: "09", title: "小試", subtitle: "檢驗你的耳朵與眼力", latin: "Examen" },
];

export interface ViolinPart {
  id: string;
  name: string;
  nameEn: string;
  group: string;
  summary: string;
  detail: string;
}

export const PARTS: ViolinPart[] = [
  {
    id: "scroll",
    name: "渦捲琴頭",
    nameEn: "Scroll",
    group: "琴頭",
    summary: "小提琴最具識別度的簽名。",
    detail:
      "渦捲不只是裝飾。它的重量與平衡會改變琴頸的手感，雕刻風格更是製琴師的筆跡。克雷莫納黃金時期的渦捲，線條從容、眼孔深邃，彷彿把木頭捲進時間裡。",
  },
  {
    id: "pegs",
    name: "弦軸",
    nameEn: "Tuning Pegs",
    group: "琴頭",
    summary: "以摩擦固定，負責粗調音高。",
    detail:
      "四支弦軸穿過弦軸箱，靠木材之間的精密錐度摩擦來固定。順時針通常升高音高。調音時要推入與轉動同時進行，否則容易打滑。微調則交給拉弦板上的微調器。",
  },
  {
    id: "nut",
    name: "上弦枕",
    nameEn: "Nut",
    group: "琴頸",
    summary: "弦在指板起點的門檻。",
    detail:
      "弦枕決定弦距、弦高與音準的起點。槽溝太深，空弦會buzz；太淺，按弦會費力。材料常見為牛骨或烏木，是一把琴「好不好按」的關鍵之一。",
  },
  {
    id: "fingerboard",
    name: "指板",
    nameEn: "Fingerboard",
    group: "琴頸",
    summary: "左手的地圖，通常是烏木。",
    detail:
      "指板微微內凹，讓弦在振動時不碰木頭。它沒有品格，音準完全交給耳朵與肌肉記憶。長把位時，左手會一路走向琴橋方向——那裡的音程距離越來越短。",
  },
  {
    id: "neck",
    name: "琴頸",
    nameEn: "Neck",
    group: "琴頸",
    summary: "左手擁抱的地方。",
    detail:
      "琴頸的厚度、肩線與仰角，直接決定把位轉換是否流暢。面板與琴頸的接合處稱為琴頸根（heel）。古典製琴會把琴頸以燕尾榫嵌入琴身，而非簡單黏接。",
  },
  {
    id: "body",
    name: "琴身",
    nameEn: "Body",
    group: "共鳴",
    summary: "上圓、中腰、下圓構成沙漏輪廓。",
    detail:
      "面板多為雲杉，底板與側板多為楓木。弧度（arch）決定聲音的張力與色彩：較高的弧度常帶來聚焦而甜美的音色，較平的弧度則可能更直接，聲音更容易推入大廳。側板高度約 30 毫米，讓空氣有駐足之處。",
  },
  {
    id: "fholes",
    name: "F 孔",
    nameEn: "F-holes",
    group: "共鳴",
    summary: "讓空氣與聲音找到出口。",
    detail:
      "F 孔讓面板自由振動，也讓琴箱內的空氣產生赫姆霍茲共振。缺口（nick）位置幾乎就是琴橋該站的地方。孔的長短、開合與傾斜，會改變空氣模式與高頻的釋放。",
  },
  {
    id: "bridge",
    name: "琴橋",
    nameEn: "Bridge",
    group: "傳導",
    summary: "把弦的振動交給面板。",
    detail:
      "琴橋是未黏死的活動零件，靠弦的壓力站著。它的足部必須與面板弧度密合。橋頂的弧度讓弓能單獨接觸一根弦，也能在雙音時同時咬住兩根。橋若前傾，聲音會變悶，也有倒塌的危險。",
  },
  {
    id: "strings",
    name: "琴弦",
    nameEn: "Strings",
    group: "振動",
    summary: "G3、D4、A4、E5，純五度相鄰。",
    detail:
      "現代弦以合成芯或鋼芯為主，外纏銀、鋁或鍍金。G 最粗、最沉；E 最細、最亮，常配獨立微調。腸弦仍被古樂愛用，聲音柔軟而呼吸感強，但對濕度極為敏感。",
  },
  {
    id: "tailpiece",
    name: "拉弦板",
    nameEn: "Tailpiece",
    group: "尾部",
    summary: "固定弦的另一端，並承載微調。",
    detail:
      "拉弦板透過尾繩掛在尾鈕上。它的重量與「弦後長度」（bridge 到拉弦板）會影響共振：過重可能悶住聲音，過輕則有時過於尖銳。許多演奏者只在 E 弦安裝微調器，以保留振動的自由。",
  },
  {
    id: "chinrest",
    name: "腮托",
    nameEn: "Chin Rest",
    group: "尾部",
    summary: "讓頭部穩定地「借」給小提琴。",
    detail:
      "腮托約於 1820 年代由史博爾（Louis Spohr）普及，讓演奏者不必用下巴直接夾面板。今日有中置、側置與各式曲線。選擇腮托，其實是在選擇脖子、下顎與肩膀如何一起工作。",
  },
  {
    id: "bow",
    name: "琴弓",
    nameEn: "Bow",
    group: "弓",
    summary: "聲音真正的畫筆。",
    detail:
      "弓桿多為伯南布哥木或碳纖，弓毛為馬尾。弓根（frog）控制重量，弓尖需要更主動的速度。松香讓弓毛咬住琴弦——沒有摩擦，就沒有聲音。一張好弓，往往被形容為「會呼吸」。",
  },
];

export const STRINGS = [
  {
    id: "G",
    name: "G 弦",
    note: "G3",
    freq: 196.0,
    color: "#c9a84c",
    character: "深、厚、像地底的共鳴",
    role: "和聲的根基。在協奏曲裡常被用來歌唱那些「從胸口出來」的旋律。",
    tension: "最粗，反應較慢，需要更多弓重。",
  },
  {
    id: "D",
    name: "D 弦",
    note: "D4",
    freq: 293.66,
    color: "#d7c39a",
    character: "暖、圓、像人聲的中區",
    role: "最容易「像在唱歌」的弦。許多抒情樂句喜歡停留在這裡。",
    tension: "平衡；注意不要壓死振動。",
  },
  {
    id: "A",
    name: "A 弦",
    note: "A4",
    freq: 440.0,
    color: "#eee4d2",
    character: "亮、直、像銀線",
    role: "調音的基準（A440）。穿透力好，適合宣敘與對答。",
    tension: "反應快，運弓稍有雜質就聽得見。",
  },
  {
    id: "E",
    name: "E 弦",
    note: "E5",
    freq: 659.25,
    color: "#f7f2ea",
    character: "銳、光、像高空的風",
    role: "華彩、泛音與燦爛的高音都靠它。也最容易刺耳。",
    tension: "最細，弓要走在「咬住但不刮」的邊界上。",
  },
] as const;

export const BOW_TECHNIQUES = [
  {
    id: "detache",
    name: "Détaché",
    zh: "分弓",
    desc: "一弓一音，連貫但不黏。這是一切運弓的母語，要求弓速、壓力與接觸點穩定。",
  },
  {
    id: "legato",
    name: "Legato",
    zh: "連弓",
    desc: "多音走在同一弓裡，換弦時像把縫藏起來。弓段分配是秘密：後面的音也要留得住氣。",
  },
  {
    id: "staccato",
    name: "Staccato",
    zh: "斷弓",
    desc: "音與音之間有清楚的靜默。可以是同一弓連續停頓，或分開的短弓。關鍵在「停」而不是「砍」。",
  },
  {
    id: "martele",
    name: "Martelé",
    zh: "錘弓",
    desc: "起音如錘擊，先咬住再釋放。每個音都有清晰的子音，常見於巴洛克與技巧練習。",
  },
  {
    id: "spiccato",
    name: "Spiccato",
    zh: "跳弓",
    desc: "弓在中下弓自然離弦，利用彈性而非硬壓。速度起來後，手只要「允許」它跳。",
  },
  {
    id: "sautille",
    name: "Sautillé",
    zh: "拋跳弓",
    desc: "更快的跳弓，弓幾乎自己跳舞。接觸點略靠近中弓，手腕鬆、手指活。",
  },
  {
    id: "tremolo",
    name: "Tremolo",
    zh: "顫弓",
    desc: "極快速的來回，製造霧、風與緊張。電影配樂裡的暴風雨，常常從這裡開始。",
  },
  {
    id: "ponticello",
    name: "Sul ponticello",
    zh: "近橋奏",
    desc: "弓靠近琴橋，高頻泛音被放大，音色變得金屬而幽靈。德彪西與當代作品常用。",
  },
] as const;

export const FINGER_POSITIONS = [
  { finger: "空弦", note: "A4", string: "A", step: 0, hint: "讓弦自己說話" },
  { finger: "1", note: "B4", string: "A", step: 1, hint: "全音：約一個指寬多一點" },
  { finger: "2", note: "C#5", string: "A", step: 2, hint: "高二指，常見大調手型" },
  { finger: "3", note: "D5", string: "A", step: 3, hint: "與 D 空弦同音，用來對音準" },
  { finger: "4", note: "E5", string: "A", step: 4, hint: "與 E 空弦同音，小指要獨立" },
];

export const REPERTOIRE = [
  {
    title: "無伴奏小提琴奏鳴曲與組曲",
    composer: "J. S. Bach",
    year: "約 1720",
    era: "巴洛克",
    why: "小提琴的舊約聖經。一把琴要同時是旋律、低音與建築。第二組曲的夏康舞曲，是許多人一生的功課。",
  },
  {
    title: "四季",
    composer: "A. Vivaldi",
    year: "1725",
    era: "巴洛克",
    why: "標題音樂的先行者。你能在弓法裡聽見鳥、雷、冰與犬吠。也是認識 Baroque 運弓語氣的入門。",
  },
  {
    title: "D 大調小提琴協奏曲",
    composer: "L. van Beethoven",
    year: "1806",
    era: "古典／浪漫",
    why: "定音鼓的五下敲擊打開了協奏曲的新尺度。它不炫技，卻要求聲音像月光一樣寬。",
  },
  {
    title: "e 小調小提琴協奏曲",
    composer: "F. Mendelssohn",
    year: "1844",
    era: "浪漫",
    why: "第一樂章由小提琴直接唱出，沒有長長的樂隊前言。旋律幾乎「太美」，因此更需要品味。",
  },
  {
    title: "D 大調小提琴協奏曲",
    composer: "P. I. Tchaikovsky",
    year: "1878",
    era: "浪漫",
    why: "曾經被譏為「無法演奏」。今日它是技巧與熱情的試金石，第三樂章的俄羅斯舞步令人腿軟。",
  },
  {
    title: "二十四首隨想曲",
    composer: "N. Paganini",
    year: "約 1802–17",
    era: "浪漫",
    why: "左手撥弦、飛跳弓、雙泛音……小提琴技巧的百科全書。第 24 首更成為後世變奏的母題。",
  },
  {
    title: "g 小調第一號協奏曲",
    composer: "M. Bruch",
    year: "1866",
    era: "浪漫",
    why: "最常被學生作為「第一首大協奏曲」。第二樂章的歌唱，是在學如何把弓走得像呼吸。",
  },
  {
    title: "流浪者之歌",
    composer: "P. de Sarasate",
    year: "1878",
    era: "浪漫",
    why: "吉普賽音階、左手撥弦與華麗的泛音。它提醒我們：小提琴也可以非常「街頭」、非常自由。",
  },
];

export const HISTORY_TIMELINE = [
  {
    year: "約 1550",
    title: "阿瑪蒂的克雷莫納",
    body: "Andrea Amati 為法國宮廷製作最早一批真正意義上的小提琴。輪廓、F 孔與四弦形制在此成形。",
  },
  {
    year: "1660s",
    title: "史特拉第瓦里出師",
    body: "Antonio Stradivari 可能受教於 Nicolò Amati。他一生製作逾千件，傳世約六百。",
  },
  {
    year: "1700–1720",
    title: "黃金時期",
    body: "Stradivari 的「黃金時期」定下長型琴身與更飽滿的聲音，適合即將到來的大廳。",
  },
  {
    year: "1730s",
    title: "瓜奈里·德·耶穌",
    body: "Giuseppe Guarneri del Gesù 的琴更粗獷、更黑暗。帕格尼尼的「大砲」Cannone 即出自他手。",
  },
  {
    year: "19 世紀",
    title: "現代化改造",
    body: "為了更大的音量，琴頸被加長、角度改變、低音樑加強、弦的張力上升。多數古琴今日的聲音，已不是它出廠時的聲音。",
  },
  {
    year: "今日",
    title: "新製琴與古樂",
    body: "當代製琴師以科學與耳朵並進；古樂運動則把腸弦、巴洛克弓與較低的音高請回舞台。",
  },
];

export const CARE_TIPS = [
  {
    title: "松香",
    body: "新弓毛先上足松香；之後每次演奏輕輕擦幾下即可。過多會讓聲音沙、面板積粉。",
  },
  {
    title: "清潔",
    body: "演奏後用柔軟乾布擦掉指板、面板上的松香與手汗。不要用酒精碰漆——那是在溶解百年的皮膚。",
  },
  {
    title: "濕度",
    body: "理想相對濕度約 40–60%。太乾，面板會收縮甚至開裂；太濕，聲音變悶、膠合鬆動。",
  },
  {
    title: "琴橋",
    body: "側視應大致垂直（或微微向拉弦板傾斜）。換弦時不要一次全換到鬆，橋會跟著倒下。",
  },
  {
    title: "弓毛",
    body: "鬆緊以演奏時桿微彎為準。收琴務必放鬆弓毛，否則弓桿會逐漸失去弧度。手指絕不碰弓毛。",
  },
  {
    title: "收納",
    body: "琴盒內放濕度計。避免後車廂與暖氣出風口。旅行時弦可略微放鬆，但不必完全卸下。",
  },
];

export const POSTURE_POINTS = [
  {
    title: "站立",
    body: "雙腳約肩寬，左腳略前。重心可在兩腳之間移動，但不要把琴「掛」在左肩上當唯一支點。",
  },
  {
    title: "肩與顎",
    body: "肩墊或肩托是選擇而非義務。目標是：頭自然放上腮托，左肩不必聳起，左手不必負責「抓住琴不掉」。",
  },
  {
    title: "持弓",
    body: "拇指彎而有彈性，小指輕輕站在弓桿上當平衡桿。Franco-Belgian 持法讓手指包住弓，Russian 持法則手腕較高、音色常更厚。",
  },
  {
    title: "左腕",
    body: "手腕平而活，不要內折成折斷狀。拇指對着一、二指，像輕輕握住一個易碎的杯子。",
  },
];

export const QUIZ = [
  {
    q: "小提琴四根弦由低到高依序是？",
    options: ["C–G–D–A", "G–D–A–E", "E–A–D–G", "G–C–E–A"],
    a: 1,
    explain: "小提琴以五度定弦：G3、D4、A4、E5。吉他才是 E–A–D–G–B–E。",
  },
  {
    q: "現代音樂會的標準音高 A4 大約是？",
    options: ["415 Hz", "430 Hz", "440 Hz", "466 Hz"],
    a: 2,
    explain: "A440 是最普遍的國際標準。巴洛克古樂常使用 A415，聽起來約低半音。",
  },
  {
    q: "F 孔最主要的功能是？",
    options: ["純粹裝飾", "讓面板振動並釋放空氣共振", "固定琴橋", "降低琴的重量"],
    a: 1,
    explain: "F 孔使面板能自由振動，並與琴箱空氣形成共振。琴橋站在 F 孔缺口附近，但不「固定」於孔上。",
  },
  {
    q: "被稱為製琴黃金時期、活躍於克雷莫納的大師是？",
    options: ["Stradivari", "Steinway", "Böhm", "Broadwood"],
    a: 0,
    explain: "Antonio Stradivari（史特拉第瓦里）與 Guarneri、Amati 同為克雷莫納傳奇。Steinway 是鋼琴。",
  },
  {
    q: "Sul ponticello 指的是？",
    options: ["在指板上演奏", "靠近琴橋演奏", "用弓桿敲擊", "左手撥弦"],
    a: 1,
    explain: "Ponticello 即琴橋。靠近它會強調高次泛音。在指板上則是 sul tasto。",
  },
  {
    q: "腮托開始普及大約是在？",
    options: ["巴洛克初期", "十九世紀", "電子擴大時代", "中世紀"],
    a: 1,
    explain: "Louis Spohr 在 1820 年代推廣腮托，以因應更高的把位與更劇烈的演奏風格。",
  },
  {
    q: "空弦 G 的頻率最接近？",
    options: ["98 Hz", "196 Hz", "330 Hz", "440 Hz"],
    a: 1,
    explain: "G3 ≈ 196 Hz。G2（98 Hz）是大提琴的 C 弦下面那根 G；A4 才是 440。",
  },
  {
    q: "收弓時最重要的習慣是？",
    options: ["把弓毛盡量繃緊過夜", "放鬆弓毛", "把弓泡在松香盒裡", "卸下所有弓毛"],
    a: 1,
    explain: "弓毛保持緊繃會讓弓桿逐漸失去曲線（camber），等於慢性損壞一張弓。",
  },
];

export const IMG = {
  hero: "/images/hero-stage.jpg",
  cover: "/images/cover-violin.jpg",
  workshop: "/images/workshop-warm.jpg",
  scroll:
    "https://images.pexels.com/photos/37210788/pexels-photo-37210788.jpeg?auto=compress&cs=tinysrgb&w=1400",
  varnish:
    "https://images.pexels.com/photos/7095503/pexels-photo-7095503.jpeg?auto=compress&cs=tinysrgb&w=1400",
  darkViolin:
    "https://images.pexels.com/photos/5137409/pexels-photo-5137409.jpeg?auto=compress&cs=tinysrgb&w=1400",
  tableViolins:
    "https://images.pexels.com/photos/306081/pexels-photo-306081.jpeg?auto=compress&cs=tinysrgb&w=1400",
  hall: "https://images.pexels.com/photos/38781086/pexels-photo-38781086.jpeg?auto=compress&cs=tinysrgb&w=1600",
  opera:
    "https://images.pexels.com/photos/37279232/pexels-photo-37279232.jpeg?auto=compress&cs=tinysrgb&w=1600",
  hands:
    "https://images.pexels.com/photos/6037775/pexels-photo-6037775.jpeg?auto=compress&cs=tinysrgb&w=1400",
  playing:
    "https://images.pexels.com/photos/8929333/pexels-photo-8929333.jpeg?auto=compress&cs=tinysrgb&w=1400",
  orchestra:
    "https://images.pexels.com/photos/7095737/pexels-photo-7095737.jpeg?auto=compress&cs=tinysrgb&w=1600",
  violinist:
    "https://images.pexels.com/photos/12279581/pexels-photo-12279581.jpeg?auto=compress&cs=tinysrgb&w=1400",
  luthier:
    "https://images.pexels.com/photos/6075991/pexels-photo-6075991.jpeg?auto=compress&cs=tinysrgb&w=1400",
  craft:
    "https://images.pexels.com/photos/37864374/pexels-photo-37864374.jpeg?auto=compress&cs=tinysrgb&w=1400",
  score:
    "https://images.pexels.com/photos/5598953/pexels-photo-5598953.jpeg?auto=compress&cs=tinysrgb&w=1400",
  violinScore:
    "https://images.pexels.com/photos/4231488/pexels-photo-4231488.jpeg?auto=compress&cs=tinysrgb&w=1400",
  fhole:
    "https://images.pexels.com/photos/25859073/pexels-photo-25859073.jpeg?auto=compress&cs=tinysrgb&w=900",
  fingerboard:
    "https://images.pexels.com/photos/37210790/pexels-photo-37210790.jpeg?auto=compress&cs=tinysrgb&w=1400",
};
