"use client";

import { useState } from "react";

function ImagePlaceholder({ name }: { name: string }) {
  return (
    <div
      style={{
        width: "100%",
        aspectRatio: "16 / 9",
        background: "linear-gradient(135deg, #e5e7eb, #f9fafb)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          background:
            "radial-gradient(circle at 20% 20%, rgba(248,250,252,1), transparent 55%), radial-gradient(circle at 80% 80%, rgba(248,250,252,0.9), transparent 55%)",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "flex-start",
          padding: 16,
        }}
      >
        <div
          style={{
            background: "rgba(0,0,0,0.24)",
            color: "#fff",
            padding: "4px 10px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {name}
        </div>
      </div>
    </div>
  );
}

type Props = { name: string; src: string };

export function ProductCardImage({ name, src }: Props) {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return <ImagePlaceholder name={name} />;
  }
  return (
    <div
      style={{
        width: "100%",
        aspectRatio: "16 / 9",
        background: "#f3f4f6",
        overflow: "hidden",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={name}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
        onError={() => setBroken(true)}
      />
    </div>
  );
}
