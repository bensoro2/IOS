export type CustomColors = Record<string, string>; // token -> "H S% L%"

export interface ThemeTokenDef {
  token: string;
  label: string;
  group: string;
}

// Tokens that users can customize
export const THEME_TOKENS: ThemeTokenDef[] = [
  { token: "background", label: "พื้นหลังแอป", group: "พื้นหลัง" },
  { token: "foreground", label: "ตัวอักษรหลัก", group: "พื้นหลัง" },
  { token: "card", label: "พื้นหลังการ์ด", group: "การ์ด" },
  { token: "card-foreground", label: "ตัวอักษรในการ์ด", group: "การ์ด" },
  { token: "popover", label: "พื้นหลังป๊อปอัพ", group: "การ์ด" },
  { token: "popover-foreground", label: "ตัวอักษรในป๊อปอัพ", group: "การ์ด" },
  { token: "primary", label: "สีหลัก (ปุ่ม/ไอคอน)", group: "สีหลัก" },
  { token: "primary-foreground", label: "ตัวอักษรบนสีหลัก", group: "สีหลัก" },
  { token: "secondary", label: "สีรอง", group: "สีหลัก" },
  { token: "secondary-foreground", label: "ตัวอักษรบนสีรอง", group: "สีหลัก" },
  { token: "accent", label: "สีเน้น (hover)", group: "สีหลัก" },
  { token: "accent-foreground", label: "ตัวอักษรบนสีเน้น", group: "สีหลัก" },
  { token: "muted", label: "พื้นหลังจาง", group: "ส่วนเสริม" },
  { token: "muted-foreground", label: "ตัวอักษรจาง", group: "ส่วนเสริม" },
  { token: "border", label: "เส้นขอบ", group: "ส่วนเสริม" },
  { token: "input", label: "ขอบช่องกรอก", group: "ส่วนเสริม" },
  { token: "ring", label: "เส้นโฟกัส", group: "ส่วนเสริม" },
  { token: "destructive", label: "สีเตือน/ลบ", group: "ส่วนเสริม" },
  { token: "destructive-foreground", label: "ตัวอักษรบนสีเตือน", group: "ส่วนเสริม" },
];

// Sidebar tokens follow the main ones so they stay consistent
export const SIDEBAR_MIRROR: Record<string, string> = {
  "sidebar-background": "background",
  "sidebar-foreground": "foreground",
  "sidebar-primary": "primary",
  "sidebar-primary-foreground": "primary-foreground",
  "sidebar-accent": "accent",
  "sidebar-accent-foreground": "accent-foreground",
  "sidebar-border": "border",
  "sidebar-ring": "ring",
};

export const CUSTOM_THEME_KEY = "app-theme-custom";

export function hexToHslString(hex: string): string {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let hue = 0;
  const l = (max + min) / 2;
  const d = max - min;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r:
        hue = ((g - b) / d) % 6;
        break;
      case g:
        hue = (b - r) / d + 2;
        break;
      default:
        hue = (r - g) / d + 4;
    }
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  return `${Math.round(hue)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function hslStringToHex(hsl: string): string {
  const m = hsl.trim().match(/^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/);
  if (!m) return "#000000";
  const h = parseFloat(m[1]);
  const s = parseFloat(m[2]) / 100;
  const l = parseFloat(m[3]) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const mm = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const to = (v: number) => Math.round((v + mm) * 255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

export const DEFAULT_CUSTOM_COLORS: CustomColors = {
  background: "0 0% 100%",
  foreground: "260 30% 15%",
  card: "0 0% 100%",
  "card-foreground": "260 30% 15%",
  popover: "0 0% 100%",
  "popover-foreground": "260 30% 15%",
  primary: "262 83% 58%",
  "primary-foreground": "0 0% 100%",
  secondary: "262 30% 96%",
  "secondary-foreground": "262 83% 58%",
  accent: "262 30% 96%",
  "accent-foreground": "262 83% 58%",
  muted: "262 20% 96%",
  "muted-foreground": "260 10% 50%",
  border: "262 20% 90%",
  input: "262 20% 90%",
  ring: "262 83% 58%",
  destructive: "0 84% 60%",
  "destructive-foreground": "0 0% 98%",
};

export function readCustomColors(): CustomColors {
  try {
    const raw = localStorage.getItem(CUSTOM_THEME_KEY);
    if (!raw) return { ...DEFAULT_CUSTOM_COLORS };
    return { ...DEFAULT_CUSTOM_COLORS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_CUSTOM_COLORS };
  }
}
