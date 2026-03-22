const ACCENT = "#b5ec34";

function getAliasSeed() {
  try {
    const raw = window.localStorage.getItem("cipher_identity");
    if (!raw) return "care-protocol";
    const parsed = JSON.parse(raw);
    return parsed?.alias || "care-protocol";
  } catch {
    return "care-protocol";
  }
}

/**
 * Strict avatar rules:
 * - seed uses ONLY alias
 * - config uses ONLY ageRange + gender
 */
export function getAvatarConfig({ ageRange, gender }) {
  const seed = getAliasSeed();

  // Age buckets (only)
  let ageConfig = {};
  if (ageRange === "0-18") {
    ageConfig = {
      scale: 92,
      frecklesProbability: 85,
      mouth: ["happy01"],
      glassesProbability: 0,
    };
  } else if (ageRange === "40-60" || ageRange === "60+") {
    ageConfig = {
      scale: 100,
      frecklesProbability: 10,
      mouth: ["happy10"],
      glassesProbability: 100,
      glasses: ["variant03"],
      hairColor: ageRange === "60+" ? ["8c8c8c"] : undefined,
    };
  } else {
    // 18-40 default
    ageConfig = {
      scale: 100,
      frecklesProbability: 25,
      mouth: ["happy06"],
      glassesProbability: 0,
    };
  }

  // Gender buckets (only)
  let genderConfig = {};
  if (gender === "Male") {
    genderConfig = {
      hair: ["variant05"],
      beardProbability: 100,
      beard: ["variant02"],
      earringsProbability: 0,
      hairAccessoriesProbability: 0,
    };
  } else if (gender === "Female") {
    genderConfig = {
      hair: ["variant30"],
      beardProbability: 0,
      earringsProbability: 100,
      earrings: ["variant02"],
      hairAccessoriesProbability: 60,
      hairAccessories: ["flowers"],
    };
  } else {
    // neutral / unspecified / other
    genderConfig = {
      hair: ["variant12"],
      beardProbability: 0,
      earringsProbability: 0,
      hairAccessoriesProbability: 0,
    };
  }

  return {
    seed,
    options: {
      radius: 50,
      backgroundColor: ["050505"],
      backgroundType: ["gradientLinear"],
      randomizeIds: true,
      outlineColor: [ACCENT.replace("#", "")],
      ...ageConfig,
      ...genderConfig,
    },
  };
}

