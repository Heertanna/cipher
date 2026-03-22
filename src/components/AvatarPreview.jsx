import React, { useMemo } from "react";
import { createAvatar } from "@dicebear/core";
import { lorelei } from "@dicebear/collection";
import { getAvatarConfig } from "./AvatarConfig.js";

export function AvatarPreview({ ageRange, gender, maxWidth = 240 }) {
  const config = useMemo(() => getAvatarConfig({ ageRange, gender }), [ageRange, gender]);
  const svg = useMemo(() => {
    return createAvatar(lorelei, { seed: config.seed, ...config.options }).toString();
  }, [config.seed, config.options]);

  return (
    <div
      style={{
        width: "100%",
        maxWidth,
        aspectRatio: "1 / 1",
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.02)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* dicebear avatar */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}

