/**
 * Ability Hexagon — 6 core stats derived from the activities a user checks in to.
 *
 * STRENGTH   — power / muscle work
 * AGILITY    — speed, reflex, coordination
 * ENDURANCE  — stamina, long effort, resilience
 * MIND       — focus, logic, learning, calm
 * SOCIAL     — group / people interaction
 * CREATIVITY — art, expression, making things
 *
 * AUTO-ASSIGN RULE (for activities added later to the DB):
 * 1. Exact match in ACTIVITY_STAT_MAP (curated list below) → use it.
 * 2. Otherwise keyword rules (TH + EN, on id and names) are matched.
 * 3. Otherwise fall back to the parent category profile.
 * So any brand new activity key always resolves to a valid stat weighting
 * without extra configuration.
 */

export const ABILITY_STATS = [
  "STRENGTH",
  "AGILITY",
  "ENDURANCE",
  "MIND",
  "SOCIAL",
  "CREATIVITY",
] as const;

export type AbilityStat = (typeof ABILITY_STATS)[number];

export type StatWeights = Partial<Record<AbilityStat, number>>;

export const ABILITY_STAT_LABELS: Record<AbilityStat, { th: string; short: string }> = {
  STRENGTH: { th: "พละกำลัง", short: "STR" },
  AGILITY: { th: "ความคล่องแคล่ว", short: "AGI" },
  ENDURANCE: { th: "ความอึด", short: "END" },
  MIND: { th: "จิตใจ / สมาธิ", short: "MND" },
  SOCIAL: { th: "สังคม", short: "SOC" },
  CREATIVITY: { th: "ความคิดสร้างสรรค์", short: "CRE" },
};

/** Curated weights for known activity keys (values are relative, 0–3). */
export const ACTIVITY_STAT_MAP: Record<string, StatWeights> = {
  // ── Sports ────────────────────────────────────────────────────────────────
  basketball: { AGILITY: 3, ENDURANCE: 2, SOCIAL: 2, STRENGTH: 1 },
  football: { ENDURANCE: 3, AGILITY: 2, SOCIAL: 2, STRENGTH: 1 },
  volleyball: { AGILITY: 3, SOCIAL: 2, STRENGTH: 1, ENDURANCE: 1 },
  golf: { MIND: 3, AGILITY: 1, SOCIAL: 2, ENDURANCE: 1 },
  badminton: { AGILITY: 3, ENDURANCE: 2, SOCIAL: 1 },
  tennis: { AGILITY: 3, ENDURANCE: 2, STRENGTH: 1, SOCIAL: 1 },
  "table-tennis": { AGILITY: 3, MIND: 2, SOCIAL: 1 },
  swimming: { ENDURANCE: 3, STRENGTH: 2, AGILITY: 1 },
  running: { ENDURANCE: 3, AGILITY: 1, MIND: 1 },
  fitness: { STRENGTH: 3, ENDURANCE: 2, MIND: 1 },
  yoga: { MIND: 3, ENDURANCE: 1, AGILITY: 2 },
  climbing: { STRENGTH: 3, ENDURANCE: 2, MIND: 1, AGILITY: 1 },
  cycling: { ENDURANCE: 3, STRENGTH: 1, AGILITY: 1 },
  "martial-arts": { STRENGTH: 3, AGILITY: 2, ENDURANCE: 2, MIND: 1 },
  chess: { MIND: 3, SOCIAL: 1 },
  archery: { MIND: 3, STRENGTH: 1, AGILITY: 1 },
  skydiving: { MIND: 3, AGILITY: 2, ENDURANCE: 1 },
  racing: { AGILITY: 3, MIND: 2 },
  shooting: { MIND: 3, AGILITY: 1, STRENGTH: 1 },
  "horse-riding": { AGILITY: 2, STRENGTH: 1, ENDURANCE: 2, MIND: 1 },
  "ice-bath": { ENDURANCE: 3, MIND: 3 },
  bowling: { AGILITY: 2, SOCIAL: 2, STRENGTH: 1 },
  skateboarding: { AGILITY: 3, ENDURANCE: 1, CREATIVITY: 1 },
  surfing: { AGILITY: 3, ENDURANCE: 2, STRENGTH: 1 },
  skiing: { AGILITY: 3, ENDURANCE: 2, STRENGTH: 1 },
  rugby: { STRENGTH: 3, ENDURANCE: 2, SOCIAL: 2 },
  judo: { STRENGTH: 3, AGILITY: 2, MIND: 1 },

  // ── Arts & music ──────────────────────────────────────────────────────────
  dancing: { AGILITY: 3, CREATIVITY: 2, ENDURANCE: 1, SOCIAL: 1 },
  guitar: { CREATIVITY: 3, MIND: 1, AGILITY: 1 },
  piano: { CREATIVITY: 3, MIND: 2, AGILITY: 1 },
  "bass-drums": { CREATIVITY: 3, AGILITY: 2, ENDURANCE: 1 },
  singing: { CREATIVITY: 3, SOCIAL: 2, ENDURANCE: 1 },
  "music-production": { CREATIVITY: 3, MIND: 2 },
  painting: { CREATIVITY: 3, MIND: 1 },
  acting: { CREATIVITY: 3, SOCIAL: 3 },
  writing: { CREATIVITY: 3, MIND: 2 },
  pottery: { CREATIVITY: 3, MIND: 1, STRENGTH: 1 },

  // ── Outdoor ───────────────────────────────────────────────────────────────
  hiking: { ENDURANCE: 3, STRENGTH: 1, MIND: 1 },
  camping: { ENDURANCE: 2, SOCIAL: 2, MIND: 1 },
  "mountain-climbing": { ENDURANCE: 3, STRENGTH: 2, MIND: 1 },
  diving: { ENDURANCE: 2, MIND: 2, AGILITY: 1 },
  fishing: { MIND: 3, ENDURANCE: 1, SOCIAL: 1 },
  kayaking: { STRENGTH: 2, ENDURANCE: 3, AGILITY: 1 },
  birdwatching: { MIND: 3, ENDURANCE: 1 },

  // ── Hobbies ───────────────────────────────────────────────────────────────
  cooking: { CREATIVITY: 3, MIND: 1, SOCIAL: 1 },
  photography: { CREATIVITY: 3, MIND: 1, ENDURANCE: 1 },
  reading: { MIND: 3, CREATIVITY: 1 },
  meditation: { MIND: 3, ENDURANCE: 1 },
  "merit-making": { MIND: 3, SOCIAL: 2 },
  gaming: { MIND: 2, AGILITY: 2, SOCIAL: 1 },
  "board-game": { MIND: 3, SOCIAL: 2 },
  "card-game": { MIND: 3, SOCIAL: 2 },
  coding: { MIND: 3, CREATIVITY: 2 },
  gardening: { ENDURANCE: 2, MIND: 2, CREATIVITY: 1 },
  movies: { MIND: 1, CREATIVITY: 2, SOCIAL: 1 },
  karaoke: { SOCIAL: 3, CREATIVITY: 2 },
  traveling: { ENDURANCE: 2, SOCIAL: 2, CREATIVITY: 1, MIND: 1 },
  "language-learning": { MIND: 3, SOCIAL: 2 },
  crafts: { CREATIVITY: 3, MIND: 1 },
  "cafe-hopping": { SOCIAL: 3, CREATIVITY: 1 },
  drinking: { SOCIAL: 3, ENDURANCE: 1 },
  party: { SOCIAL: 3, ENDURANCE: 1, CREATIVITY: 1 },
};

/** Keyword rules used to auto-classify activities that are not in the map. */
const KEYWORD_RULES: { keywords: string[]; weights: StatWeights }[] = [
  { keywords: ["gym", "weight", "lift", "muscle", "power", "เวท", "ยกน้ำหนัก", "ฟิตเนส", "กล้าม"], weights: { STRENGTH: 3, ENDURANCE: 1 } },
  { keywords: ["box", "fight", "martial", "wrestl", "มวย", "ต่อสู้", "ป้องกันตัว"], weights: { STRENGTH: 3, AGILITY: 2, ENDURANCE: 1 } },
  { keywords: ["run", "marathon", "cycl", "bike", "swim", "row", "trek", "hik", "วิ่ง", "ปั่น", "ว่ายน้ำ", "เดินป่า", "พาย"], weights: { ENDURANCE: 3, AGILITY: 1 } },
  { keywords: ["dance", "skate", "surf", "ski", "jump", "parkour", "เต้น", "สเก็ต", "โต้คลื่น", "กระโดด"], weights: { AGILITY: 3, ENDURANCE: 1, CREATIVITY: 1 } },
  { keywords: ["ball", "tennis", "sport", "match", "league", "บอล", "กีฬา", "แข่ง"], weights: { AGILITY: 2, ENDURANCE: 2, SOCIAL: 2 } },
  { keywords: ["music", "sing", "guitar", "piano", "drum", "band", "ดนตรี", "ร้องเพลง", "กีตาร์", "เปียโน", "กลอง"], weights: { CREATIVITY: 3, MIND: 1 } },
  { keywords: ["art", "draw", "paint", "design", "craft", "photo", "film", "write", "ศิลปะ", "วาด", "ออกแบบ", "งานฝีมือ", "ถ่ายภาพ", "เขียน"], weights: { CREATIVITY: 3, MIND: 1 } },
  { keywords: ["cook", "bak", "food", "ทำอาหาร", "ขนม", "เบเกอรี่"], weights: { CREATIVITY: 3, SOCIAL: 1 } },
  { keywords: ["read", "study", "learn", "language", "code", "program", "chess", "puzzle", "meditat", "อ่าน", "เรียน", "ภาษา", "โค้ด", "หมาก", "สมาธิ", "ปริศนา"], weights: { MIND: 3, CREATIVITY: 1 } },
  { keywords: ["party", "meet", "club", "bar", "cafe", "karaoke", "volunteer", "social", "ปาร์ตี้", "สังสรรค์", "คาเฟ่", "คาราโอเกะ", "จิตอาสา", "พบปะ"], weights: { SOCIAL: 3, ENDURANCE: 1 } },
  { keywords: ["game", "esport", "board", "card", "เกม", "บอร์ดเกม", "การ์ด"], weights: { MIND: 2, AGILITY: 2, SOCIAL: 1 } },
  { keywords: ["camp", "travel", "nature", "fish", "garden", "outdoor", "แคมป์", "เที่ยว", "ธรรมชาติ", "ตกปลา", "สวน"], weights: { ENDURANCE: 2, MIND: 2, SOCIAL: 1 } },
];

/** Default profile per parent category, used as last resort. */
const PARENT_DEFAULTS: Record<string, StatWeights> = {
  sports: { STRENGTH: 2, AGILITY: 2, ENDURANCE: 2 },
  "arts-music": { CREATIVITY: 3, MIND: 1 },
  outdoor: { ENDURANCE: 3, MIND: 1 },
  hobbies: { MIND: 2, CREATIVITY: 2, SOCIAL: 1 },
};

const GENERIC_DEFAULT: StatWeights = { MIND: 1, SOCIAL: 1, ENDURANCE: 1 };

/**
 * Resolve stat weights for an activity key.
 * @param key       activity (sub-category) key, e.g. "basketball"
 * @param parentKey parent category key, e.g. "sports"
 * @param names     any localized names available (helps keyword matching)
 */
export function getStatWeights(
  key: string,
  parentKey?: string,
  names: string[] = []
): StatWeights {
  const normalized = key.replace(/_/g, "-").toLowerCase();
  const curated = ACTIVITY_STAT_MAP[normalized];
  if (curated) return curated;

  const haystack = [normalized, ...names].join(" ").toLowerCase();
  const matched: StatWeights = {};
  let found = false;
  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((k) => haystack.includes(k))) {
      found = true;
      for (const [stat, w] of Object.entries(rule.weights)) {
        matched[stat as AbilityStat] = Math.max(matched[stat as AbilityStat] ?? 0, w as number);
      }
    }
  }
  if (found) return matched;

  return (parentKey && PARENT_DEFAULTS[parentKey]) || GENERIC_DEFAULT;
}

export interface AbilityInput {
  category: string;
  parentKey?: string;
  names?: string[];
  /** total accumulated EXP for that activity */
  totalExp: number;
}

export interface AbilityScore {
  stat: AbilityStat;
  /** raw weighted points */
  points: number;
  /** 0–100 value for the radar chart */
  value: number;
  /** stat level derived from points */
  level: number;
}

/** Points needed per stat level (grows a bit each level). */
const STAT_LEVEL_BASE = 150;

export function computeAbilityScores(items: AbilityInput[]): AbilityScore[] {
  const totals: Record<AbilityStat, number> = {
    STRENGTH: 0,
    AGILITY: 0,
    ENDURANCE: 0,
    MIND: 0,
    SOCIAL: 0,
    CREATIVITY: 0,
  };

  for (const item of items) {
    const weights = getStatWeights(item.category, item.parentKey, item.names);
    const sum = Object.values(weights).reduce((a, b) => a + (b ?? 0), 0) || 1;
    for (const [stat, w] of Object.entries(weights)) {
      totals[stat as AbilityStat] += (item.totalExp * (w as number)) / sum;
    }
  }

  const max = Math.max(...Object.values(totals), 1);

  return ABILITY_STATS.map((stat) => {
    const points = totals[stat];
    return {
      stat,
      points: Math.round(points),
      value: Math.round((points / max) * 100),
      level: Math.floor(points / STAT_LEVEL_BASE),
    };
  });
}
