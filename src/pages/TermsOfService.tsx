import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const TermsOfService = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const sections = [
    { title: t("terms.s1.title"), body: t("terms.s1.body") },
    { title: t("terms.s2.title"), body: t("terms.s2.body") },
    { title: t("terms.s3.title"), body: t("terms.s3.body") },
    { title: t("terms.s4.title"), body: t("terms.s4.body") },
    { title: t("terms.s5.title"), body: t("terms.s5.body") },
    { title: t("terms.s6.title"), body: t("terms.s6.body") },
    { title: t("terms.s7.title"), body: t("terms.s7.body") },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="flex items-center gap-4 px-4 py-3 bg-card border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-lg">{t("terms.pageTitle")}</h1>
      </header>

      <main className="flex-1 px-4 py-4 overflow-y-auto pb-8 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-primary">{t("terms.pageTitle")}</h2>
          <p className="text-xs text-muted-foreground">{t("terms.updatedAt")}</p>
        </div>

        {sections.map((section, i) => (
          <section key={i} className="bg-card rounded-xl border border-border p-4 space-y-2">
            <h3 className="font-semibold text-base text-primary">{section.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{section.body}</p>
          </section>
        ))}

        <div className="text-center text-xs text-muted-foreground pt-4 pb-2 space-y-1">
          <p>{t("terms.copyright")}</p>
          <p>{t("terms.copyrightNote")}</p>
        </div>
      </main>
    </div>
  );
};

export default TermsOfService;
