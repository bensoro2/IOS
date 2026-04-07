import { useState, useEffect } from "react";

const STORAGE_KEY = "muted_group_chats";

const getMutedGroups = (): Set<string> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
};

export const isGroupMuted = (groupChatId: string): boolean => {
  return getMutedGroups().has(groupChatId);
};

export const setGroupMuted = (groupChatId: string, muted: boolean) => {
  const mutedGroups = getMutedGroups();
  if (muted) {
    mutedGroups.add(groupChatId);
  } else {
    mutedGroups.delete(groupChatId);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...mutedGroups]));
  window.dispatchEvent(new CustomEvent("group-mute-change", { detail: { groupChatId, muted } }));
};

export const useGroupNotificationMute = (groupChatId: string) => {
  const [muted, setMuted] = useState(() => isGroupMuted(groupChatId));

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      if (e.detail.groupChatId === groupChatId) {
        setMuted(e.detail.muted);
      }
    };
    window.addEventListener("group-mute-change", handler as EventListener);
    return () => window.removeEventListener("group-mute-change", handler as EventListener);
  }, [groupChatId]);

  const toggle = () => {
    const next = !muted;
    setGroupMuted(groupChatId, next);
    setMuted(next);
    return next;
  };

  return { muted, toggle };
};

// ─── DM mute ───────────────────────────────────────────────

const DM_STORAGE_KEY = "muted_dm_chats";

const getMutedDms = (): Set<string> => {
  try {
    const stored = localStorage.getItem(DM_STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
};

export const isDmMuted = (otherUserId: string): boolean => {
  return getMutedDms().has(otherUserId);
};

export const setDmMuted = (otherUserId: string, muted: boolean) => {
  const mutedDms = getMutedDms();
  if (muted) {
    mutedDms.add(otherUserId);
  } else {
    mutedDms.delete(otherUserId);
  }
  localStorage.setItem(DM_STORAGE_KEY, JSON.stringify([...mutedDms]));
  window.dispatchEvent(new CustomEvent("dm-mute-change", { detail: { otherUserId, muted } }));
};

export const useDmNotificationMute = (otherUserId: string) => {
  const [muted, setMuted] = useState(() => isDmMuted(otherUserId));

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      if (e.detail.otherUserId === otherUserId) {
        setMuted(e.detail.muted);
      }
    };
    window.addEventListener("dm-mute-change", handler as EventListener);
    return () => window.removeEventListener("dm-mute-change", handler as EventListener);
  }, [otherUserId]);

  const toggle = () => {
    const next = !muted;
    setDmMuted(otherUserId, next);
    setMuted(next);
    return next;
  };

  return { muted, toggle };
};
