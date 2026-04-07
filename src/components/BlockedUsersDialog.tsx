 import { useState, useEffect } from "react";
 import { useLanguage } from "@/contexts/LanguageContext";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
 import { Button } from "@/components/ui/button";
 import { Loader2, Ban } from "lucide-react";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "sonner";
 
 interface BlockedUser {
   id: string;
   blocked_id: string;
   display_name: string | null;
   avatar_url: string | null;
   created_at: string;
 }
 
 interface BlockedUsersDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onCountChange?: (count: number) => void;
 }
 
 const BlockedUsersDialog = ({ open, onOpenChange, onCountChange }: BlockedUsersDialogProps) => {
   const { t } = useLanguage();
   const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
   const [loading, setLoading] = useState(true);
   const [unblockingId, setUnblockingId] = useState<string | null>(null);
 
   const fetchBlockedUsers = async () => {
     try {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) return;
 
       const { data: blocks, error } = await supabase
         .from("blocks")
         .select("id, blocked_id, created_at")
         .eq("blocker_id", user.id)
         .order("created_at", { ascending: false });
 
       if (error) throw error;
 
       if (blocks && blocks.length > 0) {
         // Fetch user info for blocked users
         const userIds = blocks.map(b => b.blocked_id);
         const { data: users } = await supabase
           .from("users")
           .select("id, display_name, avatar_url")
           .in("id", userIds);
 
         const enrichedBlocks = blocks.map(block => {
           const user = users?.find(u => u.id === block.blocked_id);
           return {
             id: block.id,
             blocked_id: block.blocked_id,
             display_name: user?.display_name || t("blockedUsers.deletedUser"),
             avatar_url: user?.avatar_url || null,
             created_at: block.created_at,
           };
         });
 
         setBlockedUsers(enrichedBlocks);
         onCountChange?.(enrichedBlocks.length);
       } else {
         setBlockedUsers([]);
         onCountChange?.(0);
       }
     } catch (error) {
       console.error("Error fetching blocked users:", error);
     } finally {
       setLoading(false);
     }
   };
 
   useEffect(() => {
     if (open) {
       setLoading(true);
       fetchBlockedUsers();
     }
   }, [open]);
 
   const handleUnblock = async (blockId: string, userName: string) => {
     setUnblockingId(blockId);
     try {
       const { error } = await supabase
         .from("blocks")
         .delete()
         .eq("id", blockId);
 
       if (error) throw error;
 
       setBlockedUsers(prev => prev.filter(b => b.id !== blockId));
       onCountChange?.(blockedUsers.length - 1);
       toast.success(t("blockedUsers.unblockSuccess").replace("{name}", userName));
     } catch (error) {
       console.error("Error unblocking user:", error);
       toast.error(t("blockedUsers.unblockError"));
     } finally {
       setUnblockingId(null);
     }
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2">
             <Ban className="w-5 h-5 text-destructive" />
             {t("blockedUsers.title")}
           </DialogTitle>
         </DialogHeader>
 
         <div className="space-y-3 mt-4">
           {loading ? (
             <div className="flex items-center justify-center py-8">
               <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
             </div>
           ) : blockedUsers.length === 0 ? (
             <div className="text-center py-8 text-muted-foreground">
               <Ban className="w-12 h-12 mx-auto mb-3 opacity-30" />
               <p>{t("blockedUsers.empty")}</p>
             </div>
           ) : (
             blockedUsers.map((user) => (
               <div
                 key={user.id}
                 className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
               >
                 <Avatar className="w-10 h-10">
                   <AvatarImage src={user.avatar_url || undefined} />
                   <AvatarFallback className="bg-primary/10 text-primary">
                     {user.display_name?.charAt(0) || "U"}
                   </AvatarFallback>
                 </Avatar>
                 <div className="flex-1 min-w-0">
                   <p className="font-medium truncate">{user.display_name}</p>
                 </div>
                 <Button
                   size="sm"
                   variant="outline"
                   onClick={() => handleUnblock(user.id, user.display_name || t("common.unknownUser"))}
                   disabled={unblockingId === user.id}
                 >
                   {unblockingId === user.id ? (
                     <Loader2 className="w-4 h-4 animate-spin" />
                   ) : (
                     t("blockedUsers.unblock")
                   )}
                 </Button>
               </div>
             ))
           )}
         </div>
       </DialogContent>
     </Dialog>
   );
 };
 
 export default BlockedUsersDialog;