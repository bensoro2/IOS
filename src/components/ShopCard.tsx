 import { useState } from "react";
import { MapPin, Tag, MoreVertical, Pencil, Trash2, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
 import { Card, CardContent } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
 } from "@/components/ui/dropdown-menu";
 import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
 } from "@/components/ui/alert-dialog";
import { getShopCategoryById, getLocalizedShopCategory } from "@/constants/shopCategories";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EditShopDialog } from "./EditShopDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedProvince } from "@/components/ProvinceSelector";
 
 interface ShopCardProps {
   id: string;
  userId: string;
   name: string;
   description?: string | null;
   imageUrl?: string | null;
   category?: string | null;
   province?: string | null;
   isOwner?: boolean;
   onUpdate?: () => void;
   onDelete?: () => void;
 }
 
 export const ShopCard = ({
   id,
  userId,
   name,
   description,
   imageUrl,
   category,
   province,
   isOwner,
   onUpdate,
   onDelete,
 }: ShopCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
   const navigate = useNavigate();
   const { t, language } = useLanguage();
 
   const categoryInfo = category ? getShopCategoryById(category) : null;
 
  const handleSendMessage = () => {
    navigate(`/direct/${userId}`);
  };

   const handleDelete = async () => {
     setIsDeleting(true);
     try {
       const { error } = await supabase.from("shops").delete().eq("id", id);
       if (error) throw error;
       toast.success(t("shop.deleteSuccess") || "ลบร้านค้าสำเร็จ");
       onDelete?.();
     } catch (error: any) {
       toast.error(t("shop.deleteError") || "เกิดข้อผิดพลาด: " + error.message);
     } finally {
       setIsDeleting(false);
       setShowDeleteDialog(false);
     }
   };
 
   return (
     <>
       <Card className="overflow-hidden bg-card">
         <div className="relative">
           {imageUrl ? (
             <div className="aspect-video w-full overflow-hidden">
               <img
                 src={imageUrl}
                 alt={name}
                 className="w-full h-full object-cover"
               />
             </div>
           ) : (
             <div className="aspect-video w-full bg-muted flex items-center justify-center">
               <Tag className="w-12 h-12 text-muted-foreground" />
             </div>
           )}
           
           {/* Owner actions */}
           {isOwner && (
             <div className="absolute top-2 right-2 flex gap-2">
               <Button
                 size="icon"
                 variant="secondary"
                 className="h-8 w-8 rounded-full"
                 onClick={() => setShowEditDialog(true)}
               >
                 <Pencil className="w-4 h-4" />
               </Button>
               <Button
                 size="icon"
                 variant="destructive"
                 className="h-8 w-8 rounded-full"
                 onClick={() => setShowDeleteDialog(true)}
               >
                 <Trash2 className="w-4 h-4" />
               </Button>
             </div>
           )}
         </div>
 
         <CardContent className="p-4 space-y-2">
           <div className="flex items-start justify-between">
             <h3 className="font-semibold text-lg">{name}</h3>
             {!isOwner && (
               <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                   <Button variant="ghost" size="icon" className="h-8 w-8">
                     <MoreVertical className="w-4 h-4" />
                   </Button>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent align="end">
                   <DropdownMenuItem>{t("shop.report") || "รายงาน"}</DropdownMenuItem>
                 </DropdownMenuContent>
               </DropdownMenu>
             )}
           </div>
 
           {categoryInfo && (
             <div className="flex items-center gap-1.5">
               <Tag className="w-3.5 h-3.5 text-primary" />
               <span className="text-sm text-primary font-medium">{getLocalizedShopCategory(categoryInfo.name, language)}</span>
             </div>
           )}
 
           {description && (
             <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
           )}
 
           {province && (
             <div className="flex items-center gap-1.5 text-muted-foreground">
               <MapPin className="w-3.5 h-3.5" />
               <span className="text-sm">{getLocalizedProvince(province, language)}</span>
             </div>
           )}

            {/* Send Message Button - only show if not owner */}
            {!isOwner && (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-2 gap-2"
                onClick={handleSendMessage}
              >
                <MessageSquare className="w-4 h-4" />
                {t("shop.sendMessage") || "ส่งข้อความ"}
              </Button>
            )}
         </CardContent>
       </Card>
 
       {/* Delete Confirmation Dialog */}
       <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
         <AlertDialogContent>
           <AlertDialogHeader>
              <AlertDialogTitle>{t("shop.confirmDelete") || "ยืนยันการลบร้านค้า"}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("shop.confirmDeleteDesc") || "คุณแน่ใจหรือไม่ว่าต้องการลบร้านค้านี้? การกระทำนี้ไม่สามารถย้อนกลับได้"}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel") || "ยกเลิก"}</AlertDialogCancel>
             <AlertDialogAction
               onClick={handleDelete}
               disabled={isDeleting}
               className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
             >
               {isDeleting ? (t("common.deleting") || "กำลังลบ...") : (t("common.delete") || "ลบ")}
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
 
       {/* Edit Dialog */}
       <EditShopDialog
         open={showEditDialog}
         onOpenChange={setShowEditDialog}
         shop={{ id, name, description, imageUrl, category, province }}
         onUpdate={onUpdate}
       />
     </>
   );
 };