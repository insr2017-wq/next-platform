import type { ReactNode } from "react";
import { Container } from "@/components/layout/Container";
import { Header } from "@/components/layout/Header";

type TopBanner = {
  src: string;
  alt?: string;
  height?: number;
  fullWidth?: boolean;
  position?: string;
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
  const bannerPosition = topBanner?.position ?? "center";

  return (
    <div style={{ position: "relative" }}>
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
                }),
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${topBanner!.src})`,
              backgroundSize: "cover",
              backgroundPosition: bannerPosition,
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
                "linear-gradient(to top, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.12) 45%, transparent 75%)",
              pointerEvents: "none",
            }}
          />
        </div>
      )}
      <div style={{ position: "relative", zIndex: 1 }}>
        <Container>
          <main
            style={{
              paddingTop: hasBanner ? 26 : hideHeader ? 24 : 18,
              marginTop: hasBanner ? -44 : 0,
              paddingBottom: 20,
            }}
          >
            {children}
          </main>
        </Container>
      </div>
    </div>
  );
}

