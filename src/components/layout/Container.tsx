import type { ReactNode } from "react";

type ContainerProps = {
  children: ReactNode;
};

export function Container({ children }: ContainerProps) {
  return (
    <div
      style={{
        maxWidth: "var(--container-max)",
        margin: "0 auto",
        paddingLeft: "var(--gutter)",
        paddingRight: "var(--gutter)",
      }}
    >
      {children}
    </div>
  );
}

