import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { ThaiTermsSections } from "./TermsOfService";

/**
 * Auth-themed version of Terms of Service.
 * Used when the user is not logged in (opened from /auth).
 * Forces the `default` theme + purple auth background so guests
 * see a consistent page regardless of any cached theme.
 */
const AuthTerms = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.add("auth-page-bg");
    document.body.classList.add("auth-page-bg");
    return () => {
      document.documentElement.classList.remove("auth-page-bg");
      document.body.classList.remove("auth-page-bg");
    };
  }, []);

  return (
    <div className="default min-h-screen bg-gradient-to-b from-primary via-primary/80 to-primary/40 text-foreground flex flex-col">
      <header className="flex items-center gap-4 px-4 py-3 bg-card/90 backdrop-blur border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2" aria-label="ย้อนกลับ">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-lg">ข้อตกลงและเงื่อนไขการใช้งาน</h1>
      </header>

      <main className="flex-1 px-4 py-4 overflow-y-auto pb-8 space-y-4">
        <div className="text-center space-y-1 text-white">
          <h2 className="text-xl font-bold">ข้อตกลงและเงื่อนไขการใช้งาน</h2>
          <p className="text-xs opacity-80">อัปเดตล่าสุด: 6 กรกฎาคม 2569</p>
          <p className="text-[11px] opacity-70 italic pt-1">
            ฉบับภาษาไทยเป็นฉบับที่มีผลบังคับใช้ตามกฎหมายเพียงฉบับเดียว
          </p>
        </div>

        <div className="bg-card rounded-xl overflow-hidden divide-y divide-border shadow-2xl">
          {ThaiTermsSections.map((section, i) => (
            <details key={i} className="group">
              <summary className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-muted/50 transition-colors list-none">
                <span className="flex-1 font-semibold text-sm text-primary">{section.title}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-90 shrink-0" />
              </summary>
              <div className="px-4 py-3 bg-muted/30 space-y-2">{section.content}</div>
            </details>
          ))}
        </div>

        <div className="text-center text-xs text-white/80 pt-4 pb-2 space-y-1">
          <p>© Levelon. สงวนลิขสิทธิ์.</p>
        </div>
      </main>
    </div>
  );
};

export default AuthTerms;
