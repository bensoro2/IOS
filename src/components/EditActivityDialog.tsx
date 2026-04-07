import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Users, Loader2, Trash2 } from "lucide-react";
import { ActivitySelector } from "@/components/ActivitySelector";
import { ImageUpload } from "@/components/ImageUpload";
import { ProvinceSelectorInput } from "@/components/ProvinceSelectorInput";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface EditActivityDialogProps {
  activityId: string;
  initialData: {
    title: string;
    description?: string | null;
    startDate?: string | null;
    maxParticipants?: string | null;
    province?: string | null;
    imageUrl?: string | null;
    category?: string | null;
  };
  trigger?: React.ReactNode;
  onActivityUpdated?: () => void;
  onActivityDeleted?: () => void;
}

export const EditActivityDialog = ({ 
  activityId,
  initialData, 
  trigger, 
  onActivityUpdated,
  onActivityDeleted 
}: EditActivityDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(initialData.category || initialData.title || "");
  const [description, setDescription] = useState(initialData.description || "");
  const [dateTime, setDateTime] = useState(initialData.startDate ? initialData.startDate.slice(0, 16) : "");
  const [participants, setParticipants] = useState(initialData.maxParticipants || "");
  const [province, setProvince] = useState(initialData.province || "");
  const [imageUrl, setImageUrl] = useState<string | null>(initialData.imageUrl || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    if (open) {
      setSelectedActivity(initialData.category || initialData.title || "");
      setDescription(initialData.description || "");
      setDateTime(initialData.startDate ? initialData.startDate.slice(0, 16) : "");
      setParticipants(initialData.maxParticipants || "");
      setProvince(initialData.province || "");
      setImageUrl(initialData.imageUrl || null);
    }
  }, [open, initialData]);

  const handleSubmit = async () => {
    if (!selectedActivity) {
      toast({
        title: t("edit.selectActivity"),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("activities")
        .update({
          title: selectedActivity,
          description,
          start_date: dateTime || null,
          max_participants: participants || null,
          province,
          category: selectedActivity,
          image_url: imageUrl,
        })
        .eq("id", activityId);

      if (error) throw error;

      toast({
        title: t("edit.updateSuccess"),
      });
      
      setOpen(false);
      onActivityUpdated?.();
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

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("activities")
        .delete()
        .eq("id", activityId);

      if (error) throw error;

      toast({
        title: t("edit.deleteSuccess"),
      });
      
      setOpen(false);
      onActivityDeleted?.();
    } catch (error: any) {
      toast({
        title: t("create.error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{t("edit.title")}</DialogTitle>
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

          {/* Date and Participants */}
          <div className="grid grid-cols-2 gap-4">
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
                min={new Date().toISOString().split('T')[0]}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="participants" className="text-sm font-medium flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {t("edit.participants")}
              </Label>
              <Input
                id="participants"
                type="text"
                placeholder={t("edit.participantsPlaceholder")}
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
              />
            </div>
          </div>

          {/* Province */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("create.province")}</Label>
            <ProvinceSelectorInput value={province} onValueChange={setProvince} />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="flex-1 gap-2" disabled={isDeleting}>
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {t("edit.deletePost")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("edit.confirmDeleteTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("edit.confirmDeleteDesc")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {t("edit.deletePost")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 bg-primary hover:bg-primary/90">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t("edit.save")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
