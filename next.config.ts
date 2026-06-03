import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  // Serwist uses webpack; disable in dev so Turbopack can run unimpeded.
  // Production builds must use: next build --webpack
  disable: process.env.NODE_ENV !== "production",
});

const nextConfig: NextConfig = {
  // Explicit empty turbopack config silences the "webpack config present" warning
  // emitted in dev when serwist registers its webpack plugin while disabled.
  turbopack: {},
};

export default withSerwist(nextConfig);
