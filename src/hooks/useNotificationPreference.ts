import { useState, useEffect } from "react";

const STORAGE_KEY = "notifications_enabled";

export const getNotificationsEnabled = (): boolean => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === null ? true : stored === "true";
};

export const setNotificationsEnabled = (enabled: boolean) => {
  localStorage.setItem(STORAGE_KEY, String(enabled));
  window.dispatchEvent(new Event("notifications-preference-change"));
};

export const useNotificationPreference = () => {
  const [enabled, setEnabled] = useState(getNotificationsEnabled);

  useEffect(() => {
    const handler = () => setEnabled(getNotificationsEnabled());
    window.addEventListener("notifications-preference-change", handler);
    return () => window.removeEventListener("notifications-preference-change", handler);
  }, []);

  const toggle = (value: boolean) => {
    setNotificationsEnabled(value);
    setEnabled(value);
  };

  return { notificationsEnabled: enabled, setNotificationsEnabled: toggle };
};
