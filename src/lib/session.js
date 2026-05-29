const SESSION_KEY = "cipher_session";
const ANON_KEY = "anonymousId";
const ENC_KEY = "encryptionKey";

const DEFAULT_SESSION = {
  anonymousId: "demo_member_001",
  alias: "demo_user",
  reputationPoints: 150,
  tier: "TRUSTED",
  joinedAt: new Date().toISOString(),
};

function readCipherSession() {
  try {
    const stored = window.localStorage.getItem(SESSION_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return null;
}

function readAnonymousId() {
  const stored = readCipherSession();
  if (stored?.anonymousId) return stored.anonymousId;
  const fromSession = sessionStorage.getItem(ANON_KEY);
  if (fromSession) return fromSession;
  try {
    return window.localStorage.getItem(ANON_KEY) || "";
  } catch {
    return "";
  }
}

export function getSession() {
  const stored = readCipherSession();
  const anonymousId = readAnonymousId() || DEFAULT_SESSION.anonymousId;
  const encryptionKey =
    stored?.encryptionKey || sessionStorage.getItem(ENC_KEY) || "";
  return {
    ...DEFAULT_SESSION,
    ...stored,
    anonymousId,
    encryptionKey,
  };
}

export function saveSession(anonymousIdOrData, encryptionKey) {
  const prev = readCipherSession() || {};
  let data;
  if (typeof anonymousIdOrData === "object" && anonymousIdOrData !== null) {
    data = { ...prev, ...anonymousIdOrData };
  } else {
    data = {
      ...prev,
      anonymousId: anonymousIdOrData,
      encryptionKey: encryptionKey ?? prev.encryptionKey,
    };
  }
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(data));
    if (data.anonymousId) {
      sessionStorage.setItem(ANON_KEY, data.anonymousId);
      window.localStorage.setItem(ANON_KEY, data.anonymousId);
    }
    if (data.encryptionKey) {
      sessionStorage.setItem(ENC_KEY, data.encryptionKey);
    }
  } catch {
    // quota / private mode
  }
}

export const clearSession = () => {
  sessionStorage.clear();
  try {
    window.localStorage.removeItem(ANON_KEY);
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
};
