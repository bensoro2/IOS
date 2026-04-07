// ─── App ───────────────────────────────────────────────────────────────────────
export const APP_NAME = "Levelon";
export const APP_SCHEME = "com.levelon.app";

// ─── EXP / Level ──────────────────────────────────────────────────────────────
export const EXP_PER_CHECKIN = 10;
export const EXP_PER_LEVEL = 50;
export const MAX_FAST_CHECKINS_PER_DAY = 2;

// ─── File limits ──────────────────────────────────────────────────────────────
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const UPLOAD_CACHE_CONTROL = "3600";

// ─── Profile field limits ─────────────────────────────────────────────────────
export const MAX_NAME_LENGTH = 15;
export const MAX_BIO_SHORT_LENGTH = 50;
export const MAX_BIO_LENGTH = 200;
export const MAX_REPORT_LENGTH = 500;

// ─── Pagination / fetch limits ────────────────────────────────────────────────
export const TRENDING_REELS_LIMIT = 12;
export const SEARCH_REELS_LIMIT = 20;
export const SEARCH_MUSIC_LIMIT = 10;
export const SEARCH_SUGGESTIONS_LIMIT = 3;
export const COMMENTS_LIMIT = 100;
export const RECENT_LIKERS_LIMIT = 5;
export const NOTIFICATIONS_LIMIT = 50;
export const MESSAGES_LOAD_LIMIT = 200;

// ─── Timing (ms) ─────────────────────────────────────────────────────────────
export const SEARCH_DEBOUNCE_MS = 400;
export const SUGGESTION_BLUR_DELAY_MS = 150;
export const CHAT_POLL_INTERVAL_MS = 3000;
export const CHAT_POLL_MAX_MS = 15000;
export const SCROLL_TO_BOTTOM_DELAY_MS = 100;
export const AUTH_TIMEOUT_MS = 10000;
export const LONG_PRESS_MS = 500;
export const CATEGORY_CHANGE_DELAY_MS = 500;
export const AUDIO_SLICE_INTERVAL_MS = 100;
export const AUDIO_DURATION_INTERVAL_MS = 1000;

// ─── Storage buckets ──────────────────────────────────────────────────────────
export const BUCKET_AVATARS = "avatars";
export const BUCKET_CHAT_MEDIA = "chat-media";
export const BUCKET_ACTIVITY_IMAGES = "activity-images";
export const BUCKET_REEL_VIDEOS = "reel-videos";

// ─── LocalStorage / cookie keys ───────────────────────────────────────────────
export const KEY_SEARCH_HISTORY = "reel_search_history";
export const KEY_NOTIFICATIONS_ENABLED = "notifications_enabled";

// ─── User status values ───────────────────────────────────────────────────────
export const USER_STATUS_ACTIVE = "active";
export const USER_STATUS_SUSPENDED = "suspended";
