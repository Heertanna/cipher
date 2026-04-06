const ANON_KEY = "anonymousId";
const ENC_KEY = "encryptionKey";

export const saveSession = (anonymousId, encryptionKey) => {
  sessionStorage.setItem(ANON_KEY, anonymousId);
  sessionStorage.setItem(ENC_KEY, encryptionKey);
};

export const getSession = () => ({
  anonymousId: sessionStorage.getItem(ANON_KEY),
  encryptionKey: sessionStorage.getItem(ENC_KEY),
});

export const clearSession = () => {
  sessionStorage.clear();
};
