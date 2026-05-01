import { useNavigate, useLocation } from "react-router-dom";
import { Home, MessageSquare, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface BottomNavProps {
  onHomeClick?: () => void;
}

export const BottomNav = ({ onHomeClick }: BottomNavProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const { t } = useLanguage();

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  const handleHomeClick = () => {
    if (currentPath === "/" && onHomeClick) {
      onHomeClick();
    } else {
      navigate("/");
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-2 pt-2 z-50 safe-bottom">
      <div className="flex items-center justify-around">
        <button
          onClick={handleHomeClick}
          className={`flex flex-col items-center gap-0.5 py-1 flex-1 ${isActive("/") ? "text-primary" : "text-muted-foreground"}`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] leading-tight truncate">{t("nav.home")}</span>
        </button>
        <button
          onClick={() => navigate("/messages")}
          className={`flex flex-col items-center gap-0.5 py-1 flex-1 ${isActive("/messages") ? "text-primary" : "text-muted-foreground"}`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px] leading-tight truncate">{t("nav.messages")}</span>
        </button>
        <button
          onClick={() => navigate("/profile")}
          className={`flex flex-col items-center gap-0.5 py-1 flex-1 ${isActive("/profile") ? "text-primary" : "text-muted-foreground"}`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] leading-tight truncate">{t("nav.profile")}</span>
        </button>
      </div>
    </nav>
  );
};
