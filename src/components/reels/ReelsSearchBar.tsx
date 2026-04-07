import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const ReelsSearchBar = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <button
      onClick={() => navigate("/reels/search")}
      className="flex items-center gap-2 h-9 px-3 rounded-full bg-white/10 text-white/50 text-sm flex-1 hover:bg-white/15 transition-colors"
    >
      <Search className="w-4 h-4 flex-shrink-0" />
      <span className="truncate">{t("reelsSearch.placeholder")}</span>
    </button>
  );
};
