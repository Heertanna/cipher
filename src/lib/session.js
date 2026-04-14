const ANON_KEY = "anonymousId";
const ENC_KEY = "encryptionKey";

function readAnonymousId() {
  const fromSession = sessionStorage.getItem(ANON_KEY);
  if (fromSession) return fromSession;
  try {
    return window.localStorage.getItem(ANON_KEY) || "";
  } catch {
    return "";
  }
}

export const saveSession = (anonymousId, encryptionKey) => {
  sessionStorage.setItem(ANON_KEY, anonymousId);
  sessionStorage.setItem(ENC_KEY, encryptionKey);
  try {
    if (anonymousId) {
      window.localStorage.setItem(ANON_KEY, anonymousId);
    }
  } catch {
    // quota / private mode
  }
};

export const getSession = () => ({
  anonymousId: readAnonymousId(),
  encryptionKey: sessionStorage.getItem(ENC_KEY),
});

export const clearSession = () => {
  sessionStorage.clear();
  try {
    window.localStorage.removeItem(ANON_KEY);
  } catch {
    // ignore
  }
};
