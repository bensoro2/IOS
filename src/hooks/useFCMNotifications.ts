import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

// DEBUG MODE — remove after identifying issue
const DBG = (msg: string) => toast(msg, { duration: 6000 });

export function useFCMNotifications() {
  const { t } = useLanguage();

  useEffect(() => {
    DBG("FCM [1] hook mounted, isNative=" + Capacitor.isNativePlatform());
    if (!Capacitor.isNativePlatform()) return;

    const register = async () => {
      DBG("FCM [2] register() called");
      const { data: { user } } = await supabase.auth.getUser();
      DBG("FCM [3] user=" + (user?.email ?? "null"));
      if (!user) return;

      // ขอ permission
      const permResult = await PushNotifications.requestPermissions();
      DBG("FCM [4] permission=" + permResult.receive);
      if (permResult.receive !== "granted") return;

      // สร้าง Notification Channels แยกตามประเภท
      await PushNotifications.createChannel({
        id: "messages",
        name: t("notif.channelChat"),
        description: t("notif.channelChatDesc"),
        importance: 5,
        visibility: 1,
        sound: "default",
        vibration: true,
      });
      await PushNotifications.createChannel({
        id: "group_chat",
        name: t("notif.channelGroup"),
        description: t("notif.channelGroupDesc"),
        importance: 4,
        visibility: 1,
        sound: "default",
        vibration: true,
      });
      await PushNotifications.createChannel({
        id: "social",
        name: t("notif.channelSocial"),
        description: t("notif.channelSocialDesc"),
        importance: 3,
        visibility: 1,
        sound: "default",
        vibration: false,
      });

      DBG("FCM [5] calling PushNotifications.register()");
      await PushNotifications.register();
      DBG("FCM [6] register() returned");
    };

    // ได้รับ FCM token → บันทึกลง Supabase
    const tokenListener = PushNotifications.addListener("registration", async (token) => {
      DBG("FCM [7] registration event! token=" + token.value.substring(0, 20) + "...");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { DBG("FCM [8] no user in registration handler"); return; }

      const { error } = await (supabase.from("fcm_tokens") as any).upsert(
        { user_id: user.id, token: token.value },
        { onConflict: "user_id,token" }
      );
      DBG("FCM [9] upsert done, error=" + (error?.message ?? "none"));
    });

    // ดัก registration error
    const errorListener = PushNotifications.addListener(
      "registrationError",
      (err) => { DBG("FCM [ERROR] " + JSON.stringify(err)); }
    );

    // notification ที่เข้ามาตอนแอปเปิดอยู่ (foreground) → log เท่านั้น
    // useMessageNotifications จัดการ toast อยู่แล้ว
    const receivedListener = PushNotifications.addListener(
      "pushNotificationReceived",
      () => {}
    );

    // กดที่ notification → navigate ไป url ที่ส่งมา
    const actionListener = PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (action) => {
        const url = action.notification.data?.url;
        if (url) {
          const path = url.replace(window.location.origin, "");
          window.location.href = path || "/";
        }
      }
    );

    // Register on mount
    register();

    // Also register when user signs in (handles case where user wasn't logged in on mount)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") register();
    });

    return () => {
      subscription.unsubscribe();
      tokenListener.then((l) => l.remove());
      errorListener.then((l) => l.remove());
      receivedListener.then((l) => l.remove());
      actionListener.then((l) => l.remove());
    };
  }, [t]);
}
