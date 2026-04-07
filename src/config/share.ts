// Social platform share URL templates
// Usage: `${SHARE_URLS.facebook}${encodeURIComponent(url)}`
export const SHARE_URLS = {
  facebook: "https://www.facebook.com/sharer/sharer.php?u=",
  twitter: "https://twitter.com/intent/tweet?url=",
  line: "https://social-plugins.line.me/lineit/share?url=",
  whatsapp: "https://api.whatsapp.com/send?text=",
} as const;
