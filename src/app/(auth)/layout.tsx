import type { ReactNode } from "react";
import { Container } from "@/components/layout/Container";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Container>
        <main style={{ paddingTop: 32, paddingBottom: 32 }}>{children}</main>
      </Container>
    </div>
  );
}

