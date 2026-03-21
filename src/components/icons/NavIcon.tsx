import type { CSSProperties } from "react";

type IconName = "home" | "invite" | "vip" | "profile";

type NavIconProps = {
  name: IconName;
  active?: boolean;
  size?: number;
  style?: CSSProperties;
};

export function NavIcon({ name, active, size = 22, style }: NavIconProps) {
  const color = active ? "var(--brand)" : "rgba(17,24,39,0.45)";

  const common = {
    width: size,
    height: size,
    display: "block",
  } as const;

  switch (name) {
    case "home":
      return (
        <svg viewBox="0 0 24 24" style={{ ...common, ...style }} aria-hidden="true">
          <path
            d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "invite":
      return (
        <svg viewBox="0 0 24 24" style={{ ...common, ...style }} aria-hidden="true">
          <path
            d="M12 21s-7-4.4-9.4-9C.7 8.2 3 5.5 6.2 5.5c1.9 0 3.3 1 3.8 2 .5-1 2-2 3.8-2C17 5.5 19.3 8.2 21.4 12c-2.4 4.6-9.4 9-9.4 9Z"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "vip":
      return (
        <svg viewBox="0 0 24 24" style={{ ...common, ...style }} aria-hidden="true">
          <path
            d="M6 4h12l-1 7a5 5 0 0 1-5 4H12a5 5 0 0 1-5-4L6 4Z"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M9 20h6M10 15l-1 5m6-5 1 5"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case "profile":
      return (
        <svg viewBox="0 0 24 24" style={{ ...common, ...style }} aria-hidden="true">
          <path
            d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
            fill="none"
            stroke={color}
            strokeWidth="2"
          />
          <path
            d="M4 20c1.6-4 14.4-4 16 0"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
  }
}

