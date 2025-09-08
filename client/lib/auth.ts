export type LocalSession = {
  email: string;
  name?: string;
  isAdmin?: boolean;
};

const SESSION_KEY = "loctrack:session";

export function signInLocal(session: LocalSession) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function signOutLocal() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function getSessionLocal(): LocalSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LocalSession;
  } catch {
    return null;
  }
}
