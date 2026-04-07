 import { useState, useEffect } from "react";
 import { useLanguage } from "@/contexts/LanguageContext";
 import { supabase } from "@/integrations/supabase/client";
 import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
 import { Button } from "@/components/ui/button";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 import { Loader2, Check, X } from "lucide-react";
 import { toast } from "sonner";
 
 interface JoinRequest {
   id: string;
   user_id: string;
   group_chat_id: string;
   created_at: string;
   user_display_name: string;
   user_avatar: string | null;
   activity_title: string;
   activity_image: string | null;
 }
 
 interface JoinRequestsDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   currentUserId: string | null;
   onRequestHandled?: () => void;
 }
 
 const JoinRequestsDialog = ({
   open,
   onOpenChange,
   currentUserId,
   onRequestHandled,
 }: JoinRequestsDialogProps) => {
   const { t } = useLanguage();
   const [requests, setRequests] = useState<JoinRequest[]>([]);
   const [isLoading, setIsLoading] = useState(false);
   const [processingId, setProcessingId] = useState<string | null>(null);
 
   useEffect(() => {
     if (open && currentUserId) {
       fetchRequests();
     }
   }, [open, currentUserId]);
 
   const fetchRequests = async () => {
     if (!currentUserId) return;
     
     setIsLoading(true);
     try {
       // Get all group chats owned by this user
       const { data: ownedGroups } = await supabase
         .from("activity_group_chats")
         .select("id, activity_id, activities(title, image_url)")
         .eq("created_by", currentUserId);
 
       if (!ownedGroups || ownedGroups.length === 0) {
         setRequests([]);
         setIsLoading(false);
         return;
       }
 
       const groupIds = ownedGroups.map((g) => g.id);
 
       // Get pending requests for those groups
       const { data: pendingRequests, error } = await supabase
         .from("join_requests")
         .select("id, user_id, group_chat_id, created_at")
         .in("group_chat_id", groupIds)
         .eq("status", "pending")
         .order("created_at", { ascending: false });
 
       if (error) throw error;
 
       // Enrich with user and activity info
       const enrichedRequests = await Promise.all(
         (pendingRequests || []).map(async (req) => {
           const { data: userData } = await supabase
             .from("users")
             .select("display_name, avatar_url")
             .eq("id", req.user_id)
             .maybeSingle();
 
           const groupInfo = ownedGroups.find((g) => g.id === req.group_chat_id);
           const activity = groupInfo?.activities as { title: string; image_url: string | null } | null;
 
           return {
             ...req,
             user_display_name: userData?.display_name || t("common.unknownUser"),
             user_avatar: userData?.avatar_url || null,
             activity_title: activity?.title || t("joinRequests.activity"),
             activity_image: activity?.image_url || null,
           };
         })
       );
 
       setRequests(enrichedRequests);
     } catch (error) {
       console.error("Error fetching requests:", error);
     } finally {
       setIsLoading(false);
     }
   };
 
   const handleApprove = async (request: JoinRequest) => {
     setProcessingId(request.id);
     try {
       // Remove from kicked_members
       await supabase
         .from("kicked_members")
         .delete()
         .eq("group_chat_id", request.group_chat_id)
         .eq("user_id", request.user_id);
 
       // Add to group_chat_members
       const { error: memberError } = await supabase
         .from("group_chat_members")
         .insert({
           group_chat_id: request.group_chat_id,
           user_id: request.user_id,
         });
 
       if (memberError) throw memberError;
 
       // Update request status
       const { error: updateError } = await supabase
         .from("join_requests")
         .update({ status: "approved", responded_at: new Date().toISOString() })
         .eq("id", request.id);
 
       if (updateError) throw updateError;
 
       toast.success(t("joinRequests.approved").replace("{name}", request.user_display_name));
       setRequests((prev) => prev.filter((r) => r.id !== request.id));
       onRequestHandled?.();
     } catch (error) {
       console.error("Error approving request:", error);
       toast.error(t("joinRequests.approveError"));
     } finally {
       setProcessingId(null);
     }
   };
 
   const handleReject = async (request: JoinRequest) => {
     setProcessingId(request.id);
     try {
       const { error } = await supabase
         .from("join_requests")
         .update({ status: "rejected", responded_at: new Date().toISOString() })
         .eq("id", request.id);
 
       if (error) throw error;
 
       toast.success(t("joinRequests.rejected"));
       setRequests((prev) => prev.filter((r) => r.id !== request.id));
       onRequestHandled?.();
     } catch (error) {
       console.error("Error rejecting request:", error);
       toast.error(t("joinRequests.rejectError"));
     } finally {
       setProcessingId(null);
     }
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-sm">
         <DialogHeader>
           <DialogTitle>{t("joinRequests.title")}</DialogTitle>
         </DialogHeader>
 
         <div className="max-h-[60vh] overflow-y-auto">
           {isLoading ? (
             <div className="flex items-center justify-center py-8">
               <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
             </div>
           ) : requests.length === 0 ? (
             <p className="text-center text-muted-foreground py-8">
               {t("joinRequests.empty")}
             </p>
           ) : (
             <div className="space-y-3">
               {requests.map((request) => (
                 <div
                   key={request.id}
                   className="p-3 rounded-lg border border-border bg-card"
                 >
                   {/* Activity info */}
                   <div className="flex items-center gap-2 mb-3">
                     {request.activity_image ? (
                       <img
                         src={request.activity_image}
                         alt={request.activity_title}
                         className="w-12 h-12 rounded-lg object-cover"
                       />
                     ) : (
                       <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                         <span className="text-muted-foreground text-xs">📷</span>
                       </div>
                     )}
                     <div className="flex-1 min-w-0">
                       <p className="font-medium text-sm truncate">
                         {request.activity_title}
                       </p>
                     </div>
                   </div>
 
                   {/* User info */}
                   <div className="flex items-center gap-3">
                     <Avatar className="w-10 h-10">
                       <AvatarImage src={request.user_avatar || undefined} />
                       <AvatarFallback className="bg-primary/10 text-primary">
                         {request.user_display_name?.charAt(0) || "?"}
                       </AvatarFallback>
                     </Avatar>
                     <div className="flex-1 min-w-0">
                       <p className="font-medium truncate">
                         {request.user_display_name}
                       </p>
                       <p className="text-xs text-muted-foreground">
                         {t("joinRequests.wantsToJoin")}
                       </p>
                     </div>
                   </div>
 
                   {/* Action buttons */}
                   <div className="flex gap-2 mt-3">
                     <Button
                       size="sm"
                       className="flex-1 gap-1"
                       onClick={() => handleApprove(request)}
                       disabled={processingId === request.id}
                     >
                       {processingId === request.id ? (
                         <Loader2 className="w-4 h-4 animate-spin" />
                       ) : (
                         <Check className="w-4 h-4" />
                       )}
                       {t("common.approve")}
                     </Button>
                     <Button
                       size="sm"
                       variant="outline"
                       className="flex-1 gap-1"
                       onClick={() => handleReject(request)}
                       disabled={processingId === request.id}
                     >
                       <X className="w-4 h-4" />
                       {t("common.reject")}
                     </Button>
                   </div>
                 </div>
               ))}
             </div>
           )}
         </div>
       </DialogContent>
     </Dialog>
   );
 };
 
 export default JoinRequestsDialog;