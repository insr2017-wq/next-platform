import type { ReactNode } from "react";
import { Container } from "@/components/layout/Container";
import { Header } from "@/components/layout/Header";

type TopBanner = {
  src: string;
  alt?: string;
  height?: number;
  fullWidth?: boolean;
  position?: string;
  /** cover = preenche área (pode cortar); contain = imagem inteira; natural = img responsiva sem altura fixa */
  fit?: "cover" | "contain" | "natural";
  overlay?: boolean;
  /** Proporção original da arte (ex: "1024 / 408") para o container não esticar. */
  aspectRatio?: string;
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
  const bannerFit = topBanner?.fit ?? "cover";
  const bannerOverlay = topBanner?.overlay ?? bannerFit === "cover";
  const isNaturalBanner = bannerFit === "natural";

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
            overflow: isNaturalBanner ? "visible" : "hidden",
            flexShrink: 0,
            width: "100%",
            lineHeight: isNaturalBanner ? 0 : undefined,
            boxSizing: "border-box",
            ...(isNaturalBanner
              ? { paddingTop: 12 }
              : { height: bannerHeight }),
            ...(bannerFullWidth
              ? { borderRadius: 0 }
              : {
                  borderRadius: 16,
                  marginLeft: "auto",
                  marginRight: "auto",
                  width: "calc(100% - 2 * var(--gutter))",
                  maxWidth: "calc(var(--container-max) - 2 * var(--gutter))",
                }),
          }}
        >
          {isNaturalBanner ? (
            <img
              src={topBanner!.src}
              alt={topBanner!.alt ?? ""}
              style={{
                display: "block",
                width: "100%",
                height: "auto",
                maxWidth: "100%",
                objectFit: "contain",
                objectPosition: bannerPosition,
                aspectRatio: topBanner!.aspectRatio,
                borderRadius: bannerFullWidth ? 0 : 16,
              }}
            />
          ) : (
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url(${topBanner!.src})`,
                backgroundSize: bannerFit === "contain" ? "contain" : "cover",
                backgroundPosition: bannerPosition,
                backgroundRepeat: "no-repeat",
                borderRadius: bannerFullWidth ? 0 : 20,
                backgroundColor: bannerFit === "contain" ? "#000" : undefined,
              }}
            />
          )}
          {bannerOverlay ? (
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
          ) : null}
        </div>
      )}
      <div style={{ position: "relative", zIndex: 1 }}>
        <Container>
          <main
            style={{
              paddingTop: hasBanner ? (isNaturalBanner ? 12 : 26) : hideHeader ? 24 : 18,
              marginTop: hasBanner ? (isNaturalBanner ? 0 : -44) : 0,
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

