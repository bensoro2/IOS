import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, MapPin, Users, MoreVertical, Check, Loader2, UserPlus, Clock } from "lucide-react";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDateLocale } from "@/lib/dateLocale";
import { getLocalizedProvince } from "@/components/ProvinceSelector";
import { EditActivityDialog } from "@/components/EditActivityDialog";
import { useNavigate } from "react-router-dom";
import { getSubCategoryById } from "@/constants/activityCategories";

interface ActivityCardProps {
  id: string;
  authorId?: string | null;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  startDate?: string | null;
  maxParticipants?: string | null;
  province?: string | null;
  category?: string | null;
  authorName?: string | null;
  authorAvatarUrl?: string | null;
  authorLevel?: number;
  currentParticipants?: number;
  isOwner?: boolean;
  isJoined?: boolean;
  isJoining?: boolean;
  isKicked?: boolean;
  hasPendingRequest?: boolean;
  isPrivate?: boolean;
  onJoin?: () => void;
  onRequestJoin?: () => void;
  onUpdate?: () => void;
  onDelete?: () => void;
}

export const ActivityCard = ({
  id,
  authorId,
  title,
  description,
  imageUrl,
  startDate,
  maxParticipants,
  province,
  category,
  authorName,
  authorAvatarUrl,
  authorLevel = 1,
  currentParticipants = 0,
  isOwner = false,
  isJoined = false,
  isJoining = false,
  isKicked = false,
  hasPendingRequest = false,
  isPrivate = false,
  onJoin,
  onRequestJoin,
  onUpdate,
  onDelete,
}: ActivityCardProps) => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const categoryData = category ? getSubCategoryById(category) : null;
  const formattedDate = startDate
    ? format(new Date(startDate), "d MMM yyyy, HH:mm", { locale: getDateLocale(language) })
    : null;

  const participantText = maxParticipants 
    ? `${currentParticipants} / ${maxParticipants} people`
    : null;

  return (
    <Card className="overflow-hidden">
      {imageUrl && (
        <div className="aspect-[4/3] w-full overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardContent className="p-4 space-y-2">
        {/* Title and Participants Badge */}
        <div className="flex items-start justify-between gap-2">
            <button
              className="flex items-start gap-2.5 flex-1 min-w-0 text-left"
              onClick={() => authorId && navigate(`/user/${authorId}`)}
            >
              <Avatar className="h-9 w-9 shrink-0 mt-0.5">
                <AvatarImage src={authorAvatarUrl || undefined} alt={authorName || "user"} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {(authorName || "?").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">{title}</h3>
                <div className="flex items-center gap-1.5">
                  {authorName && (
                    <span className="text-sm text-muted-foreground truncate">{authorName}</span>
                  )}
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                    Lv.{authorLevel}
                  </Badge>
                </div>
              </div>
            </button>
          <div className="flex items-center gap-2 shrink-0">
            {categoryData && (
              <span
                className="text-2xl leading-none"
                aria-label={categoryData.name}
                title={categoryData.name}
              >
                {categoryData.emoji}
              </span>
            )}
            {isOwner && (
              <EditActivityDialog
                activityId={id}
                initialData={{
                  title,
                  description,
                  startDate,
                  maxParticipants,
                  province,
                  imageUrl,
                  category,
                }}
                onActivityUpdated={onUpdate}
                onActivityDeleted={onDelete}
                trigger={
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                }
              />
            )}
          </div>
        </div>

        {/* Description */}
        {description && (
          <p className="text-muted-foreground text-sm line-clamp-1">
            {description}
          </p>
        )}

        {/* Date and Location - Same line, province aligned right */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          {formattedDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formattedDate}</span>
            </div>
          )}
          {province && (
            <div className="flex items-center gap-1">
             <MapPin className="w-4 h-4" />
              <span>{getLocalizedProvince(province, language)}</span>
            </div>
          )}
        </div>

        {/* Join Button, Joined Status, or Owner Go to Chat */}
        {isOwner ? (
          <Button 
            onClick={onJoin} 
            variant="secondary"
            className="w-full mt-2 gap-2"
          >
            <Users className="w-4 h-4" />
            {t("activity.goToChat")}
          </Button>
        ) : isKicked || (isPrivate && !isJoined) ? (
          hasPendingRequest ? (
            <Button 
              variant="outline"
              className="w-full mt-2 gap-2"
              disabled
            >
              <Clock className="w-4 h-4" />
              {t("activity.pendingApproval")}
            </Button>
          ) : (
            <Button 
              onClick={onRequestJoin} 
              variant="outline"
              className="w-full mt-2 gap-2 border-primary text-primary hover:bg-primary/10"
              disabled={isJoining}
            >
              {isJoining ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {isJoining ? t("activity.requesting") : t("activity.requestJoin")}
            </Button>
          )
        ) : isJoined ? (
          <Button 
            onClick={onJoin}
            variant="outline"
            className="w-full mt-2 gap-2"
          >
            <Check className="w-4 h-4" />
            {t("activity.joinedGoToChat")}
          </Button>
        ) : (
          <Button 
            onClick={onJoin} 
            className="w-full mt-2 gap-2"
            disabled={isJoining}
          >
            {isJoining ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Users className="w-4 h-4" />
            )}
            {isJoining ? t("activity.joining") : t("activity.joinActivity")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
