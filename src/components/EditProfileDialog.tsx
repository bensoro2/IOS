import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BUCKET_AVATARS } from "@/config/defaults";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
}

const EditProfileDialog = ({ open, onOpenChange, user }: EditProfileDialogProps) => {
  const { t } = useLanguage();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && user) {
      loadProfile();
    }
  }, [open, user]);

  const loadProfile = async () => {
    const { data } = await supabase
      .from("users")
      .select("display_name, bio, email, phone, birthday, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    if (data) {
      setDisplayName(data.display_name || "");
      setBio(data.bio || "");
      setEmail(data.email || user.email || "");
      setPhone(data.phone || "");
      setBirthday(data.birthday || "");
      setAvatarUrl(data.avatar_url || user.user_metadata?.avatar_url || null);
    } else {
      setDisplayName(user.user_metadata?.full_name || user.email?.split("@")[0] || "");
      setEmail(user.email || "");
      setAvatarUrl(user.user_metadata?.avatar_url || null);
      setBio("");
      setPhone("");
      setBirthday("");
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("editProfile.fileTooLarge"));
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error(t("editProfile.unsupportedFormat"));
      return;
    }

    try {
      setUploading(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from(BUCKET_AVATARS)
        .upload(fileName, file, { cacheControl: "3600", upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_AVATARS)
        .getPublicUrl(data.path);

      setAvatarUrl(publicUrl);
      toast.success(t("editProfile.uploadSuccess"));
    } catch (error: any) {
      toast.error(error.message || t("editProfile.uploadError"));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.error(t("editProfile.nameRequired"));
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({
          display_name: displayName.trim(),
          bio: bio.trim() || null,
          email: email.trim() || null,
          phone: phone.trim() || null,
          birthday: birthday || null,
          avatar_url: avatarUrl,
        })
        .eq("id", user.id);

      if (error) throw error;

      // Update auth metadata too
      await supabase.auth.updateUser({
        data: {
          display_name: displayName.trim(),
          avatar_url: avatarUrl,
        },
      });

      toast.success(t("editProfile.saveSuccess"));
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || t("editProfile.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const initial = displayName?.charAt(0)?.toUpperCase() || "U";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("editProfile.title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <Avatar className="w-24 h-24 border-2 border-primary">
                <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground shadow-md hover:opacity-90 transition-opacity"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <p className="text-xs text-muted-foreground">{t("editProfile.clickToChange")}</p>
          </div>

          {/* Display Name */}
          <div className="space-y-1.5">
            <Label>{t("editProfile.displayName")}</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t("editProfile.displayNamePlaceholder")}
              maxLength={50}
            />
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <Label>{t("editProfile.bio")}</Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t("editProfile.bioPlaceholder")}
              maxLength={200}
              rows={3}
            />
            <p className="text-xs text-muted-foreground text-right">{bio.length}/200</p>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label>{t("editProfile.email")}</Label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("editProfile.emailPlaceholder")}
              type="email"
              disabled
              className="opacity-70"
            />
            <p className="text-xs text-muted-foreground">{t("editProfile.emailNote")}</p>
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label>{t("editProfile.phone")}</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0xx-xxx-xxxx"
              type="tel"
              maxLength={15}
            />
          </div>

          {/* Birthday */}
          <div className="space-y-1.5">
            <Label>{t("editProfile.birthday")}</Label>
            <Input
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              type="date"
            />
          </div>

          {/* Save Button */}
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {t("common.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
