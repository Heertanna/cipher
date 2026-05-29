import { API_URL, USE_MOCK } from "../config/api.js";
import {
  mockCreateIdentity,
  mockSaveHealthProfile,
  mockSetTier,
  mockUploadDocuments,
} from "./mockApi.js";
import { getSession } from "./session.js";

const BASE_URL = API_URL;
const useMock = () => USE_MOCK || !BASE_URL;

async function parseJsonResponse(res) {
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }
  if (!res.ok) {
    const msg =
      typeof data.error === "string"
        ? data.error
        : "Something went wrong. Please try again.";
    throw new Error(msg);
  }
  return data;
}

export const createIdentity = async (alias, password) => {
  if (useMock()) return mockCreateIdentity(alias, password);
  try {
    const res = await fetch(`${BASE_URL}/onboarding/identity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alias, password }),
    });
    return await parseJsonResponse(res);
  } catch (e) {
    if (e instanceof TypeError) {
      return mockCreateIdentity(alias, password);
    }
    throw e;
  }
};

export const saveHealthProfile = async (anonymousId, encryptionKey, healthData) => {
  if (useMock()) return mockSaveHealthProfile(anonymousId, encryptionKey, healthData);
  try {
    const res = await fetch(`${BASE_URL}/onboarding/health-profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        anonymousId,
        encryptionKey,
        ageRange: healthData.ageRange,
        bloodType: healthData.bloodType,
        gender: healthData.gender,
        allergies: healthData.allergies ?? "",
        conditions: healthData.conditions ?? "",
      }),
    });
    return await parseJsonResponse(res);
  } catch (e) {
    if (e instanceof TypeError) {
      return mockSaveHealthProfile(anonymousId, encryptionKey, healthData);
    }
    throw e;
  }
};

export const setTier = async (anonymousId, tier) => {
  if (useMock()) return mockSetTier(anonymousId, tier);
  try {
    const res = await fetch(`${BASE_URL}/onboarding/tier`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anonymousId, tier }),
    });
    return await parseJsonResponse(res);
  } catch (e) {
    if (e instanceof TypeError) {
      return mockSetTier(anonymousId, tier);
    }
    throw e;
  }
};

export const uploadDocuments = async (anonymousId, files, onProgress) => {
  const { anonymousId: sessionId } = getSession();
  const id = anonymousId || sessionId;
  if (!id) {
    return { skipped: true, uploaded: 0 };
  }
  if (!files?.length) {
    return { skipped: true };
  }
  if (useMock()) return mockUploadDocuments(id, files, onProgress);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("anonymousId", id);
    for (const file of files) {
      formData.append("files", file, file.name);
    }

    xhr.open("POST", `${BASE_URL}/onboarding/documents`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && typeof onProgress === "function") {
        const pct = Math.round((event.loaded / event.total) * 100);
        onProgress(pct);
      }
    };

    xhr.onload = () => {
      try {
        const data = xhr.responseText ? JSON.parse(xhr.responseText) : {};
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data);
        } else {
          const msg =
            typeof data.error === "string"
              ? data.error
              : "Upload failed. Please try again.";
          reject(new Error(msg));
        }
      } catch {
        reject(new Error("Upload failed. Please try again."));
      }
    };

    xhr.onerror = () => {
      mockUploadDocuments(id, files, onProgress).then(resolve).catch(reject);
    };

    xhr.send(formData);
  });
};
