import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Calendar, Users, Loader2, Lock, LockOpen } from "lucide-react";
import { ActivitySelector } from "@/components/ActivitySelector";
import { ImageUpload } from "@/components/ImageUpload";
import { ProvinceSelectorInput } from "@/components/ProvinceSelectorInput";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface CreateActivityDialogProps {
  selectedProvince: string;
  trigger?: React.ReactNode;
  onActivityCreated?: () => void;
}

export const CreateActivityDialog = ({ selectedProvince, trigger, onActivityCreated }: CreateActivityDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState("");
  const [description, setDescription] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [participants, setParticipants] = useState("");
  const [province, setProvince] = useState(selectedProvince);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleSubmit = async () => {
    if (!selectedActivity) {
      toast({
        title: t("create.selectActivity"),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: t("toast.loginFirst"),
          variant: "destructive",
        });
        return;
      }
      // Rate limit: max 2 posts per user per day
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { count, error: countError } = await supabase
        .from("activities")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", todayStart.toISOString());

      if (!countError && (count ?? 0) >= 2) {
        toast({
          title: t("create.postLimitTitle"),
          description: t("create.postLimitDesc"),
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Content moderation check
      try {
        const { data: moderationData, error: moderationError } = await supabase.functions.invoke("moderate-content", {
          body: { title: selectedActivity, description, imageUrl },
        });

        if (!moderationError && moderationData && !moderationData.safe) {
          toast({
            title: t("create.contentUnsafe"),
            description: moderationData.reason || t("create.contentUnsafeDesc"),
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      } catch (modErr) {
        console.error("Moderation check failed, allowing post:", modErr);
      }

      // Create activity
      const { data: activityData, error: activityError } = await supabase.from("activities").insert({
        title: selectedActivity,
        description,
        start_date: dateTime || null,
        max_participants: participants || null,
        province,
        category: selectedActivity,
        image_url: imageUrl,
        user_id: user.id,
        is_private: isPrivate,
      }).select().single();

      if (activityError) throw activityError;

      // Create group chat for this activity
      const { data: groupChatData, error: groupChatError } = await supabase
        .from("activity_group_chats")
        .insert({
          activity_id: activityData.id,
          created_by: user.id,
        })
        .select()
        .single();

      if (groupChatError) throw groupChatError;

      // Add creator as first member of the group chat
      const { error: memberError } = await supabase
        .from("group_chat_members")
        .insert({
          group_chat_id: groupChatData.id,
          user_id: user.id,
        });

      if (memberError) throw memberError;

      toast({
        title: t("create.success"),
      });
      
      setOpen(false);
      resetForm();
      onActivityCreated?.();
    } catch (error: any) {
      toast({
        title: t("create.error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedActivity("");
    setDescription("");
    setDateTime("");
    setParticipants("");
    setProvince(selectedProvince);
    setImageUrl(null);
    setIsPrivate(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full justify-center gap-2 py-6 bg-card border-border text-foreground">
            <Plus className="w-5 h-5" />
            {t("home.createActivityPost")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{t("create.title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Activity Select */}
          <div className="space-y-2">
            <Label htmlFor="activity" className="text-sm font-medium">{t("create.activity")}</Label>
            <ActivitySelector value={selectedActivity} onValueChange={setSelectedActivity} />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">{t("create.description")}</Label>
            <Textarea
              id="description"
              placeholder={t("create.descriptionPlaceholder")}
              className="min-h-[100px] resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("create.image")}</Label>
            <ImageUpload imageUrl={imageUrl} onImageChange={setImageUrl} />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="datetime" className="text-sm font-medium flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {t("create.dateTime")}
            </Label>
            <Input
              id="datetime"
              type="date"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              min={new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })}
              className="w-full"
            />
          </div>

          {/* Province */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("create.province")}</Label>
            <ProvinceSelectorInput value={province} onValueChange={setProvince} />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className={`flex-1 gap-2 ${
                isPrivate
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground"
              }`}
              onClick={() => setIsPrivate(!isPrivate)}
            >
              {isPrivate ? <Lock className="w-4 h-4" /> : <LockOpen className="w-4 h-4" />}
              {isPrivate ? t("create.privatePost") : t("create.publicPost")}
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 bg-primary hover:bg-primary/90">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t("create.submit")}
            </Button>
          </div>

          {/* Private Post Note */}
          <p className="text-xs text-muted-foreground text-center">
            {isPrivate ? t("create.privateNote") : t("create.publicNote")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
