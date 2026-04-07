 import { useState } from "react";
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { Textarea } from "@/components/ui/textarea";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Plus, Loader2 } from "lucide-react";
 import { ShopCategorySelector } from "@/components/ShopCategorySelector";
 import { ImageUpload } from "@/components/ImageUpload";
 import { ProvinceSelectorInput } from "@/components/ProvinceSelectorInput";
 import { supabase } from "@/integrations/supabase/client";
 import { useToast } from "@/hooks/use-toast";
 import { useLanguage } from "@/contexts/LanguageContext";
 
 interface CreateShopDialogProps {
   selectedProvince: string;
   trigger?: React.ReactNode;
   onShopCreated?: () => void;
 }
 
 export const CreateShopDialog = ({ selectedProvince, trigger, onShopCreated }: CreateShopDialogProps) => {
   const [open, setOpen] = useState(false);
   const [name, setName] = useState("");
   const [category, setCategory] = useState("");
   const [description, setDescription] = useState("");
   const [province, setProvince] = useState(selectedProvince);
   const [imageUrl, setImageUrl] = useState<string | null>(null);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const { toast } = useToast();
   const { t } = useLanguage();
 
  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: t("shop.enterName"),
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

      // Content moderation check
      const { data: modResult, error: modError } = await supabase.functions.invoke("moderate-content", {
        body: { title: name.trim(), description, imageUrl: imageUrl },
      });

      if (!modError && modResult && modResult.safe === false) {
         toast({
           title: t("shop.contentUnsafe"),
           description: modResult.reason || t("create.contentUnsafeDesc"),
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase.from("shops").insert({
        name: name.trim(),
        category,
        description,
        province,
        image_url: imageUrl,
        user_id: user.id,
      });

      if (error) throw error;
 
        toast({
          title: t("shop.createSuccess"),
       });
       
       setOpen(false);
       resetForm();
       onShopCreated?.();
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
     setName("");
     setCategory("");
     setDescription("");
     setProvince(selectedProvince);
     setImageUrl(null);
   };
 
   return (
     <Dialog open={open} onOpenChange={(isOpen) => {
       setOpen(isOpen);
       if (!isOpen) resetForm();
     }}>
       <DialogTrigger asChild>
         {trigger || (
           <Button size="icon" className="rounded-full">
             <Plus className="w-5 h-5" />
           </Button>
         )}
       </DialogTrigger>
       <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle className="text-xl font-semibold text-primary text-center">{t("shop.createTitle")}</DialogTitle>
         </DialogHeader>
 
         <div className="space-y-5 py-4">
           {/* Shop Name */}
           <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">{t("shop.shopName")}</Label>
              <Input
                id="name"
                placeholder={t("shop.shopNamePlaceholder")}
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
             {t("shop.createTitle")}
           </Button>
         </div>
       </DialogContent>
     </Dialog>
   );
 };