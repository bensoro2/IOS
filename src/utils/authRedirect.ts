const REDIRECT_KEY = "auth_redirect_url";

/** บันทึก URL ปัจจุบันแล้ว navigate ไป /auth */
export function redirectToAuth(navigate: (path: string) => void) {
  const current = window.location.pathname + window.location.search + window.location.hash;
  if (current !== "/" && !current.startsWith("/auth")) {
    sessionStorage.setItem(REDIRECT_KEY, current);
  }
  navigate("/auth");
}

/** อ่าน URL ที่เซฟไว้แล้วลบออก (เรียกหลัง login สำเร็จ) */
export function popRedirectUrl(): string {
  const url = sessionStorage.getItem(REDIRECT_KEY);
  sessionStorage.removeItem(REDIRECT_KEY);
  return url || "/";
}
