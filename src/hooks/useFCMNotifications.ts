import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

export function useFCMNotifications() {
  const { t } = useLanguage();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const register = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // ขอ permission
      const permResult = await PushNotifications.requestPermissions();
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

      await PushNotifications.register();
    };

    // ได้รับ FCM token → บันทึกลง Supabase
    const tokenListener = PushNotifications.addListener("registration", async (token) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await (supabase.from("fcm_tokens") as any).upsert(
        { user_id: user.id, token: token.value },
        { onConflict: "user_id,token" }
      );
    });

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

    register();

    return () => {
      tokenListener.then((l) => l.remove());
      receivedListener.then((l) => l.remove());
      actionListener.then((l) => l.remove());
    };
  }, [t]);
}
