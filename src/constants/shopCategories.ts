export interface ShopCategory {
  id: string;
  name: string;
  emoji: string;
}

export interface ShopCategoryGroup {
  id: string;
  name: string;
  emoji: string;
  categories: ShopCategory[];
}

// Translation map for category/group names
const SHOP_TRANSLATIONS: Record<string, Record<string, string>> = {
  // Groups
  "ร้านขายของ": { en: "Shops", ja: "ショップ", zh: "商店", ko: "상점", ru: "Магазины" },
  "อาหารและเครื่องดื่ม": { en: "Food & Drinks", ja: "飲食", zh: "餐饮", ko: "음식 & 음료", ru: "Еда и напитки" },
  "การศึกษา": { en: "Education", ja: "教育", zh: "教育", ko: "교육", ru: "Образование" },
  "ดนตรีและศิลปะ": { en: "Music & Art", ja: "音楽・アート", zh: "音乐与艺术", ko: "음악 & 예술", ru: "Музыка и искусство" },
  "กีฬาและสุขภาพ": { en: "Sports & Health", ja: "スポーツ・健康", zh: "体育与健康", ko: "스포츠 & 건강", ru: "Спорт и здоровье" },
  "แฟชั่น": { en: "Fashion", ja: "ファッション", zh: "时尚", ko: "패션", ru: "Мода" },
  "IT และอิเล็กทรอนิกส์": { en: "IT & Electronics", ja: "IT・電子機器", zh: "IT与电子", ko: "IT & 전자기기", ru: "IT и электроника" },
  "บ้านและสวน": { en: "Home & Garden", ja: "ホーム・ガーデン", zh: "家居与花园", ko: "홈 & 가든", ru: "Дом и сад" },
  "ยานพาหนะและการเดินทาง": { en: "Vehicles & Travel", ja: "車・旅行", zh: "车辆与旅行", ko: "차량 & 여행", ru: "Транспорт и путешествия" },
  "สุขภาพและความงาม": { en: "Health & Beauty", ja: "健康・美容", zh: "健康与美容", ko: "건강 & 뷰티", ru: "Здоровье и красота" },
  "ธุรกิจและบริการ": { en: "Business & Services", ja: "ビジネス・サービス", zh: "商务与服务", ko: "비즈니스 & 서비스", ru: "Бизнес и услуги" },
  // Categories - Shops
  "ร้านขายของชำ": { en: "Grocery Store", ja: "食料品店", zh: "杂货店", ko: "식료품점", ru: "Продуктовый" },
  "มินิมาร์ท": { en: "Mini Mart", ja: "ミニマート", zh: "便利店", ko: "미니마트", ru: "Минимаркет" },
  "ซูเปอร์มาร์เก็ตท้องถิ่น": { en: "Local Supermarket", ja: "地元スーパー", zh: "本地超市", ko: "지역 슈퍼마켓", ru: "Местный супермаркет" },
  "ร้านเครื่องเขียน": { en: "Stationery Shop", ja: "文房具店", zh: "文具店", ko: "문구점", ru: "Канцтовары" },
  "อุปกรณ์การเรียน": { en: "School Supplies", ja: "学用品", zh: "学习用品", ko: "학용품", ru: "Учебные принадлежности" },
  "ร้านถ่ายเอกสาร": { en: "Copy Shop", ja: "コピーショップ", zh: "复印店", ko: "복사가게", ru: "Копировальный центр" },
  // Categories - Food & Drinks
  "ร้านอาหาร": { en: "Restaurant", ja: "レストラン", zh: "餐厅", ko: "레스토랑", ru: "Ресторан" },
  "คาเฟ่": { en: "Cafe", ja: "カフェ", zh: "咖啡馆", ko: "카페", ru: "Кафе" },
  "ร้านขนม/เบเกอรี่": { en: "Bakery", ja: "ベーカリー", zh: "烘焙店", ko: "베이커리", ru: "Пекарня" },
  "ร้านน้ำผลไม้/สมูทตี้": { en: "Juice & Smoothie", ja: "ジュース・スムージー", zh: "果汁/冰沙", ko: "주스 & 스무디", ru: "Соки и смузи" },
  "ร้านอาหารเดลิเวอรี": { en: "Food Delivery", ja: "デリバリー", zh: "外卖", ko: "배달음식", ru: "Доставка еды" },
  "ฟู้ดทรัค": { en: "Food Truck", ja: "フードトラック", zh: "餐车", ko: "푸드트럭", ru: "Фудтрак" },
  // Categories - Education
  "ร้านหนังสือ": { en: "Bookstore", ja: "書店", zh: "书店", ko: "서점", ru: "Книжный" },
  "ร้านหนังสือมือสอง": { en: "Used Bookstore", ja: "古書店", zh: "二手书店", ko: "중고서점", ru: "Букинист" },
  "สถาบันกวดวิชา": { en: "Tutoring Center", ja: "学習塾", zh: "补习班", ko: "학원", ru: "Репетиторский центр" },
  "โรงเรียนสอนภาษา": { en: "Language School", ja: "語学学校", zh: "语言学校", ko: "어학원", ru: "Языковая школа" },
  "ศูนย์เรียนพิเศษ": { en: "Learning Center", ja: "学習センター", zh: "学习中心", ko: "학습센터", ru: "Учебный центр" },
  "ห้องสมุด": { en: "Library", ja: "図書館", zh: "图书馆", ko: "도서관", ru: "Библиотека" },
  // Categories - Music & Art
  "ร้านอุปกรณ์ดนตรี": { en: "Music Instruments", ja: "楽器店", zh: "乐器店", ko: "악기점", ru: "Музыкальные инструменты" },
  "โรงเรียนสอนดนตรี": { en: "Music School", ja: "音楽教室", zh: "音乐学校", ko: "음악학원", ru: "Музыкальная школа" },
  "สตูดิโอซ้อมดนตรี": { en: "Practice Studio", ja: "練習スタジオ", zh: "排练室", ko: "연습실", ru: "Репетиционная студия" },
  "สตูดิโอบันทึกเสียง": { en: "Recording Studio", ja: "レコーディングスタジオ", zh: "录音棚", ko: "녹음실", ru: "Студия звукозаписи" },
  "ร้านขายแผ่นเสียง": { en: "Vinyl Shop", ja: "レコード店", zh: "唱片店", ko: "레코드가게", ru: "Виниловый магазин" },
  "ร้านอุปกรณ์ศิลปะ": { en: "Art Supplies", ja: "画材店", zh: "美术用品", ko: "미술용품점", ru: "Товары для творчества" },
  "แกลเลอรี": { en: "Gallery", ja: "ギャラリー", zh: "画廊", ko: "갤러리", ru: "Галерея" },
  // Categories - Sports & Health
  "ร้านอุปกรณ์กีฬา": { en: "Sports Equipment", ja: "スポーツ用品", zh: "体育用品", ko: "스포츠용품", ru: "Спортивные товары" },
  "ฟิตเนส/ยิม": { en: "Gym / Fitness", ja: "ジム・フィットネス", zh: "健身房", ko: "헬스장", ru: "Фитнес-зал" },
  "สนามแบดมินตัน": { en: "Badminton Court", ja: "バドミントンコート", zh: "羽毛球场", ko: "배드민턴장", ru: "Бадминтонный корт" },
  "สนามฟุตบอล": { en: "Football Field", ja: "サッカー場", zh: "足球场", ko: "축구장", ru: "Футбольное поле" },
  "สนามบาสเกตบอล": { en: "Basketball Court", ja: "バスケットコート", zh: "篮球场", ko: "농구장", ru: "Баскетбольная площадка" },
  "สระว่ายน้ำ": { en: "Swimming Pool", ja: "プール", zh: "游泳池", ko: "수영장", ru: "Бассейн" },
  "โรงเรียนสอนว่ายน้ำ": { en: "Swimming School", ja: "水泳教室", zh: "游泳学校", ko: "수영학원", ru: "Школа плавания" },
  "สตูดิโอโยคะ/พิลาทิส": { en: "Yoga / Pilates", ja: "ヨガ・ピラティス", zh: "瑜伽/普拉提", ko: "요가/필라테스", ru: "Йога / Пилатес" },
  "คลินิกกายภาพบำบัด": { en: "Physiotherapy", ja: "理学療法", zh: "理疗诊所", ko: "물리치료", ru: "Физиотерапия" },
  "ตกปลา": { en: "Fishing", ja: "釣り", zh: "钓鱼", ko: "낚시", ru: "Рыбалка" },
  // Categories - Fashion
  "ร้านเสื้อผ้า": { en: "Clothing Store", ja: "洋服店", zh: "服装店", ko: "옷가게", ru: "Магазин одежды" },
  "ร้านเสื้อผ้ามือสอง": { en: "Secondhand Clothes", ja: "古着屋", zh: "二手服装", ko: "중고의류", ru: "Секонд-хенд" },
  "ร้านรองเท้า": { en: "Shoe Store", ja: "靴屋", zh: "鞋店", ko: "신발가게", ru: "Обувной" },
  "ร้านเครื่องประดับ": { en: "Accessories", ja: "アクセサリー", zh: "饰品店", ko: "액세서리", ru: "Аксессуары" },
  "ร้านตัดเย็บ": { en: "Tailor", ja: "テーラー", zh: "裁缝店", ko: "양복점", ru: "Ателье" },
  "ร้านแฟชั่นออนไลน์": { en: "Online Fashion", ja: "オンラインファッション", zh: "在线时尚", ko: "온라인패션", ru: "Онлайн-мода" },
  "ร้านวินเทจ": { en: "Vintage Shop", ja: "ヴィンテージショップ", zh: "复古店", ko: "빈티지샵", ru: "Винтаж" },
  // Categories - IT & Electronics
  "ร้านคอมพิวเตอร์": { en: "Computer Shop", ja: "パソコンショップ", zh: "电脑店", ko: "컴퓨터가게", ru: "Компьютерный магазин" },
  "ร้านอุปกรณ์ไอที": { en: "IT Equipment", ja: "IT機器", zh: "IT设备", ko: "IT장비", ru: "IT-оборудование" },
  "ร้านมือถือ": { en: "Mobile Shop", ja: "携帯ショップ", zh: "手机店", ko: "휴대폰가게", ru: "Магазин телефонов" },
  "ร้านซ่อมโทรศัพท์": { en: "Phone Repair", ja: "スマホ修理", zh: "手机维修", ko: "폰수리", ru: "Ремонт телефонов" },
  "ร้านขายแกดเจ็ต": { en: "Gadget Shop", ja: "ガジェットショップ", zh: "数码店", ko: "가젯샵", ru: "Гаджеты" },
  "ร้านเกม": { en: "Game Shop", ja: "ゲームショップ", zh: "游戏店", ko: "게임샵", ru: "Игровой магазин" },
  // Categories - Home & Garden
  "ร้านเฟอร์นิเจอร์": { en: "Furniture", ja: "家具店", zh: "家具店", ko: "가구점", ru: "Мебель" },
  "ร้านของแต่งบ้าน": { en: "Home Decor", ja: "インテリア", zh: "家居装饰", ko: "인테리어", ru: "Декор для дома" },
  "ร้านเครื่องครัว": { en: "Kitchenware", ja: "キッチン用品", zh: "厨具", ko: "주방용품", ru: "Кухонные принадлежности" },
  "ร้านวัสดุก่อสร้าง": { en: "Construction Materials", ja: "建材店", zh: "建材", ko: "건축자재", ru: "Стройматериалы" },
  "ร้านต้นไม้/สวน": { en: "Plants & Garden", ja: "園芸店", zh: "花卉/园艺", ko: "식물/정원", ru: "Растения и сад" },
  "ร้านซ่อมบ้าน": { en: "Home Repair", ja: "リフォーム", zh: "家庭维修", ko: "집수리", ru: "Ремонт дома" },
  "ร้านเครื่องใช้ไฟฟ้า": { en: "Appliances", ja: "家電", zh: "家电", ko: "가전제품", ru: "Бытовая техника" },
  // Categories - Vehicles & Travel
  "ร้านซ่อมรถ": { en: "Car Repair", ja: "自動車修理", zh: "汽车维修", ko: "자동차수리", ru: "Автосервис" },
  "ร้านแต่งรถ": { en: "Car Accessories", ja: "カーアクセサリー", zh: "汽车改装", ko: "자동차용품", ru: "Автоаксессуары" },
  "ร้านอะไหล่รถ": { en: "Car Parts", ja: "自動車部品", zh: "汽车配件", ko: "자동차부품", ru: "Автозапчасти" },
  "ร้านล้างรถ": { en: "Car Wash", ja: "洗車", zh: "洗车", ko: "세차장", ru: "Автомойка" },
  "ร้านจักรยาน": { en: "Bicycle Shop", ja: "自転車店", zh: "自行车店", ko: "자전거가게", ru: "Велосипедный" },
  "ร้านเช่ารถ": { en: "Car Rental", ja: "レンタカー", zh: "租车", ko: "렌터카", ru: "Прокат авто" },
  "ร้านอุปกรณ์เดินทาง": { en: "Travel Gear", ja: "旅行用品", zh: "旅行用品", ko: "여행용품", ru: "Товары для путешествий" },
  // Categories - Health & Beauty
  "ร้านขายยา": { en: "Pharmacy", ja: "薬局", zh: "药店", ko: "약국", ru: "Аптека" },
  "คลินิก": { en: "Clinic", ja: "クリニック", zh: "诊所", ko: "클리닉", ru: "Клиника" },
  "ร้านสปา": { en: "Spa", ja: "スパ", zh: "水疗", ko: "스파", ru: "Спа" },
  "ร้านนวด": { en: "Massage", ja: "マッサージ", zh: "按摩", ko: "마사지", ru: "Массаж" },
  "ร้านเสริมความงาม": { en: "Beauty Shop", ja: "エステ", zh: "美容店", ko: "뷰티샵", ru: "Салон красоты" },
  "ร้านตัดผม/ซาลอน": { en: "Hair Salon", ja: "美容室", zh: "美发沙龙", ko: "미용실", ru: "Парикмахерская" },
  "ร้านผลิตภัณฑ์สุขภาพ": { en: "Health Products", ja: "健康食品", zh: "健康产品", ko: "건강식품", ru: "Здоровое питание" },
  // Categories - Business & Services
  "สำนักงานบัญชี": { en: "Accounting Office", ja: "会計事務所", zh: "会计事务所", ko: "회계사무소", ru: "Бухгалтерия" },
  "ที่ปรึกษาธุรกิจ": { en: "Business Consulting", ja: "ビジネスコンサルタント", zh: "商业咨询", ko: "비즈니스컨설팅", ru: "Бизнес-консалтинг" },
  "สตูดิโอถ่ายภาพ": { en: "Photo Studio", ja: "フォトスタジオ", zh: "摄影工作室", ko: "사진스튜디오", ru: "Фотостудия" },
  "บริษัทรับทำการตลาด": { en: "Marketing Agency", ja: "マーケティング会社", zh: "营销公司", ko: "마케팅에이전시", ru: "Маркетинговое агентство" },
  "บริษัทรับทำคอนเทนต์": { en: "Content Agency", ja: "コンテンツ制作", zh: "内容制作公司", ko: "콘텐츠에이전시", ru: "Контент-агентство" },
  "บริษัทพัฒนาเว็บไซต์/แอป": { en: "Web/App Development", ja: "ウェブ・アプリ開発", zh: "网站/应用开发", ko: "웹/앱개발", ru: "Веб/Приложения" },
};

export const getLocalizedShopCategory = (thName: string, language: string): string => {
  if (language === "th") return thName;
  return SHOP_TRANSLATIONS[thName]?.[language] || thName;
};

export const SHOP_CATEGORY_GROUPS: ShopCategoryGroup[] = [
  {
    id: "shops",
    name: "ร้านขายของ",
    emoji: "🛒",
    categories: [
      { id: "grocery", name: "ร้านขายของชำ", emoji: "🛒" },
      { id: "minimart", name: "มินิมาร์ท", emoji: "🏪" },
      { id: "supermarket", name: "ซูเปอร์มาร์เก็ตท้องถิ่น", emoji: "🛍️" },
      { id: "stationery", name: "ร้านเครื่องเขียน", emoji: "✏️" },
      { id: "school-supplies", name: "อุปกรณ์การเรียน", emoji: "📚" },
      { id: "copy-shop", name: "ร้านถ่ายเอกสาร", emoji: "🖨️" },
    ],
  },
  {
    id: "food-drinks",
    name: "อาหารและเครื่องดื่ม",
    emoji: "🍜",
    categories: [
      { id: "restaurant", name: "ร้านอาหาร", emoji: "🍜" },
      { id: "cafe", name: "คาเฟ่", emoji: "☕" },
      { id: "bakery", name: "ร้านขนม/เบเกอรี่", emoji: "🥐" },
      { id: "juice-smoothie", name: "ร้านน้ำผลไม้/สมูทตี้", emoji: "🥤" },
      { id: "delivery", name: "ร้านอาหารเดลิเวอรี", emoji: "🚴" },
      { id: "food-truck", name: "ฟู้ดทรัค", emoji: "🚚" },
    ],
  },
  {
    id: "education",
    name: "การศึกษา",
    emoji: "📖",
    categories: [
      { id: "bookstore", name: "ร้านหนังสือ", emoji: "📚" },
      { id: "secondhand-books", name: "ร้านหนังสือมือสอง", emoji: "📖" },
      { id: "tutoring", name: "สถาบันกวดวิชา", emoji: "🎓" },
      { id: "language-school", name: "โรงเรียนสอนภาษา", emoji: "🗣️" },
      { id: "learning-center", name: "ศูนย์เรียนพิเศษ", emoji: "📝" },
      { id: "co-learning", name: "Co-learning space", emoji: "👥" },
      { id: "library", name: "ห้องสมุด", emoji: "🏛️" },
    ],
  },
  {
    id: "music-art",
    name: "ดนตรีและศิลปะ",
    emoji: "🎵",
    categories: [
      { id: "music-instruments", name: "ร้านอุปกรณ์ดนตรี", emoji: "🎸" },
      { id: "music-school", name: "โรงเรียนสอนดนตรี", emoji: "🎹" },
      { id: "practice-studio", name: "สตูดิโอซ้อมดนตรี", emoji: "🎤" },
      { id: "recording-studio", name: "สตูดิโอบันทึกเสียง", emoji: "🎧" },
      { id: "vinyl-shop", name: "ร้านขายแผ่นเสียง", emoji: "💿" },
      { id: "art-supplies", name: "ร้านอุปกรณ์ศิลปะ", emoji: "🎨" },
      { id: "gallery", name: "แกลเลอรี", emoji: "🖼️" },
    ],
  },
  {
    id: "sports-health",
    name: "กีฬาและสุขภาพ",
    emoji: "⚽",
    categories: [
      { id: "sports-equipment", name: "ร้านอุปกรณ์กีฬา", emoji: "⚽" },
      { id: "gym", name: "ฟิตเนส/ยิม", emoji: "🏋️" },
      { id: "badminton-court", name: "สนามแบดมินตัน", emoji: "🏸" },
      { id: "football-field", name: "สนามฟุตบอล", emoji: "⚽" },
      { id: "basketball-court", name: "สนามบาสเกตบอล", emoji: "🏀" },
      { id: "swimming-pool", name: "สระว่ายน้ำ", emoji: "🏊" },
      { id: "swimming-school", name: "โรงเรียนสอนว่ายน้ำ", emoji: "🏊‍♂️" },
      { id: "yoga-pilates", name: "สตูดิโอโยคะ/พิลาทิส", emoji: "🧘" },
      { id: "physiotherapy", name: "คลินิกกายภาพบำบัด", emoji: "💪" },
      { id: "fishing", name: "ตกปลา", emoji: "🎣" },
    ],
  },
  {
    id: "fashion",
    name: "แฟชั่น",
    emoji: "👗",
    categories: [
      { id: "clothing", name: "ร้านเสื้อผ้า", emoji: "👕" },
      { id: "secondhand-clothes", name: "ร้านเสื้อผ้ามือสอง", emoji: "👚" },
      { id: "shoes", name: "ร้านรองเท้า", emoji: "👟" },
      { id: "accessories", name: "ร้านเครื่องประดับ", emoji: "💍" },
      { id: "tailor", name: "ร้านตัดเย็บ", emoji: "🧵" },
      { id: "online-fashion", name: "ร้านแฟชั่นออนไลน์", emoji: "📱" },
      { id: "vintage", name: "ร้านวินเทจ", emoji: "🎩" },
    ],
  },
  {
    id: "it-electronics",
    name: "IT และอิเล็กทรอนิกส์",
    emoji: "💻",
    categories: [
      { id: "computer-shop", name: "ร้านคอมพิวเตอร์", emoji: "💻" },
      { id: "it-equipment", name: "ร้านอุปกรณ์ไอที", emoji: "🖥️" },
      { id: "mobile-shop", name: "ร้านมือถือ", emoji: "📱" },
      { id: "phone-repair", name: "ร้านซ่อมโทรศัพท์", emoji: "🔧" },
      { id: "gadget-shop", name: "ร้านขายแกดเจ็ต", emoji: "🎮" },
      { id: "game-shop", name: "ร้านเกม", emoji: "🕹️" },
      { id: "internet-cafe", name: "Internet Cafe", emoji: "🌐" },
    ],
  },
  {
    id: "home-garden",
    name: "บ้านและสวน",
    emoji: "🏠",
    categories: [
      { id: "furniture", name: "ร้านเฟอร์นิเจอร์", emoji: "🛋️" },
      { id: "home-decor", name: "ร้านของแต่งบ้าน", emoji: "🏠" },
      { id: "kitchenware", name: "ร้านเครื่องครัว", emoji: "🍳" },
      { id: "construction", name: "ร้านวัสดุก่อสร้าง", emoji: "🧱" },
      { id: "plants-garden", name: "ร้านต้นไม้/สวน", emoji: "🌱" },
      { id: "home-repair", name: "ร้านซ่อมบ้าน", emoji: "🔨" },
      { id: "appliances", name: "ร้านเครื่องใช้ไฟฟ้า", emoji: "🔌" },
    ],
  },
  {
    id: "vehicles-travel",
    name: "ยานพาหนะและการเดินทาง",
    emoji: "🚗",
    categories: [
      { id: "car-repair", name: "ร้านซ่อมรถ", emoji: "🔧" },
      { id: "car-accessories", name: "ร้านแต่งรถ", emoji: "🚗" },
      { id: "car-parts", name: "ร้านอะไหล่รถ", emoji: "⚙️" },
      { id: "car-wash", name: "ร้านล้างรถ", emoji: "🚿" },
      { id: "bicycle-shop", name: "ร้านจักรยาน", emoji: "🚲" },
      { id: "car-rental", name: "ร้านเช่ารถ", emoji: "🚙" },
      { id: "travel-gear", name: "ร้านอุปกรณ์เดินทาง", emoji: "🧳" },
    ],
  },
  {
    id: "health-beauty",
    name: "สุขภาพและความงาม",
    emoji: "💄",
    categories: [
      { id: "pharmacy", name: "ร้านขายยา", emoji: "💊" },
      { id: "clinic", name: "คลินิก", emoji: "🏥" },
      { id: "spa", name: "ร้านสปา", emoji: "🧖" },
      { id: "massage", name: "ร้านนวด", emoji: "💆" },
      { id: "beauty-shop", name: "ร้านเสริมความงาม", emoji: "💅" },
      { id: "salon", name: "ร้านตัดผม/ซาลอน", emoji: "💇" },
      { id: "health-products", name: "ร้านผลิตภัณฑ์สุขภาพ", emoji: "🌿" },
    ],
  },
  {
    id: "business-services",
    name: "ธุรกิจและบริการ",
    emoji: "💼",
    categories: [
      { id: "accounting", name: "สำนักงานบัญชี", emoji: "📊" },
      { id: "business-consulting", name: "ที่ปรึกษาธุรกิจ", emoji: "💼" },
      { id: "coworking", name: "Co-working space", emoji: "🏢" },
      { id: "photo-studio", name: "สตูดิโอถ่ายภาพ", emoji: "📷" },
      { id: "marketing-agency", name: "บริษัทรับทำการตลาด", emoji: "📈" },
      { id: "content-agency", name: "บริษัทรับทำคอนเทนต์", emoji: "✍️" },
      { id: "web-app-dev", name: "บริษัทพัฒนาเว็บไซต์/แอป", emoji: "🌐" },
    ],
  },
];

// Flatten all categories for easy access
export const SHOP_CATEGORIES: ShopCategory[] = SHOP_CATEGORY_GROUPS.flatMap(
  (group) => group.categories
);

export const getShopCategoryById = (categoryId: string): ShopCategory | undefined => {
  return SHOP_CATEGORIES.find((cat) => cat.id === categoryId);
};

export const getShopCategoryGroupById = (groupId: string): ShopCategoryGroup | undefined => {
  return SHOP_CATEGORY_GROUPS.find((group) => group.id === groupId);
};
