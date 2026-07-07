"use client";
// Ambient backdrop — fixed behind all content (z=-1), mode-dependent:
//   dark  → full-bleed flag (darkUrl), object-fill so vertical tricolors aren't cropped.
//   light → team crest (lightUrl) centered as a contained watermark; falls back to flag if no logo.
// Intensity knobs live in globals.css: --flag-opacity/--flag-blur and --logo-opacity/--logo-blur.
import type { Base } from "@/lib/theme";

interface Props {
  darkUrl: string | null;
  lightUrl: string | null;
  base: Base;
}

export function FlagBackdrop({ darkUrl, lightUrl, base }: Props) {
  const isDark = base === "dark";
  const showFlag = isDark ? !!darkUrl : (!lightUrl && !!darkUrl);
  const showLogo = !isDark && !!lightUrl;

  if (!showFlag && !showLogo) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: -1 }}
    >
      {showFlag && (
        // object-fill: stretches flag to fill viewport without cropping sides.
        // scale-110: overflows container so overflow-hidden clips blur-edge artifacts.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={darkUrl!}
          alt=""
          role="presentation"
          className="absolute inset-0 w-full h-full object-fill scale-110 transition-opacity duration-500"
          style={{
            opacity: "var(--flag-opacity)",
            filter: "blur(var(--flag-blur))",
          }}
          loading="lazy"
          decoding="async"
        />
      )}
      {showLogo && (
        // Centered contained watermark — preserves crest aspect ratio, never crops.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={lightUrl!}
          alt=""
          role="presentation"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-500"
          style={{
            width: "77vmin",
            height: "77vmin",
            objectFit: "contain",
            opacity: "var(--logo-opacity)",
            filter: "blur(var(--logo-blur))",
          }}
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );
}
