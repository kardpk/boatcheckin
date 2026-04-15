"use client";

import { Anchor } from "lucide-react";

interface AnchorLoaderProps {
  size?: "sm" | "md" | "lg";
  color?: "navy" | "white" | "gold";
}

export function AnchorLoader({
  size = "md",
  color = "navy",
}: AnchorLoaderProps) {
  const sizes = { sm: 16, md: 24, lg: 48 } as const;
  const px = sizes[size];

  const colorMap = {
    navy: "#0B1D3A",
    white: "#FFFFFF",
    gold: "#B8882A",
  };

  return (
    <span
      role="status"
      aria-label="Loading"
      className="inline-block"
      style={{
        animation: "anchorRock 1.2s ease-in-out infinite",
        transformOrigin: "center bottom",
        display: "inline-block",
        color: colorMap[color],
      }}
    >
      <Anchor size={px} />
    </span>
  );
}
