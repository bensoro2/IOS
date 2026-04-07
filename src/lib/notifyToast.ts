import { toast } from "sonner";
import { getNotificationsEnabled } from "@/hooks/useNotificationPreference";

type ToastArgs = Parameters<typeof toast>;

/** Shows a sonner toast only if notifications are enabled */
export const notifyToast = (...args: ToastArgs) => {
  if (!getNotificationsEnabled()) return;
  return toast(...args);
};

/** Always shows toast regardless of preference (for errors, destructive actions) */
export const alwaysToast = toast;
