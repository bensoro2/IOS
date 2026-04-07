import { useNavigate } from "react-router-dom";
import { ArrowLeft, HelpCircle, Shield, KeyRound, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const PrivacySecurity = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="flex items-center gap-4 px-4 py-3 bg-card border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-lg">{t("privacySecurity.title")}</h1>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4 overflow-y-auto pb-8">
        <div className="bg-card rounded-xl overflow-hidden">
          <button onClick={() => navigate("/help")} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
            <HelpCircle className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-left">{t("privacySecurity.helpCenter")}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="h-px bg-border mx-4" />
          <button onClick={() => navigate("/privacy-policy")} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
            <Shield className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-left">{t("privacySecurity.privacyPolicy")}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="h-px bg-border mx-4" />
          <button onClick={() => navigate("/terms")} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
            <HelpCircle className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-left">{t("privacySecurity.terms")}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="h-px bg-border mx-4" />
          <button onClick={() => navigate("/change-password")} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
            <KeyRound className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-left">{t("privacySecurity.changePassword")}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </main>
    </div>
  );
};

export default PrivacySecurity;
