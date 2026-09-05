import { useEffect, useMemo, useState } from "react";
import { HexColorPicker } from "react-colorful";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import {
  THEME_TOKENS,
  CustomColors,
  DEFAULT_CUSTOM_COLORS,
  hexToHslString,
  hslStringToHex,
} from "@/lib/themeColors";
import { toast } from "sonner";
import { RotateCcw, Save } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

const PRESET_KEY = "levelon-theme-presets";
const PRESET_COUNT = 5;

type Preset = CustomColors | null;

const loadPresets = (): Preset[] => {
  try {
    const raw = localStorage.getItem(PRESET_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.from({ length: PRESET_COUNT }, (_, i) => arr?.[i] ?? null);
  } catch {
    return Array.from({ length: PRESET_COUNT }, () => null);
  }
};

const CustomThemeDialog = ({ open, onOpenChange, onSaved }: Props) => {
  const { customColors, saveCustomColors, setTheme } = useTheme();
  const [draft, setDraft] = useState<CustomColors>(customColors);
  const [selected, setSelected] = useState<string>(THEME_TOKENS[0].token);
  const [presets, setPresets] = useState<Preset[]>(loadPresets);

  useEffect(() => {
    if (open) {
      setDraft(customColors);
      setSelected(THEME_TOKENS[0].token);
      setPresets(loadPresets());
    }
  }, [open, customColors]);

  const persistPresets = (next: Preset[]) => {
    setPresets(next);
    try {
      localStorage.setItem(PRESET_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const savePreset = (index: number) => {
    const next = [...presets];
    next[index] = { ...draft };
    persistPresets(next);
    toast.success(`บันทึกลงช่อง ${index + 1} แล้ว`);
  };

  const loadPreset = (index: number) => {
    const p = presets[index];
    if (!p) {
      savePreset(index);
      return;
    }
    setDraft({ ...DEFAULT_CUSTOM_COLORS, ...p });
    toast.success(`เรียกใช้ช่อง ${index + 1} แล้ว`);
  };


  const groups = useMemo(() => {
    const map: Record<string, typeof THEME_TOKENS> = {};
    THEME_TOKENS.forEach((t) => {
      map[t.group] = map[t.group] || [];
      map[t.group].push(t);
    });
    return map;
  }, []);

  const selectedDef = THEME_TOKENS.find((t) => t.token === selected)!;
  const selectedHex = hslStringToHex(draft[selected] || DEFAULT_CUSTOM_COLORS[selected]);

  const setColor = (hex: string) => {
    setDraft((d) => ({ ...d, [selected]: hexToHslString(hex) }));
  };

  const handleSave = () => {
    saveCustomColors(draft);
    setTheme("custom");
    toast.success("บันทึกธีมของคุณแล้ว");
    onOpenChange(false);
    onSaved?.();
  };

  // Soft ring on preview parts that use the selected token
  const hl = (...tokens: string[]) =>
    tokens.includes(selected)
      ? {
          boxShadow: "0 0 0 2px hsl(262 83% 58%)",
          borderRadius: "8px",
        }
      : {};

  const c = (token: string) => `hsl(${draft[token] || DEFAULT_CUSTOM_COLORS[token]})`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[88vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-5 py-4 border-b border-border">
          <DialogTitle className="text-base">ธีมของฉัน (Custom)</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-[132px_1fr] sm:grid-cols-[168px_1fr]">
          {/* Sidebar: flat token list grouped by section */}
          <aside className="border-r border-border bg-muted/30 p-3 space-y-5">
            {Object.entries(groups).map(([group, tokens]) => (
              <section key={group}>
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-1.5">
                  {group}
                </h3>
                <div className="space-y-0.5">
                  {tokens.map((t) => {
                    const active = selected === t.token;
                    return (
                      <button
                        key={t.token}
                        onClick={() => setSelected(t.token)}
                        className={cn(
                          "w-full flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] transition-colors",
                          active
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-background"
                        )}
                      >
                        <span className="truncate">{t.label}</span>
                        <span
                          className="w-3 h-3 rounded-full border border-border shrink-0"
                          style={{ background: c(t.token) }}
                        />
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </aside>

          {/* Editor + focused preview */}
          <div className="p-4 sm:p-5 space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Picker */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-medium">{selectedDef.label}</h4>
                    <p className="text-[10px] text-muted-foreground font-mono">--{selectedDef.token}</p>
                  </div>
                  <button
                    onClick={() => setDraft({ ...DEFAULT_CUSTOM_COLORS })}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors shrink-0"
                  >
                    <RotateCcw className="w-3 h-3" /> คืนค่า
                  </button>
                </div>

                <HexColorPicker color={selectedHex} onChange={setColor} className="!w-full" />

                <div className="relative">
                  <Input
                    value={selectedHex.toUpperCase()}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (/^#?[0-9a-fA-F]{6}$/.test(v)) setColor(v.startsWith("#") ? v : `#${v}`);
                    }}
                    className="h-9 text-xs font-mono pr-9"
                  />
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-sm border border-border"
                    style={{ background: selectedHex }}
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-3">
                <div className="relative rounded-2xl border-2 border-dashed border-primary/30 p-3 bg-muted/30">
                  <span className="absolute -top-2 left-3 px-1.5 bg-background text-[9px] font-semibold text-primary">
                    กำลังปรับแต่ง: {selectedDef.label}
                  </span>

                  <div
                    className="rounded-xl overflow-hidden border text-[10px]"
                    style={{
                      background: c("background"),
                      borderColor: c("border"),
                      color: c("foreground"),
                      ...hl("background", "foreground"),
                    }}
                  >
                    <div
                      className="flex items-center justify-between px-2.5 py-2"
                      style={{ borderBottom: `1px solid ${c("border")}` }}
                    >
                      <span className="font-semibold" style={{ color: c("primary"), ...hl("primary") }}>
                        Levelon
                      </span>
                      <span className="w-4 h-4 rounded-full" style={{ background: c("muted"), ...hl("muted") }} />
                    </div>
                    <div className="p-2.5 space-y-2">
                      <div
                        className="rounded-md px-2 py-1"
                        style={{
                          border: `1px solid ${c("input")}`,
                          color: c("muted-foreground"),
                          ...hl("input", "muted-foreground"),
                        }}
                      >
                        ค้นหา...
                      </div>
                      <div
                        className="rounded-lg p-2 space-y-1.5"
                        style={{
                          background: c("card"),
                          color: c("card-foreground"),
                          border: `1px solid ${c("border")}`,
                          ...hl("card", "card-foreground", "border"),
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full" style={{ background: c("accent"), ...hl("accent") }} />
                          <div className="flex-1">
                            <p className="font-medium">ชื่อกิจกรรม</p>
                            <p style={{ color: c("muted-foreground") }}>รายละเอียดสั้นๆ</p>
                          </div>
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                          <span
                            className="rounded-md px-2 py-1"
                            style={{
                              background: c("primary"),
                              color: c("primary-foreground"),
                              ...hl("primary", "primary-foreground"),
                            }}
                          >
                            เข้าร่วม
                          </span>
                          <span
                            className="rounded-md px-2 py-1"
                            style={{
                              background: c("secondary"),
                              color: c("secondary-foreground"),
                              ...hl("secondary", "secondary-foreground"),
                            }}
                          >
                            รายละเอียด
                          </span>
                          <span
                            className="rounded-md px-2 py-1"
                            style={{
                              background: c("destructive"),
                              color: c("destructive-foreground"),
                              ...hl("destructive", "destructive-foreground"),
                            }}
                          >
                            ลบ
                          </span>
                        </div>
                      </div>
                    </div>
                    <div
                      className="flex items-center justify-around py-1.5"
                      style={{ borderTop: `1px solid ${c("border")}`, background: c("card") }}
                    >
                      <span style={{ color: c("primary") }}>หน้าแรก</span>
                      <span style={{ color: c("muted-foreground") }}>ค้นหา</span>
                      <span style={{ color: c("muted-foreground") }}>โปรไฟล์</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-border p-2 space-y-1">
                    <p className="text-[9px] text-muted-foreground">ป๊อปอัพ / เมนู</p>
                    <div
                      className="rounded-md px-1.5 py-1 text-[9px]"
                      style={{
                        background: c("popover"),
                        color: c("popover-foreground"),
                        ...hl("popover", "popover-foreground"),
                      }}
                    >
                      เมนูหลัก
                    </div>
                    <div
                      className="rounded-md px-1.5 py-1 text-[9px]"
                      style={{
                        background: c("accent"),
                        color: c("accent-foreground"),
                        ...hl("accent", "accent-foreground"),
                      }}
                    >
                      รายการที่ชี้อยู่
                    </div>
                  </div>

                  <div className="rounded-xl border border-border p-2 space-y-1">
                    <p className="text-[9px] text-muted-foreground">ฟอร์ม</p>
                    <div
                      className="rounded-md px-1.5 py-1 text-[9px]"
                      style={{ border: `1px solid ${c("input")}`, color: c("foreground"), ...hl("input") }}
                    >
                      ช่องกรอก
                    </div>
                    <div
                      className="rounded-md px-1.5 py-1 text-[9px]"
                      style={{
                        border: `1px solid ${c("ring")}`,
                        boxShadow: `0 0 0 2px ${c("ring")}`,
                        color: c("foreground"),
                      }}
                    >
                      กำลังโฟกัส
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border space-y-3">
          <div>
            <p className="text-[10px] text-muted-foreground mb-1.5">
              พรีเซ็ตของฉัน — แตะเพื่อเรียกใช้ / กดไอคอนบันทึกเพื่อเก็บค่าปัจจุบัน
            </p>
            <div className="grid grid-cols-5 gap-2">
              {presets.map((p, i) => (
                <div
                  key={i}
                  className={cn(
                    "relative rounded-xl border p-1.5 flex flex-col items-center gap-1",
                    p ? "border-primary/40" : "border-dashed border-border"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => loadPreset(i)}
                    className="w-full flex flex-col items-center gap-1"
                    title={p ? `เรียกใช้พรีเซ็ต ${i + 1}` : `ช่องว่าง ${i + 1}`}
                  >
                    <span className="flex gap-0.5">
                      {["background", "primary", "accent"].map((t) => (
                        <span
                          key={t}
                          className="w-2.5 h-2.5 rounded-full border border-border"
                          style={{
                            background: p
                              ? `hsl(${p[t] || DEFAULT_CUSTOM_COLORS[t]})`
                              : "transparent",
                          }}
                        />
                      ))}
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      {p ? `ช่อง ${i + 1}` : "ว่าง"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => savePreset(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow"
                    title={`บันทึกลงช่อง ${i + 1}`}
                  >
                    <Save className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleSave} className="w-full">
            บันทึกธีม
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
};

export default CustomThemeDialog;
