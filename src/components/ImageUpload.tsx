import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BUCKET_ACTIVITY_IMAGES } from "@/config/defaults";
import { useLanguage } from "@/contexts/LanguageContext";

interface ImageUploadProps {
  imageUrl: string | null;
  onImageChange: (url: string | null) => void;
}

export const ImageUpload = ({ imageUrl, onImageChange }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("upload.fileTooLarge"));
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error(t("upload.invalidType"));
      return;
    }

    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error(t("upload.loginFirst"));
        return;
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from(BUCKET_ACTIVITY_IMAGES)
        .upload(fileName, file, { cacheControl: "3600", upsert: false });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_ACTIVITY_IMAGES)
        .getPublicUrl(data.path);

      onImageChange(publicUrl);
      toast.success(t("upload.success"));
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || t("upload.error"));
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onImageChange(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <input type="file" ref={fileInputRef} onChange={handleUpload} accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" />
      {imageUrl ? (
        <div className="relative rounded-lg overflow-hidden">
          <img src={imageUrl} alt="Preview" className="w-full h-48 object-cover" />
          <button type="button" onClick={handleRemove} className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 hover:bg-background transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div onClick={handleClick} className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
          {uploading ? (
            <>
              <Loader2 className="w-10 h-10 text-primary mb-2 animate-spin" />
              <p className="text-sm text-muted-foreground">{t("upload.uploading")}</p>
            </>
          ) : (
            <>
              <ImagePlus className="w-10 h-10 text-muted-foreground mb-2" />
              <p className="text-sm text-primary font-medium">{t("upload.clickToUpload")}</p>
              <p className="text-xs text-muted-foreground">{t("upload.maxSize")}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
};
