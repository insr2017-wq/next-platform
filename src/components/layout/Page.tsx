import type { ReactNode } from "react";
import { Container } from "@/components/layout/Container";
import { Header } from "@/components/layout/Header";

type TopBanner = {
  src: string;
  alt?: string;
  height?: number;
  fullWidth?: boolean;
};

type PageProps = {
  title: string;
  backHref?: string;
  children?: ReactNode;
  headerTone?: "brand" | "neutral";
  topBanner?: TopBanner;
  hideHeader?: boolean;
};

export function Page({ title, backHref, children, headerTone, topBanner, hideHeader }: PageProps) {
  const hasBanner = Boolean(topBanner?.src);
  const bannerHeight = topBanner?.height ?? 180;
  const bannerFullWidth = topBanner?.fullWidth === true;

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      {!hideHeader && (
        <Header title={title} backHref={backHref} tone={headerTone} />
      )}
      {hasBanner && (
        <div
          style={{
            position: "relative",
            zIndex: 0,
            height: bannerHeight,
            overflow: "hidden",
            flexShrink: 0,
            width: "100%",
            ...(bannerFullWidth
              ? { borderRadius: 0 }
              : {
                  borderRadius: 20,
                  marginLeft: "var(--gutter)",
                  marginRight: "var(--gutter)",
                  width: "calc(100% - 2 * var(--gutter))",
                  maxWidth: "calc(var(--container-max) - 2 * var(--gutter))",
                  boxShadow: "0 20px 44px rgba(8,32,82,0.28)",
                }),
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${topBanner!.src})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              borderRadius: bannerFullWidth ? 0 : 20,
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: bannerFullWidth ? 0 : 20,
              background:
                "linear-gradient(to top, rgba(5,27,75,0.58) 0%, rgba(5,27,75,0.16) 44%, transparent 75%)",
              pointerEvents: "none",
            }}
          />
        </div>
      )}
      <div style={{ position: "relative", zIndex: 1 }}>
        <Container>
          <main
            style={{
              paddingTop: hasBanner ? 28 : hideHeader ? 22 : 14,
              marginTop: hasBanner ? -44 : 0,
              paddingBottom: 24,
            }}
          >
            {children}
          </main>
        </Container>
      </div>
    </div>
  );
}

