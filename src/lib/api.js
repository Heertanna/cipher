const BASE_URL = "http://localhost:3001";

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
  try {
    const res = await fetch(`${BASE_URL}/onboarding/identity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alias, password }),
    });
    return await parseJsonResponse(res);
  } catch (e) {
    if (e instanceof TypeError) {
      throw new Error("Network error. Check that the server is running.");
    }
    throw e;
  }
};

export const saveHealthProfile = async (anonymousId, encryptionKey, healthData) => {
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
      throw new Error("Network error. Check that the server is running.");
    }
    throw e;
  }
};

export const setTier = async (anonymousId, tier) => {
  try {
    const res = await fetch(`${BASE_URL}/onboarding/tier`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anonymousId, tier }),
    });
    return await parseJsonResponse(res);
  } catch (e) {
    if (e instanceof TypeError) {
      throw new Error("Network error. Check that the server is running.");
    }
    throw e;
  }
};

/**
 * Upload encrypted documents. Uses XMLHttpRequest for upload progress.
 * @param {string} anonymousId
 * @param {File[]} files
 * @param {(pct: number) => void} [onProgress] 0–100 while uploading
 */
export const uploadDocuments = async (anonymousId, files, onProgress) => {
  if (!anonymousId) {
    throw new Error("Your session expired. Please go back and create your identity again.");
  }
  if (!files?.length) {
    return { skipped: true };
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("anonymousId", anonymousId);
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
      reject(new Error("Network error. Check that the server is running."));
    };

    xhr.send(formData);
  });
};
