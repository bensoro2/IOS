import { useNavigate } from "react-router-dom";
import { ArrowLeft, HelpCircle, Mail, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const HelpCenter = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const faqs = [
    { q: t("help.faq1q"), a: t("help.faq1a") },
    { q: t("help.faq2q"), a: t("help.faq2a") },
    { q: t("help.faq3q"), a: t("help.faq3a") },
    { q: t("help.faq4q"), a: t("help.faq4a") },
    { q: t("help.faq5q"), a: t("help.faq5a") },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="flex items-center gap-4 px-4 py-3 bg-card border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-lg">{t("help.title")}</h1>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4 overflow-y-auto pb-8">
        {/* Banner */}
        <div className="bg-primary/10 rounded-xl p-4 flex items-center gap-3">
          <HelpCircle className="w-8 h-8 text-primary shrink-0" />
          <div>
            <p className="font-semibold">{t("help.bannerTitle")}</p>
            <p className="text-sm text-muted-foreground">{t("help.bannerSubtitle")}</p>
          </div>
        </div>

        {/* FAQ */}
        <div className="space-y-1">
          <h3 className="text-sm text-muted-foreground px-1 mb-2">{t("help.faqHeader")}</h3>
          <div className="bg-card rounded-xl overflow-hidden divide-y divide-border">
            {faqs.map((item, i) => (
              <details key={i} className="group">
                <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors list-none">
                  <span className="flex-1 font-medium text-sm">{item.q}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-4 py-3 bg-muted/30 text-sm text-muted-foreground">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="space-y-1">
          <h3 className="text-sm text-muted-foreground px-1 mb-2">{t("help.contactHeader")}</h3>
          <div className="bg-card rounded-xl overflow-hidden">
            <a href="mailto:levelon.app@gmail.com" className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
              <Mail className="w-5 h-5 text-primary" />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">{t("help.emailLabel")}</p>
                <p className="text-xs text-muted-foreground">levelon.app@gmail.com</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </a>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HelpCenter;
