import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

const REPORT_REASON_KEYS = [
  "report.reel.inappropriate",
  "report.reel.harassment",
  "report.reel.impersonation",
  "report.reel.scam",
  "report.reel.spam",
  "report.reel.illegal",
  "report.reel.other",
];

interface ReportReelSheetProps {
  reelId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ReportReelSheet = ({ reelId, open, onOpenChange }: ReportReelSheetProps) => {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [otherDetail, setOtherDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const reset = () => {
    setSelectedReason(null);
    setOtherDetail("");
  };

  const submitReport = async (reason: string) => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("reel_reports")
        .insert({ reel_id: reelId, user_id: user.id, reason });

      if (error) {
        if (error.code === "23505") {
          toast({ title: t("report.alreadyReportedReel"), variant: "destructive" });
        } else {
          throw error;
        }
      } else {
        toast({ title: t("report.successReel"), description: t("report.successReelDesc") });
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error reporting reel:", error);
      toast({ title: t("common.error"), variant: "destructive" });
    } finally {
      setSubmitting(false);
      reset();
    }
  };

  const handleReasonClick = (reasonKey: string) => {
    if (reasonKey === "report.reel.other") {
      setSelectedReason("other");
    } else {
      submitReport(t(reasonKey));
    }
  };

  const handleOtherSubmit = () => {
    const detail = otherDetail.trim();
    if (!detail) return;
    submitReport(`${t("report.reel.other")}: ${detail}`);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <SheetContent side="bottom" className="bg-card rounded-t-2xl max-h-[80vh] overflow-y-auto">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-center">{t("report.title")}</SheetTitle>
        </SheetHeader>

        {selectedReason === "other" ? (
          <div className="flex flex-col gap-3 py-4 px-1">
            <p className="text-foreground font-medium">{t("report.enterDetail")}</p>
            <Textarea
              value={otherDetail}
              onChange={(e) => setOtherDetail(e.target.value)}
              placeholder={t("report.detailPlaceholder")}
              className="min-h-[100px]"
              maxLength={500}
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setSelectedReason(null)}>
                {t("report.back")}
              </Button>
              <Button
                className="flex-1"
                disabled={!otherDetail.trim() || submitting}
                onClick={handleOtherSubmit}
              >
                {t("report.send")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="px-1 py-3">
              <p className="text-foreground font-semibold text-sm">{t("report.selectProblem")}</p>
              <p className="text-muted-foreground text-xs mt-1">
                {t("report.reelDesc")}
              </p>
            </div>
            {REPORT_REASON_KEYS.map((reasonKey) => (
              <button
                key={reasonKey}
                disabled={submitting}
                onClick={() => handleReasonClick(reasonKey)}
                className="flex items-center justify-between py-4 px-1 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors text-left disabled:opacity-50"
              >
                <span className="text-foreground text-sm">{t(reasonKey)}</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
