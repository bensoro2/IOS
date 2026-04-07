import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

const REPORT_REASON_KEYS = [
  "report.reason.sexual",
  "report.reason.harassment",
  "report.reason.impersonation",
  "report.reason.misinformation",
  "report.reason.violence",
  "report.reason.spam",
  "report.reason.other",
];

interface ReportUserSheetProps {
  reportedUserId: string;
  reportedUserName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ReportUserSheet = ({
  reportedUserId,
  reportedUserName,
  open,
  onOpenChange,
}: ReportUserSheetProps) => {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [otherDetail, setOtherDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const submitReport = async (reason: string) => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("user_reports" as any).insert({
        reporter_id: user.id,
        reported_id: reportedUserId,
        reason,
      } as any);

      if (error) {
        if (error.code === "23505") {
          toast({ title: t("report.alreadyReportedUser"), variant: "destructive" });
        } else {
          throw error;
        }
      } else {
        toast({ title: t("report.success"), description: t("report.successDesc") });
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error reporting user:", error);
      toast({ title: t("common.error"), variant: "destructive" });
    } finally {
      setSubmitting(false);
      setSelectedReason(null);
      setOtherDetail("");
    }
  };

  const handleReasonClick = (reasonKey: string) => {
    if (reasonKey === "report.reason.other") {
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
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          setSelectedReason(null);
          setOtherDetail("");
        }
      }}
    >
      <SheetContent
        side="bottom"
        className="bg-card rounded-t-2xl max-h-[80vh] overflow-y-auto"
      >
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
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setSelectedReason(null)}
              >
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
              <p className="text-foreground font-semibold text-sm">
                {t("report.selectProblem")}
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                {t("report.userDesc")}
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
