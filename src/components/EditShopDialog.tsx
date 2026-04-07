 import { useState, useEffect } from "react";
 import { useLanguage } from "@/contexts/LanguageContext";
 import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { Textarea } from "@/components/ui/textarea";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Loader2 } from "lucide-react";
 import { ShopCategorySelector } from "@/components/ShopCategorySelector";
 import { ImageUpload } from "@/components/ImageUpload";
 import { ProvinceSelectorInput } from "@/components/ProvinceSelectorInput";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "sonner";
 
 interface EditShopDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   shop: {
     id: string;
     name: string;
     description?: string | null;
     imageUrl?: string | null;
     category?: string | null;
     province?: string | null;
   };
   onUpdate?: () => void;
 }
 
 export const EditShopDialog = ({ open, onOpenChange, shop, onUpdate }: EditShopDialogProps) => {
   const { t } = useLanguage();
   const [name, setName] = useState(shop.name);
   const [category, setCategory] = useState(shop.category || "");
   const [description, setDescription] = useState(shop.description || "");
   const [province, setProvince] = useState(shop.province || "เชียงใหม่");
   const [imageUrl, setImageUrl] = useState<string | null>(shop.imageUrl || null);
   const [isSubmitting, setIsSubmitting] = useState(false);
 
   useEffect(() => {
     if (open) {
       setName(shop.name);
       setCategory(shop.category || "");
       setDescription(shop.description || "");
       setProvince(shop.province || "เชียงใหม่");
       setImageUrl(shop.imageUrl || null);
     }
   }, [open, shop]);
 
  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error(t("shop.enterName"));
      return;
    }

    setIsSubmitting(true);
    try {
      // Content moderation check
      const { data: modResult, error: modError } = await supabase.functions.invoke("moderate-content", {
        body: { title: name.trim(), description, imageUrl: imageUrl },
      });

      if (!modError && modResult && modResult.safe === false) {
        toast.error(modResult.reason || t("shop.contentUnsafe"));
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase
        .from("shops")
        .update({
          name: name.trim(),
          category,
          description,
          province,
          image_url: imageUrl,
        })
        .eq("id", shop.id);

      if (error) throw error;
 
       toast.success(t("shop.updateSuccess"));
       onOpenChange(false);
       onUpdate?.();
     } catch (error: any) {
       toast.error(t("common.error") + ": " + error.message);
     } finally {
       setIsSubmitting(false);
     }
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle className="text-xl font-semibold text-primary text-center">{t("shop.editTitle")}</DialogTitle>
         </DialogHeader>
 
         <div className="space-y-5 py-4">
           {/* Shop Name */}
           <div className="space-y-2">
             <Label htmlFor="edit-name" className="text-sm font-medium italic">Name Shop</Label>
             <Input
               id="edit-name"
               placeholder="name shop.."
               value={name}
               onChange={(e) => setName(e.target.value)}
             />
           </div>
 
           {/* Category */}
           <div className="space-y-2">
             <Label className="text-sm font-medium">{t("shop.category")}</Label>
             <ShopCategorySelector value={category} onValueChange={setCategory} />
           </div>
 
           {/* Description */}
           <div className="space-y-2">
             <Label htmlFor="edit-description" className="text-sm font-medium">Description</Label>
             <Textarea
               id="edit-description"
               placeholder="share more details..."
               className="min-h-[100px] resize-none"
               value={description}
               onChange={(e) => setDescription(e.target.value)}
             />
           </div>
 
           {/* Image Upload */}
           <div className="space-y-2">
             <Label className="text-sm font-medium">Picture</Label>
             <ImageUpload imageUrl={imageUrl} onImageChange={setImageUrl} />
           </div>
 
           {/* Province */}
           <div className="space-y-2">
             <Label className="text-sm font-medium">{t("create.province")}</Label>
             <ProvinceSelectorInput value={province} onValueChange={setProvince} />
           </div>
 
           {/* Submit Button */}
           <Button 
             onClick={handleSubmit} 
             disabled={isSubmitting} 
             className="w-full bg-primary hover:bg-primary/90"
           >
             {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
             {t("common.save")}
           </Button>
         </div>
       </DialogContent>
     </Dialog>
   );
 };