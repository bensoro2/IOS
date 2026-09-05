import { useState, useRef, useEffect } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

interface UserRow {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export const UserSearchBar = () => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const q = search.trim();
    if (!q) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      const { data } = await (supabase as any)
        .from("users")
        .select("id, display_name, avatar_url")
        .ilike("display_name", `%${q}%`)
        .limit(20);
      if (!cancelled) {
        setResults((data as UserRow[]) || []);
        setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search]);

  const handleSelect = (userId: string) => {
    setOpen(false);
    setSearch("");
    navigate(`/user/${userId}`);
  };

  const placeholder = t("search.usersPlaceholder") || "ค้นหาผู้ใช้...";

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full h-10 pl-10 pr-10 rounded-md border border-border bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {search && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={() => { setSearch(""); inputRef.current?.focus(); }}
            type="button"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
      </div>

      {open && search.trim() && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg overflow-hidden">
          <div className="max-h-72 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : results.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                {t("search.noUsersFound") || "ไม่พบผู้ใช้"}
              </p>
            ) : (
              results.map((u) => (
                <button
                  key={u.id}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(u.id)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left"
                >
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-muted" />
                  )}
                  <span className="flex-1 text-sm font-medium truncate">
                    {u.display_name || "—"}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
