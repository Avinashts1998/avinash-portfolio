// Admin Session Management utilizing sessionStorage (and mirrored to localStorage for tab/reload resilience)
export function setAdminSession(userEmail: string) {
  try {
    sessionStorage.setItem("is_admin_authenticated", "true");
    sessionStorage.setItem("admin_user", userEmail);
    sessionStorage.setItem("admin_login_at", Date.now().toString());
  } catch (err) {
    console.warn("Could not write to sessionStorage:", err);
  }

  try {
    localStorage.setItem("is_admin_authenticated", "true");
    localStorage.setItem("admin_user", userEmail);
    localStorage.setItem("admin_login_at", Date.now().toString());
  } catch (err) {
    console.warn("Could not write to localStorage:", err);
  }

  window.dispatchEvent(new Event("portfolio_data_update"));
  window.dispatchEvent(new Event("portfolio_admin_auth_changed"));
}

export function isAdminAuthenticated(): boolean {
  try {
    // 1. Check active browser sessionStorage
    const sessionAuth = sessionStorage.getItem("is_admin_authenticated");
    if (sessionAuth === "true") {
      return true;
    }

    // 2. Fallback check from localStorage to restore session into sessionStorage
    const localAuth = localStorage.getItem("is_admin_authenticated");
    if (localAuth === "true") {
      const user = localStorage.getItem("admin_user") || "admin";
      sessionStorage.setItem("is_admin_authenticated", "true");
      sessionStorage.setItem("admin_user", user);
      return true;
    }
  } catch (err) {
    console.warn("Storage access error:", err);
  }

  return false;
}

export function getAdminUser(): string | null {
  try {
    return (
      sessionStorage.getItem("admin_user") ||
      localStorage.getItem("admin_user") ||
      null
    );
  } catch {
    return null;
  }
}

export function clearAdminSession() {
  try {
    sessionStorage.removeItem("is_admin_authenticated");
    sessionStorage.removeItem("admin_user");
    sessionStorage.removeItem("admin_login_at");
    sessionStorage.removeItem("admin_session_expiry");
  } catch (err) {
    console.warn("Error clearing sessionStorage:", err);
  }

  try {
    localStorage.removeItem("is_admin_authenticated");
    localStorage.removeItem("admin_user");
    localStorage.removeItem("admin_login_at");
    localStorage.removeItem("admin_session_expiry");
  } catch (err) {
    console.warn("Error clearing localStorage:", err);
  }

  window.dispatchEvent(new Event("portfolio_data_update"));
  window.dispatchEvent(new Event("portfolio_admin_auth_changed"));
}

