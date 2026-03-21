import type { CSSProperties } from "react";

export type QuickActionIconName = "wallet" | "withdraw" | "box" | "check";

type QuickActionIconProps = {
  name: QuickActionIconName;
  size?: number;
  style?: CSSProperties;
};

export function QuickActionIcon({
  name,
  size = 22,
  style,
}: QuickActionIconProps) {
  const stroke = "var(--brand)";
  const common = {
    width: size,
    height: size,
    display: "block",
  } as const;

  switch (name) {
    case "wallet":
      return (
        <svg viewBox="0 0 24 24" style={{ ...common, ...style }} aria-hidden="true">
          <path
            d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z"
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M16.5 12h4v3h-4a1.5 1.5 0 0 1 0-3Z"
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M7 8.5h8"
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case "withdraw":
      return (
        <svg viewBox="0 0 24 24" style={{ ...common, ...style }} aria-hidden="true">
          <path
            d="M12 4v12"
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M7.5 11.5 12 16l4.5-4.5"
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M5 20h14"
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case "box":
      return (
        <svg viewBox="0 0 24 24" style={{ ...common, ...style }} aria-hidden="true">
          <path
            d="M4.5 7.5 12 3l7.5 4.5V16.5L12 21l-7.5-4.5V7.5Z"
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M12 3v9l7.5 4.5"
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M4.5 7.5 12 12"
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "check":
      return (
        <svg viewBox="0 0 24 24" style={{ ...common, ...style }} aria-hidden="true">
          <path
            d="M20 6 9 17l-5-5"
            fill="none"
            stroke={stroke}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

