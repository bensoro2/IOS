import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createNotification } from "@/hooks/useNotifications";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Video, Upload, X, Loader2 } from "lucide-react";
import { BUCKET_REEL_VIDEOS } from "@/config/defaults";
import { useLanguage } from "@/contexts/LanguageContext";

interface CreateReelDialogProps {
  children: React.ReactNode;
  onReelCreated: () => void;
}

/** จับ frame จากวิดีโอที่เวลาที่กำหนดแล้วแปลงเป็น Blob (JPEG) */
const captureFrameAt = (videoObjectUrl: string, timeInSeconds: number): Promise<Blob | null> => {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.src = videoObjectUrl;
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;
    video.currentTime = timeInSeconds;

    const cleanup = () => { video.src = ""; };

    video.addEventListener("seeked", () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 720;
        canvas.height = 1280;
        const ctx = canvas.getContext("2d");
        if (!ctx) { cleanup(); resolve(null); return; }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => { cleanup(); resolve(blob); }, "image/jpeg", 0.85);
      } catch {
        cleanup();
        resolve(null);
      }
    }, { once: true });

    video.addEventListener("error", () => { cleanup(); resolve(null); }, { once: true });
    video.load();
  });
};

/** จับหลายเฟรมจากวิดีโอสำหรับตรวจสอบเนื้อหา */
const captureMultipleFrames = async (videoObjectUrl: string): Promise<Blob[]> => {
  const timestamps = [1, 5, 10, 15, 20];
  const blobs: Blob[] = [];
  for (const t of timestamps) {
    const blob = await captureFrameAt(videoObjectUrl, t);
    if (blob) blobs.push(blob);
  }
  return blobs;
};

export const CreateReelDialog = ({ children, onReelCreated }: CreateReelDialogProps) => {
  const [open, setOpen] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error(t("reel.videoOnly"));
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      toast.error(t("reel.fileTooLarge"));
      return;
    }

    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handleRemoveVideo = () => {
    setVideoFile(null);
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
      setVideoPreview(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!videoFile) { toast.error(t("reel.selectVideo")); return; }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error(t("toast.loginFirst")); return; }

      const fileExt = videoFile.name.split(".").pop();
      const baseName = `${user.id}/${Date.now()}`;

      let thumbBlob: Blob | null = null;
      let thumbnailUrl: string | null = null;
      let moderationImageUrls: string[] = [];

      if (videoPreview) {
        const frameBlobs = await captureMultipleFrames(videoPreview);
        thumbBlob = frameBlobs[0] || null;

        for (const blob of frameBlobs) {
          const arrayBuffer = await blob.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
          moderationImageUrls.push(`data:image/jpeg;base64,${base64}`);
        }
      }

      const { data: modResult, error: modError } = await supabase.functions.invoke("moderate-content", {
        body: {
          title: "Reel",
          description: description.trim() || "",
          imageUrls: moderationImageUrls.length > 0 ? moderationImageUrls : undefined,
        },
      });

      if (!modError && modResult && modResult.safe === false) {
        toast.error(modResult.reason || t("create.contentUnsafe"));
        setUploading(false);
        return;
      }

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_REEL_VIDEOS)
        .upload(`${baseName}.${fileExt}`, videoFile, { cacheControl: "3600", upsert: false });
      if (uploadError) throw uploadError;

      const { data: { publicUrl: videoUrl } } = supabase.storage
        .from(BUCKET_REEL_VIDEOS)
        .getPublicUrl(uploadData.path);

      if (thumbBlob) {
        const { data: thumbData, error: thumbError } = await supabase.storage
          .from(BUCKET_REEL_VIDEOS)
          .upload(`${baseName}_thumb.jpg`, thumbBlob, {
            cacheControl: "3600",
            upsert: false,
            contentType: "image/jpeg",
          });
        if (!thumbError && thumbData) {
          const { data: { publicUrl } } = supabase.storage
            .from(BUCKET_REEL_VIDEOS)
            .getPublicUrl(thumbData.path);
          thumbnailUrl = publicUrl;
        }
      }

      const { data: reelData, error: insertError } = await supabase
        .from("reels")
        .insert({
          user_id: user.id,
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl,
          description: description.trim() || null,
          music_name: null,
        })
        .select("id")
        .single();
      if (insertError) throw insertError;

      if (reelData?.id) {
        supabase.functions.invoke("categorize-reel", {
          body: { reel_id: reelData.id, description: description.trim() || "" },
        }).catch((err) => console.warn("Auto-categorize failed:", err));
      }

      const { data: followers } = await supabase
        .from("follows").select("follower_id").eq("following_id", user.id);
      if (followers) {
        for (const f of followers) {
          createNotification({ userId: f.follower_id, actorId: user.id, type: "reel_post" });
        }
      }

      toast.success(t("reel.success"));
      handleRemoveVideo();
      setDescription("");
      setOpen(false);
      onReelCreated();
    } catch (error: any) {
      console.error("Error creating reel:", error);
      toast.error(error.message || t("reel.errorPost"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            {t("reel.createTitle")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("reel.uploadVideo")}</Label>
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="video/*" className="hidden" />

            {videoPreview ? (
              <div className="relative aspect-[9/16] max-h-80 mx-auto rounded-lg overflow-hidden bg-black">
                <video src={videoPreview} className="w-full h-full object-contain" controls />
                <button type="button" onClick={handleRemoveVideo}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 transition-colors">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ) : (
              <div onClick={() => fileInputRef.current?.click()}
                className="aspect-[9/16] max-h-80 mx-auto border-2 border-dashed border-primary/50 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors bg-muted/30 text-center">
                <Upload className="w-10 h-10 text-muted-foreground mb-2" />
                <p className="text-sm text-foreground font-medium">{t("reel.clickToUpload")}</p>
                <p className="text-xs text-muted-foreground">{t("reel.recommendSize")}</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t("reel.description")}</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder={t("reel.descPlaceholder")} className="resize-none" rows={3} />
          </div>

          <Button onClick={handleSubmit} disabled={!videoFile || uploading} className="w-full">
            {uploading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t("reel.uploading")}</>
            ) : (
              <><Video className="w-4 h-4 mr-2" />{t("reel.postReel")}</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
