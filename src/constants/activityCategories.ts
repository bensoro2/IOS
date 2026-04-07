import { Language } from "@/contexts/LanguageContext";

export interface ActivitySubCategory {
  id: string;
  name: string;
  names: Record<Language, string>;
  emoji: string;
}

export interface ActivityCategory {
  id: string;
  name: string;
  names: Record<Language, string>;
  emoji: string;
  subCategories: ActivitySubCategory[];
}

export const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  {
    id: "sports",
    name: "กีฬา",
    names: { th: "กีฬา", en: "Sports", ja: "スポーツ", zh: "运动", ko: "스포츠", ru: "Спорт" },
    emoji: "🏅",
    subCategories: [
      { id: "basketball", name: "บาสเกตบอล", names: { th: "บาสเกตบอล", en: "Basketball", ja: "バスケットボール", zh: "篮球", ko: "농구", ru: "Баскетбол" }, emoji: "🏀" },
      { id: "football", name: "ฟุตบอล / ฟุตซอล", names: { th: "ฟุตบอล / ฟุตซอล", en: "Football / Futsal", ja: "サッカー / フットサル", zh: "足球 / 五人制足球", ko: "축구 / 풋살", ru: "Футбол / Футзал" }, emoji: "⚽" },
      { id: "volleyball", name: "วอลเลย์บอล", names: { th: "วอลเลย์บอล", en: "Volleyball", ja: "バレーボール", zh: "排球", ko: "배구", ru: "Волейбол" }, emoji: "🏐" },
      { id: "golf", name: "กอล์ฟ", names: { th: "กอล์ฟ", en: "Golf", ja: "ゴルフ", zh: "高尔夫", ko: "골프", ru: "Гольф" }, emoji: "⛳" },
      { id: "badminton", name: "แบดมินตัน", names: { th: "แบดมินตัน", en: "Badminton", ja: "バドミントン", zh: "羽毛球", ko: "배드민턴", ru: "Бадминтон" }, emoji: "🏸" },
      { id: "tennis", name: "เทนนิส", names: { th: "เทนนิส", en: "Tennis", ja: "テニス", zh: "网球", ko: "테니스", ru: "Теннис" }, emoji: "🎾" },
      { id: "table-tennis", name: "ปิงปอง", names: { th: "ปิงปอง", en: "Table Tennis", ja: "卓球", zh: "乒乓球", ko: "탁구", ru: "Настольный теннис" }, emoji: "🏓" },
      { id: "swimming", name: "ว่ายน้ำ", names: { th: "ว่ายน้ำ", en: "Swimming", ja: "水泳", zh: "游泳", ko: "수영", ru: "Плавание" }, emoji: "🏊" },
      { id: "running", name: "วิ่งมาราธอน / วิ่งสวน", names: { th: "วิ่งมาราธอน / วิ่งสวน", en: "Marathon / Jogging", ja: "マラソン / ジョギング", zh: "马拉松 / 慢跑", ko: "마라톤 / 조깅", ru: "Марафон / Бег" }, emoji: "🏃" },
      { id: "fitness", name: "ฟิตเนส / เวทเทรนนิ่ง", names: { th: "ฟิตเนส / เวทเทรนนิ่ง", en: "Fitness / Weight Training", ja: "フィットネス / ウェイトトレーニング", zh: "健身 / 力量训练", ko: "피트니스 / 웨이트", ru: "Фитнес / Силовые" }, emoji: "🏋️" },
      { id: "yoga", name: "โยคะ / พิลาทิส", names: { th: "โยคะ / พิลาทิส", en: "Yoga / Pilates", ja: "ヨガ / ピラティス", zh: "瑜伽 / 普拉提", ko: "요가 / 필라테스", ru: "Йога / Пилатес" }, emoji: "🧘" },
      { id: "climbing", name: "ปีนผาจำลอง", names: { th: "ปีนผาจำลอง", en: "Rock Climbing", ja: "ロッククライミング", zh: "攀岩", ko: "암벽등반", ru: "Скалолазание" }, emoji: "🧗" },
      { id: "cycling", name: "ปั่นจักรยาน", names: { th: "ปั่นจักรยาน", en: "Cycling", ja: "サイクリング", zh: "骑行", ko: "사이클링", ru: "Велоспорт" }, emoji: "🚴" },
      { id: "martial-arts", name: "มวยไทย / ศิลปะป้องกันตัว", names: { th: "มวยไทย / ศิลปะป้องกันตัว", en: "Muay Thai / Martial Arts", ja: "ムエタイ / 格闘技", zh: "泰拳 / 武术", ko: "무에타이 / 격투기", ru: "Муай Тай / Единоборства" }, emoji: "🥊" },
      { id: "chess", name: "หมากรุก", names: { th: "หมากรุก", en: "Chess", ja: "チェス", zh: "国际象棋", ko: "체스", ru: "Шахматы" }, emoji: "♟️" },
      { id: "archery", name: "ยิงธนู", names: { th: "ยิงธนู", en: "Archery", ja: "アーチェリー", zh: "射箭", ko: "양궁", ru: "Стрельба из лука" }, emoji: "🏹" },
      { id: "skydiving", name: "กระโดดร่ม", names: { th: "กระโดดร่ม", en: "Skydiving", ja: "スカイダイビング", zh: "跳伞", ko: "스카이다이빙", ru: "Парашютный спорт" }, emoji: "🪂" },
      { id: "racing", name: "แข่งรถ", names: { th: "แข่งรถ", en: "Racing", ja: "レース", zh: "赛车", ko: "레이싱", ru: "Автогонки" }, emoji: "🏎️" },
      { id: "shooting", name: "ยิงปืน", names: { th: "ยิงปืน", en: "Shooting", ja: "射撃", zh: "射击", ko: "사격", ru: "Стрельба" }, emoji: "🔫" },
      { id: "horse-riding", name: "ขี่ม้า", names: { th: "ขี่ม้า", en: "Horse Riding", ja: "乗馬", zh: "骑马", ko: "승마", ru: "Верховая езда" }, emoji: "🏇" },
      { id: "ice-bath", name: "แช่น้ำแข็ง", names: { th: "แช่น้ำแข็ง", en: "Ice Bath", ja: "アイスバス", zh: "冰浴", ko: "아이스바스", ru: "Ледяная ванна" }, emoji: "🧊" },
      { id: "bowling", name: "โบว์ลิ่ง", names: { th: "โบว์ลิ่ง", en: "Bowling", ja: "ボウリング", zh: "保龄球", ko: "볼링", ru: "Боулинг" }, emoji: "🎳" },
      { id: "skateboarding", name: "สเก็ตบอร์ด", names: { th: "สเก็ตบอร์ด", en: "Skateboarding", ja: "スケートボード", zh: "滑板", ko: "스케이트보드", ru: "Скейтбординг" }, emoji: "🛹" },
      { id: "surfing", name: "เซิร์ฟ", names: { th: "เซิร์ฟ", en: "Surfing", ja: "サーフィン", zh: "冲浪", ko: "서핑", ru: "Сёрфинг" }, emoji: "🏄" },
      { id: "skiing", name: "สกี", names: { th: "สกี", en: "Skiing", ja: "スキー", zh: "滑雪", ko: "스키", ru: "Лыжи" }, emoji: "⛷️" },
      { id: "rugby", name: "รักบี้", names: { th: "รักบี้", en: "Rugby", ja: "ラグビー", zh: "橄榄球", ko: "럭비", ru: "Регби" }, emoji: "🏉" },
    ],
  },
  {
    id: "arts-music",
    name: "ศิลปะและดนตรี",
    names: { th: "ศิลปะและดนตรี", en: "Arts & Music", ja: "アートと音楽", zh: "艺术与音乐", ko: "예술 & 음악", ru: "Искусство и музыка" },
    emoji: "🎨",
    subCategories: [
      { id: "dancing", name: "เต้น", names: { th: "เต้น", en: "Dancing", ja: "ダンス", zh: "舞蹈", ko: "댄스", ru: "Танцы" }, emoji: "💃" },
      { id: "guitar", name: "เล่นกีตาร์", names: { th: "เล่นกีตาร์", en: "Guitar", ja: "ギター", zh: "吉他", ko: "기타", ru: "Гитара" }, emoji: "🎸" },
      { id: "piano", name: "เล่นเปียโน", names: { th: "เล่นเปียโน", en: "Piano", ja: "ピアノ", zh: "钢琴", ko: "피아노", ru: "Фортепиано" }, emoji: "🎹" },
      { id: "bass-drums", name: "เล่นเบส / กลอง", names: { th: "เล่นเบส / กลอง", en: "Bass / Drums", ja: "ベース / ドラム", zh: "贝斯 / 鼓", ko: "베이스 / 드럼", ru: "Бас / Ударные" }, emoji: "🥁" },
      { id: "singing", name: "ร้องเพลง", names: { th: "ร้องเพลง", en: "Singing", ja: "歌う", zh: "唱歌", ko: "노래", ru: "Пение" }, emoji: "🎤" },
      { id: "music-production", name: "ทำเพลง / โปรดิวซ์", names: { th: "ทำเพลง / โปรดิวซ์", en: "Music Production", ja: "音楽制作", zh: "音乐制作", ko: "음악 제작", ru: "Продюсирование" }, emoji: "🎧" },
      { id: "painting", name: "วาดรูป / ระบายสี", names: { th: "วาดรูป / ระบายสี", en: "Painting / Drawing", ja: "絵画 / お絵描き", zh: "绘画", ko: "그림 그리기", ru: "Рисование" }, emoji: "🖌️" },
      { id: "acting", name: "การแสดง / ละคร", names: { th: "การแสดง / ละคร", en: "Acting / Theater", ja: "演劇", zh: "表演 / 戏剧", ko: "연기 / 연극", ru: "Актёрское мастерство" }, emoji: "🎭" },
      { id: "writing", name: "เขียนหนังสือ / นิยาย", names: { th: "เขียนหนังสือ / นิยาย", en: "Writing / Novels", ja: "執筆 / 小説", zh: "写作 / 小说", ko: "글쓰기 / 소설", ru: "Писательство" }, emoji: "✍️" },
      { id: "pottery", name: "ปั้นเซรามิก", names: { th: "ปั้นเซรามิก", en: "Pottery / Ceramics", ja: "陶芸", zh: "陶艺", ko: "도예", ru: "Керамика" }, emoji: "🏺" },
    ],
  },
  {
    id: "outdoor",
    name: "กิจกรรมกลางแจ้ง",
    names: { th: "กิจกรรมกลางแจ้ง", en: "Outdoor", ja: "アウトドア", zh: "户外活动", ko: "아웃도어", ru: "На природе" },
    emoji: "🌲",
    subCategories: [
      { id: "hiking", name: "เดินป่า", names: { th: "เดินป่า", en: "Hiking", ja: "ハイキング", zh: "徒步", ko: "하이킹", ru: "Пешие прогулки" }, emoji: "🥾" },
      { id: "camping", name: "แคมป์ปิ้ง", names: { th: "แคมป์ปิ้ง", en: "Camping", ja: "キャンプ", zh: "露营", ko: "캠핑", ru: "Кемпинг" }, emoji: "⛺" },
      { id: "mountain-climbing", name: "ปีนเขา", names: { th: "ปีนเขา", en: "Mountain Climbing", ja: "登山", zh: "登山", ko: "등산", ru: "Альпинизм" }, emoji: "🏔️" },
      { id: "diving", name: "ทะเล / ดำน้ำ", names: { th: "ทะเล / ดำน้ำ", en: "Sea / Diving", ja: "海 / ダイビング", zh: "海洋 / 潜水", ko: "바다 / 다이빙", ru: "Море / Дайвинг" }, emoji: "🤿" },
      { id: "fishing", name: "ตกปลา", names: { th: "ตกปลา", en: "Fishing", ja: "釣り", zh: "钓鱼", ko: "낚시", ru: "Рыбалка" }, emoji: "🎣" },
      { id: "kayaking", name: "พายเรือ / คายัค", names: { th: "พายเรือ / คายัค", en: "Kayaking / Canoeing", ja: "カヤック / カヌー", zh: "皮划艇", ko: "카약 / 카누", ru: "Каякинг / Каноэ" }, emoji: "🛶" },
      { id: "birdwatching", name: "ส่องนก / ดูธรรมชาติ", names: { th: "ส่องนก / ดูธรรมชาติ", en: "Birdwatching / Nature", ja: "バードウォッチング", zh: "观鸟 / 自然观察", ko: "탐조 / 자연관찰", ru: "Наблюдение за птицами" }, emoji: "🦜" },
    ],
  },
  {
    id: "hobbies",
    name: "งานอดิเรก",
    names: { th: "งานอดิเรก", en: "Hobbies", ja: "趣味", zh: "爱好", ko: "취미", ru: "Хобби" },
    emoji: "🎯",
    subCategories: [
      { id: "cooking", name: "ทำอาหาร", names: { th: "ทำอาหาร", en: "Cooking", ja: "料理", zh: "烹饪", ko: "요리", ru: "Кулинария" }, emoji: "👨‍🍳" },
      { id: "photography", name: "ถ่ายรูป", names: { th: "ถ่ายรูป", en: "Photography", ja: "写真", zh: "摄影", ko: "사진", ru: "Фотография" }, emoji: "📷" },
      { id: "reading", name: "อ่านหนังสือ", names: { th: "อ่านหนังสือ", en: "Reading", ja: "読書", zh: "阅读", ko: "독서", ru: "Чтение" }, emoji: "📚" },
      { id: "meditation", name: "สมาธิ", names: { th: "สมาธิ", en: "Meditation", ja: "瞑想", zh: "冥想", ko: "명상", ru: "Медитация" }, emoji: "🧠" },
      { id: "merit-making", name: "ทำบุญ", names: { th: "ทำบุญ", en: "Merit Making", ja: "功徳", zh: "做功德", ko: "공덕", ru: "Благодеяние" }, emoji: "🙏" },
      { id: "gaming", name: "เล่นเกม", names: { th: "เล่นเกม", en: "Gaming", ja: "ゲーム", zh: "游戏", ko: "게임", ru: "Игры" }, emoji: "🎮" },
      { id: "board-game", name: "บอร์ดเกม", names: { th: "บอร์ดเกม", en: "Board Games", ja: "ボードゲーム", zh: "桌游", ko: "보드게임", ru: "Настольные игры" }, emoji: "🎲" },
      { id: "card-game", name: "เกมการ์ด", names: { th: "เกมการ์ด", en: "Card Games", ja: "カードゲーム", zh: "纸牌游戏", ko: "카드게임", ru: "Карточные игры" }, emoji: "🃏" },
      { id: "coding", name: "เขียนโค้ด", names: { th: "เขียนโค้ด", en: "Coding", ja: "プログラミング", zh: "编程", ko: "코딩", ru: "Программирование" }, emoji: "💻" },
      { id: "gardening", name: "ปลูกต้นไม้ / จัดสวน", names: { th: "ปลูกต้นไม้ / จัดสวน", en: "Gardening", ja: "ガーデニング", zh: "园艺", ko: "원예", ru: "Садоводство" }, emoji: "🌱" },
      { id: "movies", name: "ดูหนัง / ซีรีส์", names: { th: "ดูหนัง / ซีรีส์", en: "Movies / Series", ja: "映画 / ドラマ", zh: "电影 / 电视剧", ko: "영화 / 드라마", ru: "Кино / Сериалы" }, emoji: "🎬" },
      { id: "karaoke", name: "คาราโอเกะ", names: { th: "คาราโอเกะ", en: "Karaoke", ja: "カラオケ", zh: "卡拉OK", ko: "노래방", ru: "Караоке" }, emoji: "🎤" },
      { id: "traveling", name: "ท่องเที่ยว", names: { th: "ท่องเที่ยว", en: "Traveling", ja: "旅行", zh: "旅游", ko: "여행", ru: "Путешествия" }, emoji: "✈️" },
      { id: "language-learning", name: "เรียนภาษา", names: { th: "เรียนภาษา", en: "Language Learning", ja: "語学学習", zh: "学语言", ko: "어학", ru: "Изучение языков" }, emoji: "📝" },
      { id: "crafts", name: "งานฝีมือ / DIY", names: { th: "งานฝีมือ / DIY", en: "Crafts / DIY", ja: "ハンドメイド / DIY", zh: "手工 / DIY", ko: "공예 / DIY", ru: "Рукоделие / DIY" }, emoji: "🧵" },
      { id: "cafe-hopping", name: "คาเฟ่ฮอปปิ้ง", names: { th: "คาเฟ่ฮอปปิ้ง", en: "Café Hopping", ja: "カフェ巡り", zh: "咖啡厅打卡", ko: "카페 투어", ru: "Кафе-хоппинг" }, emoji: "☕" },
    ],
  },
];

// Helper functions
export const getAllSubCategories = (): ActivitySubCategory[] => {
  return ACTIVITY_CATEGORIES.flatMap((cat) => cat.subCategories);
};

export const getCategoryById = (categoryId: string): ActivityCategory | undefined => {
  return ACTIVITY_CATEGORIES.find((cat) => cat.id === categoryId);
};

export const getSubCategoryById = (subCategoryId: string): ActivitySubCategory | undefined => {
  return getAllSubCategories().find((sub) => sub.id === subCategoryId);
};

export const getCategoryBySubCategoryId = (subCategoryId: string): ActivityCategory | undefined => {
  return ACTIVITY_CATEGORIES.find((cat) =>
    cat.subCategories.some((sub) => sub.id === subCategoryId)
  );
};

// Get localized name helper
export const getLocalizedName = (item: { name: string; names: Record<string, string> }, language: string): string => {
  return item.names[language] || item.names["en"] || item.name;
};
